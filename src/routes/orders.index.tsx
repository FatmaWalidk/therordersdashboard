import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  formatDate,
  formatPrice,
  orderStatusLabel,
  paymentStatusLabel,
} from "@/lib/labels";
import { useCustomers, useOrders } from "@/lib/workspace";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "الطلبات — جُهد" },
      { name: "description", content: "قائمة كل الطلبات مع البحث والتصفية حسب الحالة والتاريخ." },
      { property: "og:title", content: "الطلبات — جُهد" },
      { property: "og:description", content: "قائمة كل الطلبات مع البحث والتصفية." },
    ],
  }),
  component: OrdersPage,
});

const PAGE_SIZE = 10;

function OrdersPage() {
  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({ search, orderStatus, paymentStatus, from, to }),
    [search, orderStatus, paymentStatus, from, to],
  );
  const { data: orders, isLoading } = useOrders(filters);
  const { data: customers } = useCustomers();
  const nameById = new Map((customers ?? []).map((c) => [c.id, c.name]));

  const list = orders ?? [];
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <AppShell title="الطلبات">
      <div className="surface-card mb-6 grid gap-4 p-5 md:grid-cols-5">
        <Field label="بحث">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="اسم العميل أو المنتج"
          />
        </Field>
        <Field label="حالة الطلب">
          <Select value={orderStatus} onChange={setOrderStatus} placeholder="كل الحالات">
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {orderStatusLabel[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="حالة الدفع">
          <Select value={paymentStatus} onChange={setPaymentStatus} placeholder="الكل">
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {paymentStatusLabel[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="من تاريخ">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="إلى تاريخ">
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </div>

      <div className="surface-card overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">جارٍ تحميل الطلبات...</p>
        ) : visible.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">لا توجد طلبات مطابقة.</p>
            <Button asChild className="mt-4">
              <Link to="/orders/new">إضافة طلب جديد</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">العميل</th>
                  <th className="px-4 py-3 font-medium">المنتج</th>
                  <th className="px-4 py-3 font-medium">السعر</th>
                  <th className="px-4 py-3 font-medium">الدفع</th>
                  <th className="px-4 py-3 font-medium">حالة الطلب</th>
                  <th className="px-4 py-3 font-medium">التسليم</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">{nameById.get(order.customer_id) ?? "—"}</td>
                    <td className="px-4 py-3">{order.product_description || "—"}</td>
                    <td className="px-4 py-3">{formatPrice(order.price)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge value={order.payment_status} kind="payment" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={order.order_status} kind="order" />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(order.due_date)}</td>
                    <td className="px-4 py-3">
                      <Link
                        to="/orders/$id"
                        params={{ id: order.id }}
                        className="text-primary-deep hover:underline"
                      >
                        التفاصيل
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحة {current} من {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            التالي
          </Button>
        </div>
      )}
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}
