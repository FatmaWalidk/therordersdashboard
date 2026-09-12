import { orderStatusLabel, paymentStatusLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";

const orderTone: Record<string, string> = {
  new: "bg-primary-soft text-primary-deep",
  in_progress: "bg-warning/20 text-ink",
  ready: "bg-accent/40 text-accent-foreground",
  shipped: "bg-primary/25 text-primary-deep",
  delivered: "bg-success/20 text-ink",
};

const paymentTone: Record<string, string> = {
  unpaid: "bg-destructive/12 text-destructive",
  partial: "bg-warning/25 text-ink",
  paid: "bg-success/20 text-ink",
};

export function StatusBadge({ value, kind }: { value: string; kind: "order" | "payment" }) {
  const label =
    kind === "order" ? (orderStatusLabel[value] ?? value) : (paymentStatusLabel[value] ?? value);
  const tone = kind === "order" ? orderTone[value] : paymentTone[value];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        tone ?? "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}
