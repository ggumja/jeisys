import { useState, useEffect, useCallback } from 'react';
import { shopSettingsService } from '../services/shopSettingsService';

interface UseShopSettingsReturn {
  settings: Record<string, string>;
  loading: boolean;
  get: (key: string, fallback?: string) => string;
  getNumber: (key: string, fallback?: number) => number;
  getBool: (key: string, fallback?: boolean) => boolean;
  reload: () => void;
}

export function useShopSettings(): UseShopSettingsReturn {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    shopSettingsService.invalidateCache();
    const data = await shopSettingsService.getAll();
    setSettings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    shopSettingsService.getAll().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const get = (key: string, fallback = '') => settings[key] ?? fallback;
  const getNumber = (key: string, fallback = 0) => Number(settings[key] ?? fallback);
  const getBool = (key: string, fallback = true) =>
    settings[key] !== undefined ? settings[key] === 'true' : fallback;

  return { settings, loading, get, getNumber, getBool, reload: load };
}
