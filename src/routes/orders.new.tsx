import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGoogleAuth } from "@/lib/google-auth";
import { ORDER_STATUSES, PAYMENT_STATUSES, orderStatusLabel, paymentStatusLabel } from "@/lib/labels";
import { addCustomer, addOrder } from "@/lib/sheets";
import { useCustomers, useRefreshData, useSpreadsheet } from "@/lib/workspace";

export const Route = createFileRoute("/orders/new")({
  head: () => ({
    meta: [
      { title: "طلب جديد — جُهد" },
      { name: "description", content: "أضف طلباً جديداً واربطه بعميل حالي أو جديد." },
      { property: "og:title", content: "طلب جديد — جُهد" },
      { property: "og:description", content: "أضف طلباً جديداً واربطه بعميل." },
    ],
  }),
  component: NewOrderPage,
});

function NewOrderPage() {
  const navigate = useNavigate();
  const { token } = useGoogleAuth();
  const { data: spreadsheetId } = useSpreadsheet();
  const { data: customers } = useCustomers();
  const refresh = useRefreshData();

  const [customerId, setCustomerId] = useState("");
  const [newCustomer, setNewCustomer] = useState({ name: "", contact: "", notes: "" });
  const [form, setForm] = useState({
    product_description: "",
    customization_details: "",
    image_url: "",
    price: "",
    payment_status: "unpaid",
    order_status: "new",
    due_date: "",
  });
  const [saving, setSaving] = useState(false);
  const addingNew = customerId === "__new__";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !spreadsheetId) return;
    if (!addingNew && !customerId) return toast.error("اختر العميل أولاً");
    if (addingNew && !newCustomer.name.trim()) return toast.error("اكتب اسم العميل");
    setSaving(true);
    try {
      let finalCustomerId = customerId;
      if (addingNew) {
        const created = await addCustomer(token, spreadsheetId, newCustomer);
        finalCustomerId = created.id;
      }
      await addOrder(token, spreadsheetId, { ...form, customer_id: finalCustomerId });
      refresh();
      toast.success("تم حفظ الطلب بنجاح");
      void navigate({ to: "/orders" });
    } catch {
      toast.error("تعذّر حفظ الطلب، حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="طلب جديد">
      <form onSubmit={submit} className="surface-card grid gap-5 p-6 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <Label>العميل</Label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">— اختر عميلاً —</option>
            {(customers ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.contact ? `(${c.contact})` : ""}
              </option>
            ))}
            <option value="__new__">+ عميل جديد</option>
          </select>
        </div>

        {addingNew && (
          <div className="grid gap-4 rounded-xl bg-muted/50 p-4 md:col-span-2 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>اسم العميل</Label>
              <Input
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>وسيلة التواصل</Label>
              <Input
                placeholder="@telegram أو رقم الهاتف"
                value={newCustomer.contact}
                onChange={(e) => setNewCustomer({ ...newCustomer, contact: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Input
                value={newCustomer.notes}
                onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5 md:col-span-2">
          <Label>وصف المنتج</Label>
          <Input
            value={form.product_description}
            onChange={(e) => setForm({ ...form, product_description: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>تفاصيل التخصيص</Label>
          <Textarea
            rows={4}
            value={form.customization_details}
            onChange={(e) => setForm({ ...form, customization_details: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>السعر</Label>
          <Input
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>تاريخ التسليم</Label>
          <Input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>حالة الدفع</Label>
          <select
            value={form.payment_status}
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
            value={form.order_status}
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
          <Label>رابط صورة مرجعية (اختياري)</Label>
          <Input
            dir="ltr"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          />
        </div>

        <div className="md:col-span-2">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? "جارٍ الحفظ..." : "حفظ الطلب"}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
