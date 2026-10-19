import React from 'react';
import { cn } from '../../lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  fallback = 'U',
  size = 'md',
  className,
  ...props
}) => {
  const [hasError, setHasError] = React.useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-24 h-24 text-xl',
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden bg-indigo-100 text-indigo-700 font-semibold ring-2 ring-white shadow-xs',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{fallback.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
};
