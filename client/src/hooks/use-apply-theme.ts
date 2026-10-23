import { useEffect } from 'react';

import { useThemeStore } from '@/stores/theme-store';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Syncs the persisted theme preference (and OS preference for "system") to the <html> element. */
export function useApplyTheme(): void {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia(DARK_QUERY);

    const apply = (): void => {
      const isDark = theme === 'dark' || (theme === 'system' && media.matches);
      root.classList.toggle('dark', isDark);
    };

    apply();

    if (theme !== 'system') return;
    media.addEventListener('change', apply);
    return () => {
      media.removeEventListener('change', apply);
    };
  }, [theme]);
}
