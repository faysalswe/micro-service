/**
 * COMPONENT TEMPLATE
 * Copy this template when creating new components
 *
 * Replace:
 * - ComponentName with your component name (PascalCase)
 * - Brief description with actual description
 * - Props with actual prop definitions
 *
 * Follow these rules:
 * - Always define Props interface with JSDoc
 * - Use named + default export
 * - Call hooks first, before any logic
 * - Handle edge cases with early returns
 * - Use design tokens (no hardcoded values)
 * - Use i18n for all strings
 * - Keep under 300 lines
 */

import { FC, ReactNode } from 'react';
import { useTranslation, useTheme } from '~/hooks';

/**
 * ComponentName - Brief description of what this component does
 * @param {string} prop1 - Description of prop1
 * @param {boolean} [prop2] - Optional description of prop2
 * @param {ReactNode} [children] - Optional child components
 * @returns {JSX.Element} Rendered component
 */
interface ComponentNameProps {
  prop1: string;
  prop2?: boolean;
  children?: ReactNode;
  className?: string;
  testId?: string;
}

/**
 * ComponentName component
 */
export const ComponentName: FC<ComponentNameProps> = ({
  prop1,
  prop2 = false,
  children,
  className = '',
  testId,
}) => {
  // ========== HOOKS ==========
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  // ========== STATE ==========
  // Define state here

  // ========== EFFECTS ==========
  // Define effects here

  // ========== EVENT HANDLERS ==========
  // const handleClick = (): void => {
  //   // Handler logic
  // };

  // ========== COMPUTED VALUES ==========
  // Define memoized values here

  // ========== EARLY RETURNS ==========
  if (!prop1) {
    return null;
  }

  // ========== RENDER ==========
  return (
    <div
      className={`flex gap-md items-center ${className}`}
      data-testid={testId}
      data-theme={isDarkMode ? 'dark' : 'light'}
    >
      <h2 className="text-lg font-semibold">{t('common.title')}</h2>
      <p className="text-sm text-secondary">{prop1}</p>
      {prop2 && <span>{t('common.enabled')}</span>}
      {children}
    </div>
  );
};

export default ComponentName;
