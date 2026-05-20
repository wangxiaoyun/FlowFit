import { create } from "zustand";
import type { Report } from "../types";
import { loadFromStorage, saveToStorage } from "../utils/storage";
import { STORAGE_KEYS } from "../constants";

interface ReportStore {
  reports: Report[];
  addReport: (report: Report) => void;
  updateReport: (id: string, content: string) => void;
  deleteReport: (id: string) => void;
}

export const useReportStore = create<ReportStore>((set, get) => ({
  reports: loadFromStorage<Report[]>(STORAGE_KEYS.REPORTS, []),

  addReport: (report) => {
    const updated = [report, ...get().reports];
    set({ reports: updated });
    saveToStorage(STORAGE_KEYS.REPORTS, updated);
  },

  updateReport: (id, content) => {
    const updated = get().reports.map((r) =>
      r.id === id ? { ...r, content, updatedAt: new Date().toISOString() } : r
    );
    set({ reports: updated });
    saveToStorage(STORAGE_KEYS.REPORTS, updated);
  },

  deleteReport: (id) => {
    const updated = get().reports.filter((r) => r.id !== id);
    set({ reports: updated });
    saveToStorage(STORAGE_KEYS.REPORTS, updated);
  },
}));
