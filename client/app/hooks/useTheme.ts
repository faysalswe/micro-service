/**
 * useTheme Hook
 * Provides access to theme state and theme manipulation functions
 */

import { useThemeContext, Theme } from '~/components/providers';

/**
 * Return type for useTheme hook
 */
export interface UseThemeReturn {
  isDarkMode: boolean;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

/**
 * Hook to manage theme state and toggle dark mode
 * @returns {UseThemeReturn} Theme state and manipulation functions
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isDarkMode, toggleTheme, setTheme } = useTheme();
 *
 *   return (
 *     <div>
 *       <p>Current mode: {isDarkMode ? 'Dark' : 'Light'}</p>
 *       <button onClick={toggleTheme}>Toggle Theme</button>
 *       <button onClick={() => setTheme('dark')}>Force Dark</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(): UseThemeReturn {
  try {
    const { isDarkMode, theme, toggleTheme, setTheme } = useThemeContext();

    return {
      isDarkMode,
      theme,
      toggleTheme,
      setTheme,
    };
  } catch {
    // Return default values during SSR or when used outside provider
    return {
      isDarkMode: false,
      theme: 'light',
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
}

export default useTheme;
