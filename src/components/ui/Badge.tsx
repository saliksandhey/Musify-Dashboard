import { cn } from "@/utils";

interface BadgeProps {
  variant?: "success" | "warning" | "error" | "purple" | "muted" | "info";
  children: React.ReactNode;
  className?: string;
}

const variantMap = {
  success: "badge-success",
  warning: "badge-warning",
  error: "badge-error",
  purple: "badge-purple",
  muted: "badge-muted",
  info: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20",
};

export default function Badge({ variant = "muted", children, className }: BadgeProps) {
  return (
    <span className={cn(variantMap[variant], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    active: { variant: "success", label: "Active" },
    published: { variant: "success", label: "Published" },
    inactive: { variant: "muted", label: "Inactive" },
    draft: { variant: "warning", label: "Draft" },
    scheduled: { variant: "info", label: "Scheduled" },
    suspended: { variant: "error", label: "Suspended" },
    banned: { variant: "error", label: "Banned" },
    public: { variant: "success", label: "Public" },
    private: { variant: "muted", label: "Private" },
  };

  const cfg = config[status] ?? { variant: "muted" as const, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function SubscriptionBadge({ plan }: { plan: string }) {
  const config: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    premium: { variant: "purple", label: "Premium" },
    family: { variant: "info", label: "Family" },
    student: { variant: "success", label: "Student" },
    free: { variant: "muted", label: "Free" },
  };
  const cfg = config[plan] ?? { variant: "muted" as const, label: plan };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
