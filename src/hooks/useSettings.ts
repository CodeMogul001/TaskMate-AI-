import { useCallback, useState } from 'react';
import { loadAppSettings, saveAppSettings } from '../lib/storage/taskRepository';
import type { AppSettings } from '../types/task';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveAppSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
