import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useGetMyProfile,
  useUpdateMyProfile,
  getGetMyProfileQueryKey,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import {
  LEVEL_BADGE_CLASS,
  LEVEL_BAR_CLASS,
  type IntegrityProfile,
} from "@/lib/integrity";

const schema = z.object({
  fullName: z.string().min(1, "حقل مطلوب").max(200),
  username: z.string().min(2, "حرفان على الأقل").max(64),
  nationalId: z.string().min(4, "٤ أحرف على الأقل").max(64),
  bankAccount: z.string().min(4, "٤ أحرف على الأقل").max(64),
});

type Values = z.infer<typeof schema>;

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetMyProfile({
    query: { queryKey: getGetMyProfileQueryKey() },
  });
  const update = useUpdateMyProfile();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      username: "",
      nationalId: "",
      bankAccount: "",
    },
  });

  const profile = data?.profile;

  const [integrity, setIntegrity] = useState<IntegrityProfile | null>(null);
  const [loadingIntegrity, setLoadingIntegrity] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoadingIntegrity(true);
    fetch("/api/me/integrity", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.integrity) setIntegrity(d.integrity);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingIntegrity(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.fullName ?? "",
        username: profile.username ?? "",
        nationalId: profile.nationalId ?? "",
        bankAccount: profile.bankAccount ?? "",
      });
    }
  }, [profile, form]);

  function onSubmit(values: Values) {
    update.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
          toast.success("تم تحديث الملف الشخصي");
        },
        onError: () => toast.error("تعذّر حفظ الملف الشخصي"),
      },
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">ملفي الشخصي</h1>
        <p className="text-muted-foreground mt-2">
          معلوماتك تساعد صناديق الادخار على معرفتك.
        </p>
      </div>
      <IntegritySection integrity={integrity} loading={loadingIntegrity} />

      <Card className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-20 w-20 border-2 border-primary/20">
            <AvatarImage src={profile.profileImageUrl ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
              {(profile.fullName ?? profile.email ?? "؟").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-bold">{profile.fullName ?? "—"}</p>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
          </div>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Field label="الاسم الكامل" error={form.formState.errors.fullName?.message}>
            <Input {...form.register("fullName")} />
          </Field>
          <Field label="اسم المستخدم" error={form.formState.errors.username?.message}>
            <Input {...form.register("username")} />
          </Field>
          <Field
            label="رقم الهوية الوطنية"
            error={form.formState.errors.nationalId?.message}
          >
            <Input {...form.register("nationalId")} />
          </Field>
          <Field
            label="رقم الحساب البنكي"
            error={form.formState.errors.bankAccount?.message}
          >
            <Input {...form.register("bankAccount")} />
          </Field>
          <Button
            type="submit"
            className="rounded-full"
            size="lg"
            disabled={update.isPending}
          >
            {update.isPending ? "جارٍ الحفظ…" : "حفظ التغييرات"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
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
      <Card className="p-8">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-12 w-32 mt-4" />
        <Skeleton className="h-3 w-full mt-6" />
      </Card>
    );
  }
  if (!integrity) {
    return (
      <Card className="p-8">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-primary/10 text-primary">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold">نقاط النزاهة</h2>
            <p className="text-sm text-muted-foreground mt-1">
              ستظهر نقاطك بمجرد بدء أول مساهمة في أي صندوق.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const pct = Math.max(0, Math.min(100, integrity.rawScore));
  const commitmentPct = Math.round(integrity.commitmentRate * 100);

  return (
    <Card className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-primary/10 text-primary">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold">نقاط النزاهة والثقة</h2>
            <p className="text-sm text-muted-foreground mt-1">
              تُحسب من التزامك بالمساهمات في الصناديق التي شاركت فيها.
            </p>
          </div>
        </div>
        <Badge
          className={LEVEL_BADGE_CLASS[integrity.level]}
          variant="outline"
        >
          {integrity.level}
        </Badge>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-4xl font-bold">
            {integrity.rawScore.toFixed(0)}
            <span className="text-base text-muted-foreground font-medium">
              {" / 100"}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            معدل الالتزام {commitmentPct}%
          </p>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full ${LEVEL_BAR_CLASS[integrity.level]}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <IntegrityStat
          icon={<CheckCircle2 size={14} className="text-emerald-600" />}
          label="مساهمات في وقتها"
          value={integrity.onTimePayments}
        />
        <IntegrityStat
          icon={<AlertTriangle size={14} className="text-amber-600" />}
          label="مساهمات متأخرة"
          value={integrity.latePaymentsCount}
        />
        <IntegrityStat
          icon={<XCircle size={14} className="text-rose-600" />}
          label="مساهمات فائتة"
          value={integrity.missingPayments}
        />
        <IntegrityStat
          icon={<ShieldCheck size={14} className="text-primary" />}
          label="إجمالي المستحق"
          value={integrity.totalRequired}
        />
      </div>
    </Card>
  );
}

function IntegrityStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
