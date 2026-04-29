import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useGetUserPublicInfo,
  getGetUserPublicInfoQueryKey,
} from "@workspace/api-client-react";
import {
  Calendar,
  AtSign,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { formatDateAr } from "@/lib/format";
import {
  LEVEL_BADGE_CLASS,
  LEVEL_BAR_CLASS,
  type IntegrityProfile,
} from "@/lib/integrity";

interface PersonInfoDrawerProps {
  userId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function PersonInfoDrawer({ userId, onOpenChange }: PersonInfoDrawerProps) {
  const { data, isLoading } = useGetUserPublicInfo(userId ?? "", {
    query: {
      enabled: !!userId,
      queryKey: getGetUserPublicInfoQueryKey(userId ?? ""),
    },
  });
  const user = data?.user;
  const [integrity, setIntegrity] = useState<IntegrityProfile | null>(null);
  const [integrityLoading, setIntegrityLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIntegrity(null);
      return;
    }
    setIntegrity(null);
    setIntegrityLoading(true);
    let cancelled = false;
    fetch(`/api/users/${userId}/integrity`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.integrity) setIntegrity(d.integrity);
      })
      .finally(() => {
        if (!cancelled) setIntegrityLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <Sheet open={!!userId} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[440px] sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>بيانات العضو</SheetTitle>
          <SheetDescription>المعلومات العامة وملف النزاهة لهذا الموفّر.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6 px-1 pb-6">
          {isLoading || !user ? (
            <>
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary/20">
                  <AvatarImage src={user.profileImageUrl ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                    {(user.fullName ?? user.username ?? "؟").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl font-bold">{user.fullName ?? "—"}</p>
                  <p className="text-muted-foreground text-sm flex items-center gap-1">
                    <AtSign size={14} />
                    {user.username ?? "بدون اسم مستخدم"}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <InfoRow
                  icon={<Calendar size={16} />}
                  label="انضم في"
                  value={formatDateAr(user.joinedAt)}
                />
              </div>

              <IntegritySection
                integrity={integrity}
                loading={integrityLoading}
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function IntegritySection({
  integrity,
  loading,
}: {
  integrity: IntegrityProfile | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (!integrity) return null;

  const pct = Math.round(integrity.rawScore);
  const commitmentPct = Math.round(integrity.commitmentRate * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="text-primary" size={18} />
        <h3 className="text-base font-semibold">ملف النزاهة</h3>
      </div>

      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">نقاط النزاهة</p>
            <p className="text-3xl font-bold leading-none mt-1">{pct}</p>
            <p className="text-xs text-muted-foreground mt-1">من 100</p>
          </div>
          <Badge className={LEVEL_BADGE_CLASS[integrity.level]} variant="outline">
            {integrity.level}
          </Badge>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full transition-all ${LEVEL_BAR_CLASS[integrity.level]}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">معدّل الالتزام</span>
          <span className="font-semibold">{commitmentPct}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile
          icon={<CheckCircle2 size={16} className="text-emerald-600" />}
          label="مدفوعات في الموعد"
          value={integrity.onTimePayments}
        />
        <StatTile
          icon={<Clock size={16} className="text-amber-600" />}
          label="مدفوعات متأخرة"
          value={integrity.latePaymentsCount}
        />
        <StatTile
          icon={<AlertTriangle size={16} className="text-rose-600" />}
          label="مدفوعات مفقودة"
          value={integrity.missingPayments}
        />
        <StatTile
          icon={<ShieldCheck size={16} className="text-primary" />}
          label="إجمالي المطلوب"
          value={integrity.totalRequired}
        />
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        تُحتسب نقاط النزاهة من التزام العضو بدفع نصيبه في موعده عبر جميع
        صناديق الادخار التي يشارك فيها.
      </p>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon}
        {label}
      </div>
      <div className="font-medium text-sm">{value}</div>
    </div>
  );
}
