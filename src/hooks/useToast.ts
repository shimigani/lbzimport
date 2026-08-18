import { createContext, useContext } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export type ToastContextValue = {
  toast: (type: ToastType, message: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>')
  }
  return ctx
}