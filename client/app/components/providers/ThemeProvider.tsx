/**
 * ThemeProvider - Manages theme state and provides theme context
 */

import { createContext, FC, ReactNode, useContext, useEffect, useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { createMantineTheme } from '~/config/theme';

/**
 * Theme type
 */
export type Theme = 'light' | 'dark';

/**
 * Theme context interface
 */
interface ThemeContextValue {
  isDarkMode: boolean;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

/**
 * Theme context
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * ThemeProvider props
 */
interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: Theme;
}

const THEME_STORAGE_KEY = 'app_theme';

/**
 * Get system theme preference
 * @returns Preferred theme based on system settings
 */
function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
}

/**
 * Get stored theme from localStorage
 * @returns Stored theme or null
 */
function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // localStorage not available
  }

  return null;
}

/**
 * ThemeProvider component
 * Manages theme state and provides theme context to children
 * @param {ReactNode} children - Child components
 * @param {Theme} [initialTheme] - Initial theme (defaults to stored or system preference)
 * @returns {JSX.Element} Provider component
 */
export const ThemeProvider: FC<ThemeProviderProps> = ({ children, initialTheme = 'light' }) => {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [mounted, setMounted] = useState(false);

  // Sync with localStorage AFTER mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    const stored = getStoredTheme();
    if (stored && stored !== initialTheme) {
      setThemeState(stored);
    }
  }, [initialTheme]);

  // Sync theme with document and localStorage (client-side only)
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    // Update document attribute
    document.documentElement.setAttribute('data-theme', theme);

    // Store in localStorage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage not available
    }
  }, [theme, mounted]);

  // Listen to system theme changes (client-side only)
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent): void => {
      // Only auto-switch if user hasn't manually set a preference
      const stored = getStoredTheme();
      if (!stored) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted]);

  /**
   * Toggle between light and dark theme
   */
  const toggleTheme = (): void => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  /**
   * Set specific theme
   * @param newTheme - Theme to set
   */
  const setTheme = (newTheme: Theme): void => {
    setThemeState(newTheme);
  };

  const isDarkMode = theme === 'dark';

  const contextValue: ThemeContextValue = {
    isDarkMode,
    theme,
    toggleTheme,
    setTheme,
  };

  // Get Mantine theme configuration
  const mantineTheme = createMantineTheme(isDarkMode);

  // Always render MantineProvider, even during SSR
  return (
    <ThemeContext.Provider value={contextValue}>
      <MantineProvider theme={mantineTheme} forceColorScheme={theme}>
        {children}
      </MantineProvider>
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access theme context
 * @returns Theme context value (safe - returns defaults during SSR)
 */
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeProvider;
