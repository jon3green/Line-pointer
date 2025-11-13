'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after duration (default 5 seconds)
    const duration = toast.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, [hideToast]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'success', title, message });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'error', title, message });
    },
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'warning', title, message });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'info', title, message });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        hideToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const config = {
    success: {
      icon: CheckCircle2,
      gradient: 'from-green-500 to-emerald-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
    },
    error: {
      icon: XCircle,
      gradient: 'from-red-500 to-rose-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
    },
    warning: {
      icon: AlertCircle,
      gradient: 'from-yellow-500 to-orange-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
    },
    info: {
      icon: Info,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
    },
  };

  const toastConfig = config[toast.type];
  const Icon = toastConfig.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.8 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 40,
      }}
      className="mb-3 pointer-events-auto"
    >
      <div
        className={`relative overflow-hidden rounded-xl border ${toastConfig.border} backdrop-blur-xl shadow-2xl min-w-[320px] max-w-md`}
      >
        {/* Background gradient */}
        <div className={`absolute inset-0 ${toastConfig.bg}`} />

        {/* Content */}
        <div className="relative z-10 p-4">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
              className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${toastConfig.gradient} flex items-center justify-center`}
            >
              <Icon className="w-5 h-5 text-white" />
            </motion.div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold ${toastConfig.text} mb-1`}>
                {toast.title}
              </h4>
              {toast.message && (
                <p className="text-sm text-gray-400 leading-relaxed">
                  {toast.message}
                </p>
              )}
            </div>

            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Progress bar */}
        {toast.duration && toast.duration > 0 && (
          <motion.div
            className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${toastConfig.gradient}`}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{
              duration: toast.duration / 1000,
              ease: 'linear',
            }}
          />
        )}

        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 1.5,
            ease: 'easeInOut',
          }}
        />
      </div>
    </motion.div>
  );
}

// Example usage component (for demonstration)
export function ToastDemo() {
  const toast = useToast();

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() =>
          toast.success('Success!', 'Your action was completed successfully.')
        }
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
      >
        Show Success
      </button>
      <button
        onClick={() =>
          toast.error('Error!', 'Something went wrong. Please try again.')
        }
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
      >
        Show Error
      </button>
      <button
        onClick={() =>
          toast.warning('Warning!', 'This action may have consequences.')
        }
        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
      >
        Show Warning
      </button>
      <button
        onClick={() => toast.info('Info', 'Here is some useful information.')}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Show Info
      </button>
    </div>
  );
}
