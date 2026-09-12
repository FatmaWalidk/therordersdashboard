export const ORDER_STATUSES = ["new", "in_progress", "ready", "shipped", "delivered"] as const;
export const PAYMENT_STATUSES = ["unpaid", "partial", "paid"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const orderStatusLabel: Record<string, string> = {
  new: "جديد",
  in_progress: "قيد التنفيذ",
  ready: "جاهز",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
};

export const paymentStatusLabel: Record<string, string> = {
  unpaid: "غير مدفوع",
  partial: "مدفوع جزئياً",
  paid: "تم الدفع",
};

export function formatPrice(value: string | number) {
  const n = Number(value || 0);
  if (Number.isNaN(n)) return "0";
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(n);
}

export function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(d);
}
