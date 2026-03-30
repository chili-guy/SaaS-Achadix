import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'error' | 'warning' | 'default'
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-green-100 text-green-800': variant === 'success',
          'bg-red-100 text-red-800': variant === 'error',
          'bg-yellow-100 text-yellow-800': variant === 'warning',
          'bg-gray-100 text-gray-700': variant === 'default',
        }
      )}
    >
      {children}
    </span>
  )
}
