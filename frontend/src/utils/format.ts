export function formatARS(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num || 0)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CREDIT_CARD: 'Tarjeta Crédito',
  DEBIT_CARD: 'Tarjeta Débito',
  TRANSFER: 'Transferencia',
}

export const PAYMENT_COLORS: Record<string, string> = {
  CASH: 'bg-green-500/20 text-green-400',
  CREDIT_CARD: 'bg-blue-500/20 text-blue-400',
  DEBIT_CARD: 'bg-purple-500/20 text-purple-400',
  TRANSFER: 'bg-amber-500/20 text-amber-400',
}
