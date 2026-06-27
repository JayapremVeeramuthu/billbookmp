import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { isDemoMode, demoSettings, DEFAULT_SETTINGS } from '../lib/demo';
import type { CompanySettings } from '../types';

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      if (isDemoMode()) {
        setSettings(demoSettings.get());
        setLoading(false);
        return;
      }

      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      if (!data) throw new Error('No settings found');
      setSettings(data as CompanySettings);
    } catch {
      // Use defaults if no settings found
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (updates: Partial<CompanySettings>): Promise<void> => {
    if (isDemoMode()) {
      const updated = demoSettings.update(updates);
      setSettings(updated);
      return;
    }

    if (!settings?.id) return;
    const res = await fetch(`/api/settings/${settings.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update settings');
    }
    await fetchSettings();
  };

  return { settings, loading, updateSettings, fetchSettings };
}
