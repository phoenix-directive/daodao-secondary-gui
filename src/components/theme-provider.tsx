import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  isDark: false,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Initialize isDark based on current theme
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    if (savedTheme === "dark") return true;
    if (savedTheme === "light") return false;
    // For system, check preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const systemTheme = mediaQuery.matches ? "dark" : "light";

      root.classList.add(systemTheme);
      setIsDark(systemTheme === "dark");

      // Listen for system theme changes
      const handler = (e: MediaQueryListEvent) => {
        const newSystemTheme = e.matches ? "dark" : "light";
        root.classList.remove("light", "dark");
        root.classList.add(newSystemTheme);
        setIsDark(newSystemTheme === "dark");
      };

      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }

    root.classList.add(theme);
    setIsDark(theme === "dark");
  }, [theme]);

  const handleThemeChange = (newTheme: Theme) => {
    if (newTheme === theme) return; // Don't transition if it's the same theme

    const root = window.document.documentElement;

    setIsTransitioning(true);
    root.classList.add("theme-transitioning");

    // After overlay fades in, change the theme
    setTimeout(() => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);

      // After theme changes, fade out overlay and re-enable animations
      setTimeout(() => {
        setIsTransitioning(false);
        root.classList.remove("theme-transitioning");
      }, 50);
    }, 200);
  };

  const value = {
    theme,
    setTheme: handleThemeChange,
    isDark,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
      {/* Theme transition overlay */}
      <div
        className={`theme-transition-overlay ${
          isTransitioning ? "active" : ""
        }`}
      />
    </ThemeProviderContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
