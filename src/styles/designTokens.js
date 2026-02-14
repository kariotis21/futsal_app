// Small design tokens used by components (tailwind preferred for layout)
export const colors = {
  // high-contrast, darker shades where needed for readability
  primary: 'bg-green-700 hover:bg-green-800 text-white',
  purple: 'bg-purple-700 hover:bg-purple-800 text-white',
  blue: 'bg-blue-600 hover:bg-blue-700 text-white',
  gray: 'bg-gray-700 hover:bg-gray-800 text-white',
  neutral: 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white',
  secondary: 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white',
  orange: 'bg-orange-600 hover:bg-orange-700 text-white'
};

export const spacing = {
  pill: 'rounded-xl',
  card: 'rounded-2xl'
};

export default { colors, spacing };
