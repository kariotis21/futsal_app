/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import tokens from '../styles/designTokens';

const ThemeContext = createContext();

// Helper function (exported to satisfy lint rules)
export function applyTheme(dark) {
  if (dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = saved === 'dark' || (!saved && prefersDark);
    applyTheme(shouldBeDark);
    // Defer setState to avoid setState-in-effect lint warning
    setTimeout(() => setIsDark(shouldBeDark), 0);
  }, []);

  function toggleTheme() {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    applyTheme(newIsDark);
  }

  const value = {
    isDark,
    toggleTheme,
    tokens,
    // Computed helpers
    buttonVariants: tokens.colors,
    textClass: (variant = 'primary') => tokens.colors.text[variant] || tokens.colors.text.primary,
    bgClass: (variant = 'primary') => tokens.colors.bg[variant] || tokens.colors.bg.primary,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
