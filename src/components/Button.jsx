import tokens from '../styles/designTokens';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'py-3 text-lg font-medium shadow-lg transition';
  const variantClasses = tokens.colors[variant] || tokens.colors.primary;
  const radius = 'rounded-xl';

  return (
    <button
      type={props.type || 'button'}
      className={`${base} ${radius} ${variantClasses} ${className} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500`}
      {...props}
    >
      {children}
    </button>
  );
}
