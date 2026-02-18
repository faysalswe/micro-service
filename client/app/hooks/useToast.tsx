/**
 * Toast Notification Hook
 * Simplified wrapper around Mantine notifications for consistent messaging.
 */

import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react';
import React from 'react';

/**
 * Toast notification type
 */
type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast notification options
 */
interface ToastOptions {
  title?: string;
  message: string;
  duration?: number;
  autoClose?: boolean;
}

/**
 * Default configuration for each toast type
 */
const TOAST_CONFIG: Record<ToastType, { color: string; icon: React.ReactNode; defaultTitle: string }> = {
  success: {
    color: 'green',
    icon: <IconCheck size={18} />,
    defaultTitle: 'Success',
  },
  error: {
    color: 'red',
    icon: <IconX size={18} />,
    defaultTitle: 'Error',
  },
  info: {
    color: 'blue',
    icon: <IconInfoCircle size={18} />,
    defaultTitle: 'Info',
  },
  warning: {
    color: 'yellow',
    icon: <IconAlertTriangle size={18} />,
    defaultTitle: 'Warning',
  },
};

/**
 * Custom toast hook
 */
export function useToast() {
  /**
   * Show a toast notification
   */
  const showToast = (type: ToastType, options: ToastOptions) => {
    const config = TOAST_CONFIG[type];
    const { title = config.defaultTitle, message, duration = 5000, autoClose = true } = options;

    notifications.show({
      title,
      message,
      color: config.color,
      icon: config.icon,
      autoClose: autoClose ? duration : false,
      withCloseButton: true,
      withBorder: true,
    });
  };

  /**
   * Show success toast
   */
  const success = (message: string, options?: Omit<ToastOptions, 'message'>) => {
    showToast('success', { message, ...options });
  };

  /**
   * Show error toast
   */
  const error = (message: string, options?: Omit<ToastOptions, 'message'>) => {
    showToast('error', { message, ...options });
  };

  /**
   * Show info toast
   */
  const info = (message: string, options?: Omit<ToastOptions, 'message'>) => {
    showToast('info', { message, ...options });
  };

  /**
   * Show warning toast
   */
  const warning = (message: string, options?: Omit<ToastOptions, 'message'>) => {
    showToast('warning', { message, ...options });
  };

  /**
   * Clear all notifications
   */
  const clearAll = () => {
    notifications.clean();
  };

  /**
   * Clear a specific notification by ID
   */
  const clear = (id: string) => {
    notifications.hide(id);
  };

  return {
    success,
    error,
    info,
    warning,
    clearAll,
    clear,
  };
}

/**
 * Hook for showing loading notification that can be updated later
 */
export function useLoadingToast() {
  const showLoading = (message: string = 'Loading...') => {
    const id = notifications.show({
      title: 'Processing',
      message,
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });
    return id;
  };

  const update = (id: string, type: ToastType, options: ToastOptions) => {
    const config = TOAST_CONFIG[type];
    const { title = config.defaultTitle, message, duration = 5000, autoClose = true } = options;

    notifications.update({
      id,
      title,
      message,
      color: config.color,
      icon: config.icon,
      autoClose: autoClose ? duration : false,
      loading: false,
      withCloseButton: true,
    });
  };

  return {
    showLoading,
    update,
  };
}