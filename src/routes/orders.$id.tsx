import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGoogleAuth } from "@/lib/google-auth";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  formatDate,
  orderStatusLabel,
  paymentStatusLabel,
} from "@/lib/labels";
import { getOrder, updateOrder, type Order } from "@/lib/sheets";
import { useCustomers, useRefreshData, useSpreadsheet } from "@/lib/workspace";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل الطلب — جُهد" },
      { name: "description", content: "عرض وتعديل تفاصيل الطلب وحالته." },
      { property: "og:title", content: "تفاصيل الطلب — جُهد" },
      { property: "og:description", content: "عرض وتعديل تفاصيل الطلب وحالته." },
    ],
  }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const { token } = useGoogleAuth();
  const { data: spreadsheetId } = useSpreadsheet();
  const { data: customers } = useCustomers();
  const refresh = useRefreshData();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", spreadsheetId, id],
    enabled: Boolean(token && spreadsheetId),
    queryFn: () => getOrder(token!, spreadsheetId!, id),
  });

  const [form, setForm] = useState<Partial<Order>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (order) setForm(order);
  }, [order]);

  const customer = (customers ?? []).find((c) => c.id === order?.customer_id);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !spreadsheetId) return;
    setSaving(true);
    try {
      await updateOrder(token, spreadsheetId, id, form);
      refresh();
      toast.success("تم تحديث الطلب");
    } catch {
      toast.error("تعذّر تحديث الطلب");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="تفاصيل الطلب">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/orders">← رجوع للطلبات</Link>
      </Button>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
      ) : !order ? (
        <p className="surface-card p-6 text-sm text-muted-foreground">لم يتم العثور على هذا الطلب.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="surface-card space-y-3 p-6">
            <h2 className="text-lg">العميل</h2>
            <p className="font-medium">{customer?.name ?? "غير مرتبط"}</p>
            <p className="text-sm text-muted-foreground" dir="auto">
              {customer?.contact || "—"}
            </p>
            <div className="flex gap-2 pt-2">
              <StatusBadge value={order.order_status} kind="order" />
              <StatusBadge value={order.payment_status} kind="payment" />
            </div>
            <dl className="space-y-1 pt-4 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <dt>رقم الطلب</dt>
                <dd dir="ltr">{order.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt>تاريخ الإنشاء</dt>
                <dd>{formatDate(order.created_at)}</dd>
              </div>
            </dl>
            {form.image_url && (
              <img
                src={form.image_url}
                alt="صورة مرجعية للطلب"
                className="mt-4 w-full rounded-xl border border-border object-cover"
              />
            )}
          </div>

          <form onSubmit={save} className="surface-card grid gap-5 p-6 md:grid-cols-2 lg:col-span-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label>وصف المنتج</Label>
              <Input
                value={form.product_description ?? ""}
                onChange={(e) => setForm({ ...form, product_description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>تفاصيل التخصيص</Label>
              <Textarea
                rows={5}
                value={form.customization_details ?? ""}
                onChange={(e) => setForm({ ...form, customization_details: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>السعر</Label>
              <Input
                type="number"
                step="0.01"
                value={form.price ?? ""}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>تاريخ التسليم</Label>
              <Input
                type="date"
                value={form.due_date ?? ""}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>حالة الدفع</Label>
              <select
                value={form.payment_status ?? "unpaid"}
                onChange={(e) => setForm({ ...form, payment_status: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {paymentStatusLabel[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>حالة الطلب</Label>
              <select
                value={form.order_status ?? "new"}
                onChange={(e) => setForm({ ...form, order_status: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {orderStatusLabel[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>رابط الصورة</Label>
              <Input
                dir="ltr"
                value={form.image_url ?? ""}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" size="lg" disabled={saving}>
                {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
