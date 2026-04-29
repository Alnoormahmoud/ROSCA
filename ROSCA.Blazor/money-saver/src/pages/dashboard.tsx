import { useMemo, useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  useGetDashboardSummary,
  useGetRecentActivity,
  useGetMyProfile,
  getGetDashboardSummaryQueryKey,
  getGetRecentActivityQueryKey,
  getGetMyProfileQueryKey,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Mascot } from "@/components/Mascot";
import { SpeechBubble } from "@/components/SpeechBubble";
import { formatMoney, formatDateAr, formatDateTimeAr } from "@/lib/format";
import { LEVEL_BADGE_CLASS, type IntegrityProfile } from "@/lib/integrity";
import {
  TrendingUp,
  ShieldCheck,
  CalendarClock,
  ArrowUpRight,
  PlusCircle,
  ArrowDownLeft,
  Inbox,
} from "lucide-react";

const MASCOT_TIPS = [
  "نصيحة: الثقة هي الأساس. ادّخر مع من تعرفهم.",
  "هل تعلم؟ تستلم الجمعية مرة واحدة فقط في كل دورة، عندما يحين دورك.",
  "خطوة ذكية: ساهم باكرًا في الدورة، فالحياة لا يمكن التنبؤ بها.",
  "الدفع في موعده يرفع نقاط النزاهة الخاصة بك.",
];

export default function Dashboard() {
  const { data: profileEnv } = useGetMyProfile({
    query: { queryKey: getGetMyProfileQueryKey() },
  });
  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() },
  });
  const { data: activity } = useGetRecentActivity({
    query: { queryKey: getGetRecentActivityQueryKey() },
  });
  const [integrity, setIntegrity] = useState<IntegrityProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/integrity", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.integrity) setIntegrity(d.integrity);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const tip = useMemo(
    () => MASCOT_TIPS[Math.floor(Math.random() * MASCOT_TIPS.length)],
    [],
  );

  const profile = profileEnv?.profile;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            أهلًا بعودتك{profile?.fullName ? `، ${profile.fullName.split(" ")[0]}` : ""}.
          </h1>
          <p className="text-muted-foreground mt-2">
            هذا ما يحدث في صناديق الادخار اليوم.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/app/funds/new">
            <Button className="rounded-full">
              <PlusCircle size={16} className="me-2" />
              إنشاء صندوق
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <IntegrityCard integrity={integrity} />
        <StatCard
          icon={<TrendingUp />}
          label="الصناديق النشطة"
          value={isLoading ? null : String(summary?.activeFunds ?? 0)}
          accent="secondary"
          delay={0.05}
        />
        <StatCard
          icon={<CalendarClock />}
          label="جمعيتك القادمة"
          value={
            isLoading
              ? null
              : summary?.upcomingPayoutAmount
                ? formatMoney(summary.upcomingPayoutAmount, "USD")
                : "—"
          }
          accent="primary"
          delay={0.1}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {summary?.nextPayout && (
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/5 border-primary/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-primary uppercase tracking-wide">
                    جمعيتك القادمة
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {formatMoney(summary.nextPayout.amount, "USD")}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    الجولة {summary.nextPayout.roundNumber} • مستحقة في{" "}
                    {formatDateAr(summary.nextPayout.dueDate)}
                  </p>
                </div>
                <Link href={`/app/funds/${summary.nextPayout.fundId}`}>
                  <Button variant="outline" className="rounded-full">
                    عرض الصندوق <ArrowUpRight size={16} className="ms-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">المستحق هذه الدورة</h2>
              <Badge variant="outline">{summary?.dueThisCycle?.length ?? 0}</Badge>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : summary?.dueThisCycle?.length ? (
              <div className="space-y-3">
                {summary.dueThisCycle.map((p) => (
                  <Link key={p.id} href={`/app/funds/${p.fundId}`}>
                    <div className="flex items-center justify-between p-4 rounded-2xl border hover:bg-muted/40 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium">
                          جمعية {p.recipientFullName ?? "أحد الأعضاء"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          الجولة {p.roundNumber} • مستحقة في{" "}
                          {formatDateAr(p.dueDate, false)}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="font-semibold">
                          {formatMoney(p.amount, "USD")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          دفع {p.contributedCount} من {p.totalContributors}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState message="لا يوجد شيء مستحق الآن. استمتع بالهدوء!" />
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">آخر النشاطات</h2>
            {!activity?.activity ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : activity.activity.length === 0 ? (
              <EmptyState message="لا يوجد نشاط بعد. قم بأول مساهمة لتظهر هنا." />
            ) : (
              <div className="space-y-2">
                {activity.activity.slice(0, 8).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between py-3 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          a.type === "contribution"
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary/20 text-secondary"
                        }`}
                      >
                        {a.type === "contribution" ? (
                          <ArrowUpRight size={16} />
                        ) : (
                          <ArrowDownLeft size={16} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {a.userFullName ?? "عضو"}{" "}
                          {a.type === "contribution" ? "ساهم في" : "استلم من"}{" "}
                          {a.fundTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTimeAr(a.paymentDate)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatMoney(a.amount, "USD")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-secondary/10 to-primary/5">
            <div className="flex flex-col items-center text-center space-y-4">
              <Mascot size={140} />
              <SpeechBubble side="right" className="bg-white/90 backdrop-blur">
                <p className="text-sm leading-relaxed">{tip}</p>
              </SpeechBubble>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function IntegrityCard({ integrity }: { integrity: IntegrityProfile | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">نقاط النزاهة</p>
            {integrity === null ? (
              <Skeleton className="h-9 w-32 mt-2" />
            ) : (
              <>
                <p className="text-3xl font-bold mt-1">
                  {integrity.rawScore.toFixed(0)}
                  <span className="text-base text-muted-foreground font-medium">
                    {" "}
                    / 100
                  </span>
                </p>
                <Badge
                  className={`mt-2 ${LEVEL_BADGE_CLASS[integrity.level]}`}
                  variant="outline"
                >
                  {integrity.level}
                </Badge>
              </>
            )}
          </div>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-primary/10 text-primary">
            <ShieldCheck />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  accent: "primary" | "secondary";
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {value === null ? (
              <Skeleton className="h-9 w-32 mt-2" />
            ) : (
              <p className="text-3xl font-bold mt-1">{value}</p>
            )}
          </div>
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
              accent === "primary"
                ? "bg-primary/10 text-primary"
                : "bg-secondary/20 text-secondary"
            }`}
          >
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-10 text-muted-foreground">
      <Inbox size={36} className="mx-auto mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
