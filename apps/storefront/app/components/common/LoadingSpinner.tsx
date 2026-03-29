/**
 * Loading Spinner Component
 * Reusable loading indicator with configurable size and color.
 */

import { Loader } from '@mantine/core';

/**
 * Loading spinner props
 */
interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Color of the spinner (Mantine color)
   * @default 'blue'
   */
  color?: string;
  /**
   * Additional CSS class
   */
  className?: string;
  /**
   * Whether to show text below spinner
   */
  withText?: boolean;
  /**
   * Custom text to display
   * @default 'Loading...'
   */
  text?: string;
  /**
   * Whether to center the spinner in its container
   * @default true
   */
  centered?: boolean;
}

/**
 * Loading spinner component
 */
export function LoadingSpinner({
  size = 'md',
  color = 'blue',
  className = '',
  withText = false,
  text = 'Loading...',
  centered = true,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <Loader size={size} color={color} />
      {withText && (
        <span className="text-sm text-gray-500">{text}</span>
      )}
    </div>
  );

  if (centered) {
    return (
      <div className="flex-center min-h-[200px]">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Full page loading spinner
 */
export function FullPageLoadingSpinner(props: Omit<LoadingSpinnerProps, 'centered'>) {
  return (
    <div className="flex-center min-h-screen">
      <LoadingSpinner {...props} centered={false} size={props.size || 'lg'} withText={props.withText ?? true} />
    </div>
  );
}