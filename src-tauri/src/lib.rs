use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

/// 在屏幕右下角弹出休息活动引导浮窗（无边框、置顶、跳过任务栏）。
/// reps: 总组数，hold_seconds: 每组收缩秒数。
#[tauri::command]
async fn show_kegel_popup(
    app: tauri::AppHandle,
    activity_type: String,
    reps: u32,
    hold_seconds: u32,
) -> Result<(), String> {
    // 关闭已有弹窗，防止重复
    if let Some(existing) = app.get_webview_window("kegel-popup") {
        let _ = existing.close();
    }

    let popup_w = 340.0_f64;
    let popup_h = 460.0_f64;
    let margin = 16.0_f64;

    // 通过 URL 参数将 reps/hold 传递给前端弹窗页面
    let url_path = format!(
        "?popup=kegel&activity={}&reps={}&hold={}",
        activity_type, reps, hold_seconds
    );

    let win = tauri::WebviewWindowBuilder::new(
        &app,
        "kegel-popup",
        tauri::WebviewUrl::App(url_path.into()),
    )
    .title("FlowFit")
    .inner_size(popup_w, popup_h)
    .decorations(false)   // 无标题栏
    .always_on_top(true)  // 后台也可见
    .skip_taskbar(true)   // 不占任务栏槽位
    .resizable(false)
    // 注：transparent 在 Tauri v2.11 中已移除，macOS 弹窗圆角由 CSS 自行处理
    .build()
    .map_err(|e| e.to_string())?;

    // 定位到主显示器右下角
    if let Ok(Some(monitor)) = win.primary_monitor() {
        let size = monitor.size();
        let scale = monitor.scale_factor();
        let x = (size.width as f64 / scale) - popup_w - margin;
        let y = (size.height as f64 / scale) - popup_h - margin;
        let _ = win.set_position(tauri::LogicalPosition::new(x, y));
    }

    Ok(())
}

/// 休息活动完成：由弹窗前端调用，通过 backend 向主窗口 emit 事件再关闭弹窗。
/// 使用 backend 中转比前端 emit 跨窗口更可靠。
#[tauri::command]
fn kegel_finished(app: tauri::AppHandle) {
    // 先通知主窗口进入休息阶段
    if let Some(main_win) = app.get_webview_window("main") {
        let _ = main_win.emit("kegel-done", ());
    }
    // 再关闭弹窗
    if let Some(popup_win) = app.get_webview_window("kegel-popup") {
        let _ = popup_win.close();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![show_kegel_popup, kegel_finished])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // 托盘菜单
            let show_item = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "退出番茄钟", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            // 构建系统托盘
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("番茄钟")
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    // 左键单击：切换窗口显隐
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(win) = app.get_webview_window("main") {
                            if win.is_visible().unwrap_or(false) {
                                let _ = win.hide();
                            } else {
                                let _ = win.show();
                                let _ = win.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        // 仅主窗口关闭时隐藏到托盘，不退出进程；弹窗等子窗口允许正常关闭
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
