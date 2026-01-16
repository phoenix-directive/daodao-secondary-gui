import { useLocalStorage } from '@/hooks';
import { createContext, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  isDark: false,
  setIsDark: () => null,
};

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'daodao-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useLocalStorage<Theme>(storageKey, defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const value = {
    theme,
    setTheme,
    isDark: theme === 'dark',
    setIsDark: (isDark: boolean) => setTheme(isDark ? 'dark' : 'light'),
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
