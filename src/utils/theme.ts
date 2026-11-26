export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'nusadrive_theme';

export function resolveInitialTheme(options: {
  stored?: string | null;
  prefersDark?: boolean;
}): ThemeMode {
  if (options.stored === 'dark' || options.stored === 'light') {
    return options.stored;
  }
  return options.prefersDark ? 'dark' : 'light';
}

export function toggleThemeMode(current: ThemeMode): ThemeMode {
  return current === 'dark' ? 'light' : 'dark';
}
