import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGoogleAuth } from "@/lib/google-auth";
import { addCustomer } from "@/lib/sheets";
import { useCustomers, useOrders, useRefreshData, useSpreadsheet } from "@/lib/workspace";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "العملاء — جُهد" },
      { name: "description", content: "سجل العملاء ووسائل التواصل والملاحظات." },
      { property: "og:title", content: "العملاء — جُهد" },
      { property: "og:description", content: "سجل العملاء ووسائل التواصل والملاحظات." },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { token } = useGoogleAuth();
  const { data: spreadsheetId } = useSpreadsheet();
  const { data: customers, isLoading } = useCustomers();
  const { data: orders } = useOrders();
  const refresh = useRefreshData();
  const [form, setForm] = useState({ name: "", contact: "", notes: "" });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !spreadsheetId || !form.name.trim()) return;
    setSaving(true);
    try {
      await addCustomer(token, spreadsheetId, form);
      setForm({ name: "", contact: "", notes: "" });
      refresh();
      toast.success("تمت إضافة العميل");
    } catch {
      toast.error("تعذّر حفظ العميل");
    } finally {
      setSaving(false);
    }
  }

  const orderCount = (id: string) => (orders ?? []).filter((o) => o.customer_id === id).length;

  return (
    <AppShell title="العملاء">
      <form onSubmit={submit} className="surface-card mb-6 grid gap-4 p-5 md:grid-cols-4">
        <div className="space-y-1.5">
          <Label>الاسم</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>وسيلة التواصل</Label>
          <Input
            placeholder="@telegram أو رقم"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>ملاحظات</Label>
          <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "..." : "إضافة عميل"}
          </Button>
        </div>
      </form>

      <div className="surface-card overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">جارٍ التحميل...</p>
        ) : (customers ?? []).length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">لا يوجد عملاء بعد.</p>
        ) : (
          <table className="w-full text-right text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">الاسم</th>
                <th className="px-4 py-3 font-medium">التواصل</th>
                <th className="px-4 py-3 font-medium">ملاحظات</th>
                <th className="px-4 py-3 font-medium">عدد الطلبات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(customers ?? []).map((c) => (
                <tr key={c.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3" dir="auto">
                    {c.contact || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.notes || "—"}</td>
                  <td className="px-4 py-3">{orderCount(c.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
