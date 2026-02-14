// Small design tokens used by components (tailwind preferred for layout)
export const colors = {
  // high-contrast, darker shades where needed for readability
  // stronger tonic colors to improve contrast (WCAG AA target)
  primary: 'bg-green-800 hover:bg-green-900 text-white',
  purple: 'bg-purple-800 hover:bg-purple-900 text-white',
  blue: 'bg-blue-700 hover:bg-blue-800 text-white',
  gray: 'bg-gray-800 hover:bg-gray-900 text-white',
  neutral: 'bg-gray-100 dark:bg-gray-900 text-black dark:text-white',
  secondary: 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white',
  orange: 'bg-orange-700 hover:bg-orange-800 text-white'
};

export const spacing = {
  pill: 'rounded-xl',
  card: 'rounded-2xl'
};

export default { colors, spacing };
