// Design system tokens — colors, typography, spacing, shadows, transitions
export const colors = {
  // Button variants with high contrast (WCAG AA)
  primary: 'bg-green-800 hover:bg-green-900 text-white',
  purple: 'bg-purple-800 hover:bg-purple-900 text-white',
  blue: 'bg-blue-700 hover:bg-blue-800 text-white',
  gray: 'bg-gray-800 hover:bg-gray-900 text-white',
  neutral: 'bg-gray-100 dark:bg-gray-900 text-black dark:text-white',
  secondary: 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white',
  orange: 'bg-orange-700 hover:bg-orange-800 text-white',
  
  // Semantic colors (hex for reference)
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  
  // Grayscale text/bg presets
  text: {
    primary: 'text-black dark:text-white',
    secondary: 'text-gray-600 dark:text-gray-300',
    muted: 'text-gray-500 dark:text-gray-400'
  },
  bg: {
    primary: 'bg-white dark:bg-gray-900',
    secondary: 'bg-gray-50 dark:bg-gray-800',
    tertiary: 'bg-gray-100 dark:bg-gray-700'
  }
};

export const typography = {
  h1: 'text-3xl font-bold',
  h2: 'text-2xl font-bold',
  h3: 'text-xl font-semibold',
  body: 'text-base font-normal',
  small: 'text-sm font-normal',
  label: 'text-sm font-semibold'
};

export const spacing = {
  // Radius tokens
  pill: 'rounded-xl',
  card: 'rounded-2xl',
  sm: 'rounded-lg',
  
  // Padding presets
  p: {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  },
  
  // Gap presets
  gap: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }
};

export const shadows = {
  sm: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl'
};

export const transitions = {
  fast: 'transition-all duration-150',
  normal: 'transition-all duration-300',
  slow: 'transition-all duration-500'
};

export default { colors, typography, spacing, shadows, transitions };
