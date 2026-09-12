import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Brand } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APPS_SCRIPT_URL, INTAKE_TOKEN } from "@/lib/config";

export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "اطلب منتجك المخصص — جُهد" },
      {
        name: "description",
        content: "املأ تفاصيل طلبك المخصص وسنتواصل معك لتأكيد التفاصيل والسعر.",
      },
      { property: "og:title", content: "اطلب منتجك المخصص — جُهد" },
      { property: "og:description", content: "نموذج طلب سريع للمنتجات المخصصة." },
    ],
  }),
  component: PublicIntakePage,
});

const emptyForm = {
  name: "",
  contact: "",
  product_description: "",
  customization_details: "",
  image_url: "",
  notes: "",
};

function PublicIntakePage() {
  const [form, setForm] = useState(emptyForm);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!APPS_SCRIPT_URL) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ token: INTAKE_TOKEN, ...form }),
      });
      setState("done");
      setForm(emptyForm);
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <Brand className="justify-center" />
          <h1 className="mt-4 text-3xl">اطلب منتجك المخصص</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            أخبرنا بما تريد بالتفصيل، وسنتواصل معك لتأكيد التفاصيل والسعر.
          </p>
        </div>

        {state === "done" ? (
          <div className="surface-card p-10 text-center">
            <h2 className="text-xl">تم استلام طلبك بنجاح 🌸</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              شكراً لك! سنتواصل معك قريباً على وسيلة التواصل التي أدخلتها.
            </p>
            <Button className="mt-6" onClick={() => setState("idle")}>
              إرسال طلب آخر
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="surface-card grid gap-5 p-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>الاسم</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>وسيلة التواصل (تيليجرام / واتساب)</Label>
              <Input
                required
                dir="auto"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>نوع المنتج</Label>
              <Input
                required
                value={form.product_description}
                onChange={(e) => setForm({ ...form, product_description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>تفاصيل التخصيص (الألوان، المقاس، النص المطلوب...)</Label>
              <Textarea
                rows={5}
                value={form.customization_details}
                onChange={(e) => setForm({ ...form, customization_details: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>رابط صورة مرجعية (اختياري)</Label>
              <Input
                dir="ltr"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>ملاحظات إضافية</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            {state === "error" && (
              <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive md:col-span-2">
                تعذّر إرسال الطلب حالياً. تأكد من الاتصال بالإنترنت أو تواصل معنا مباشرة.
              </p>
            )}
            <div className="md:col-span-2">
              <Button type="submit" size="lg" className="w-full" disabled={state === "sending"}>
                {state === "sending" ? "جارٍ الإرسال..." : "إرسال الطلب"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
