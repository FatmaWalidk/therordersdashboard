import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Sheet as SheetIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useGoogleAuth } from "@/lib/google-auth";
import { useSpreadsheet } from "@/lib/workspace";
import { spreadsheetUrl } from "@/lib/sheets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "الرئيسية" },
  { to: "/orders", label: "الطلبات" },
  { to: "/orders/new", label: "طلب جديد" },
  { to: "/customers", label: "العملاء" },
] as const;

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-primary-foreground"
        style={{ backgroundImage: "var(--gradient-primary)" }}
      >
        جُ
      </span>
      <span className="text-lg font-bold tracking-tight">جُهد</span>
    </div>
  );
}

function SignInScreen() {
  const { signIn, signingIn, error, configured } = useGoogleAuth();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="surface-card w-full max-w-md p-8 text-center">
        <Brand className="justify-center" />
        <h1 className="mt-6 text-2xl">لوحة إدارة الطلبات</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          سجّل الدخول بحساب Google ليتم إنشاء جدول بياناتك تلقائياً وإدارة طلبات عملائك من مكان واحد.
        </p>
        {configured ? (
          <Button className="mt-6 w-full" size="lg" onClick={signIn} disabled={signingIn}>
            {signingIn ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول بحساب Google"}
          </Button>
        ) : (
          <div className="mt-6 rounded-xl bg-muted p-4 text-right text-sm text-muted-foreground">
            لم يتم ضبط معرّف تطبيق Google بعد. أضف القيمة <code>VITE_GOOGLE_CLIENT_ID</code> في ملف
            الإعدادات قبل تسجيل الدخول.
          </div>
        )}
        {error && <p className="mt-4 text-sm text-destructive">حدث خطأ: {error}</p>}
        <p className="mt-6 text-xs text-muted-foreground">
          بياناتك تُحفظ في جدول Google الخاص بك فقط — لا نخزّن أي معلومات على خوادمنا.
        </p>
      </div>
    </div>
  );
}

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const { token, ready, profile, signOut } = useGoogleAuth();
  const { data: spreadsheetId } = useSpreadsheet();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        جارٍ التحميل...
      </div>
    );
  }
  if (!token) return <SignInScreen />;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-card/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Brand />
          <nav className="flex flex-1 flex-wrap items-center gap-1">
            {nav.map((item) => {
              const active =
                item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-soft text-primary-deep"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            {spreadsheetId && (
              <a
                href={spreadsheetUrl(spreadsheetId)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <SheetIcon className="h-4 w-4" /> الجدول
              </a>
            )}
            <span className="hidden text-xs text-muted-foreground sm:inline">{profile?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut} aria-label="تسجيل الخروج">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl">{title}</h1>
        {children}
      </main>
    </div>
  );
}
