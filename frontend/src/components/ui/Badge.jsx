import { cn } from '../../utils/cn';

export function Badge({ children, variant = 'default', className, ...props }) {
  const variants = {
    default: 'bg-primary text-white',
    secondary: 'bg-gray-100 text-gray-600',
    success: 'bg-status-success/20 text-primary',
    warning: 'bg-status-warning/20 text-status-warning',
    danger: 'bg-status-error/20 text-status-error',
    outline: 'border border-gray-200 text-gray-700',
    accent: 'bg-accent text-primary',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
