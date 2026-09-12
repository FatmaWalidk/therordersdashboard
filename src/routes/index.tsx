import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { ORDER_STATUSES, formatDate, formatPrice, orderStatusLabel } from "@/lib/labels";
import { useCustomers, useOrders } from "@/lib/workspace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "جُهد — لوحة الطلبات" },
      { name: "description", content: "ملخص سريع لطلباتك وإيرادات الشهر الحالي." },
      { property: "og:title", content: "جُهد — لوحة الطلبات" },
      { property: "og:description", content: "ملخص سريع لطلباتك وإيرادات الشهر الحالي." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: orders, isLoading, error } = useOrders();
  const { data: customers } = useCustomers();

  const month = new Date().toISOString().slice(0, 7);
  const list = orders ?? [];
  const revenue = list
    .filter((o) => (o.created_at || "").startsWith(month))
    .reduce((sum, o) => sum + (Number(o.price) || 0), 0);
  const paidRevenue = list
    .filter((o) => (o.created_at || "").startsWith(month) && o.payment_status === "paid")
    .reduce((sum, o) => sum + (Number(o.price) || 0), 0);
  const nameById = new Map((customers ?? []).map((c) => [c.id, c.name]));

  return (
    <AppShell title="نظرة عامة">
      {error && (
        <p className="mb-4 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          تعذّر تحميل البيانات. حاول تسجيل الدخول مرة أخرى.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="إجمالي الطلبات" value={isLoading ? "..." : String(list.length)} />
        <StatCard title="عدد العملاء" value={String(customers?.length ?? 0)} />
        <StatCard title="إيرادات هذا الشهر" value={`${formatPrice(revenue)}`} hint="كل الطلبات" />
        <StatCard title="المحصّل فعلياً" value={`${formatPrice(paidRevenue)}`} hint="المدفوع فقط" />
      </div>

      <section className="surface-card mt-6 p-6">
        <h2 className="text-lg">الطلبات حسب الحالة</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {ORDER_STATUSES.map((status) => (
            <div key={status} className="rounded-xl bg-muted/60 p-4 text-center">
              <p className="text-2xl font-bold">
                {list.filter((o) => o.order_status === status).length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{orderStatusLabel[status]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card mt-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg">أحدث الطلبات</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/orders">عرض الكل</Link>
          </Button>
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد طلبات بعد.</p>
        ) : (
          <ul className="divide-y divide-border">
            {list.slice(0, 5).map((order) => (
              <li key={order.id} className="flex flex-wrap items-center gap-3 py-3">
                <Link
                  to="/orders/$id"
                  params={{ id: order.id }}
                  className="flex-1 font-medium hover:text-primary-deep"
                >
                  {order.product_description || "طلب بدون وصف"}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {nameById.get(order.customer_id) ?? "—"}
                </span>
                <StatusBadge value={order.order_status} kind="order" />
                <span className="text-xs text-muted-foreground">{formatDate(order.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

function StatCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="surface-card p-5">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
