import tokens from '../styles/designTokens';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  className = '', 
  ...props 
}) {
  const base = 'font-medium shadow-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500';
  
  // Size variants
  const sizes = {
    sm: 'py-2 text-sm px-4',
    md: 'py-3 text-lg px-6',
    lg: 'py-4 text-xl px-8'
  };
  
  const variantClasses = tokens.colors[variant] || tokens.colors.primary;
  const sizeClasses = sizes[size] || sizes.md;
  const widthClass = fullWidth ? 'w-full' : '';
  const radius = tokens.spacing.pill;

  return (
    <button
      type={props.type || 'button'}
      className={`${base} ${radius} ${sizeClasses} ${variantClasses} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
