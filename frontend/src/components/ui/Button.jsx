import { cn } from '../../utils/cn';

export function Button({
  children,
  variant = 'default',
  size = 'default',
  className,
  disabled,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variants = {
    default: 'bg-primary text-white hover:bg-primary-light',
    secondary: 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50',
    accent: 'bg-accent text-primary hover:bg-accent-dark',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
    ghost: 'hover:bg-gray-50 text-gray-600',
    danger: 'bg-status-error text-white hover:bg-red-700',
  };

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-sm',
    lg: 'h-12 px-6 text-lg',
    icon: 'h-10 w-10',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
