# Contributing to FlowFit

感谢您考虑为 FlowFit 做出贡献！无论是修复 bug、添加功能、改进文档，还是提出建议，我们都非常欢迎。

English follows below.

---

## 开发流程

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feat/your-feature`
3. 提交更改：`git commit -m "feat: add your feature"`
4. 推送到分支：`git push origin feat/your-feature`
5. 提交 Pull Request

### 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` — 新功能
- `fix:` — Bug 修复
- `docs:` — 文档变更
- `refactor:` — 重构
- `style:` — 样式/格式调整
- `chore:` — 构建/工具链变更
- `test:` — 测试相关

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 代码检查
npm run lint
```

### Pull Request 规范

- PR 标题遵循 Conventional Commits 格式
- 描述变更内容和动机
- 如果有关联的 Issue，请注明
- 确保所有测试通过，无 lint 错误

## Development Process (English)

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `refactor:` — Code refactoring
- `style:` — Formatting / style changes
- `chore:` — Build / tooling changes
- `test:` — Test-related

### Local Development

```bash
npm install
npm run dev    # Start dev server
npm test       # Run tests
npm run lint   # Lint check
```

### PR Guidelines

- PR title should follow Conventional Commits format
- Describe what and why in the description
- Link related issues if any
- Ensure all tests pass and lint is clean
