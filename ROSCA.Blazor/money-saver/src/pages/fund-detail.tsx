import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useGetFund,
  useLeaveFund,
  useContributeToPayout,
  useCollectPayout,
  useGetFundWallet,
  useListWalletTransactions,
  getGetFundQueryKey,
  getGetFundWalletQueryKey,
  getListWalletTransactionsQueryKey,
  getListMyFundsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetRecentActivityQueryKey,
} from "@workspace/api-client-react";
import type { Payout, FundMember } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonInfoDrawer } from "@/components/PersonInfoDrawer";
import { Mascot } from "@/components/Mascot";
import { formatMoney, periodLabel, formatDateAr, formatDateTimeAr } from "@/lib/format";
import {
  Users,
  Calendar,
  Wallet as WalletIcon,
  ArrowRight,
  LogOut,
  Send,
  Trophy,
  Crown,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Loader2,
  Clock,
} from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  pending: "معلقة",
  active: "نشط",
  completed: "مكتمل",
};

export default function FundDetail() {
  const { fundId } = useParams<{ fundId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);

  const { data, isLoading } = useGetFund(fundId, {
    query: { queryKey: getGetFundQueryKey(fundId), enabled: !!fundId },
  });

  const leave = useLeaveFund();
  const contribute = useContributeToPayout();
  const collect = useCollectPayout();

  const fund = data?.fund;

  function refreshAll() {
    queryClient.invalidateQueries({ queryKey: getGetFundQueryKey(fundId) });
    queryClient.invalidateQueries({ queryKey: getGetFundWalletQueryKey(fundId) });
    queryClient.invalidateQueries({ queryKey: getListWalletTransactionsQueryKey(fundId) });
    queryClient.invalidateQueries({ queryKey: getListMyFundsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
  }

  function handleLeave() {
    if (!fund) return;
    leave.mutate(
      { fundId: fund.id },
      {
        onSuccess: () => {
          toast.success("غادرت الصندوق");
          setLocation("/app/funds");
        },
        onError: () => toast.error("تعذّر مغادرة الصندوق"),
      },
    );
  }

  function handleContribute(payoutId: string) {
    contribute.mutate(
      { payoutId },
      {
        onSuccess: () => {
          refreshAll();
          toast.success("تم إرسال المساهمة!");
        },
        onError: () => toast.error("تعذّر إرسال المساهمة"),
      },
    );
  }

  function handleCollect(payoutId: string) {
    collect.mutate(
      { payoutId },
      {
        onSuccess: () => {
          refreshAll();
          toast.success("استلمت الجمعية!");
        },
        onError: () => toast.error("تعذّر الاستلام — هل ساهم الجميع؟"),
      },
    );
  }

  if (isLoading || !fund) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const isMyTurn = (p: Payout) => p.userId === user?.id;
  const totalPot = fund.shareValue * fund.totalMembers;

  // Members and their order are LOCKED at fund creation. Display only.
  function getOrderedMembers(): FundMember[] {
    const ordered = fund!.members.filter((m) => m.payoutOrder !== null);
    ordered.sort((a, b) => (a.payoutOrder ?? 0) - (b.payoutOrder ?? 0));
    const unordered = fund!.members.filter((m) => m.payoutOrder === null);
    return [...ordered, ...unordered];
  }

  // True once the fund's startDate has arrived. Before that, no contribution
  // / collection is allowed even if a round is somehow already 'collecting'.
  const today = new Date().toISOString().slice(0, 10);
  const startReached = fund.startDate <= today;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocation("/app/funds")}
      >
        <ArrowRight size={14} className="me-1" /> كل الصناديق
      </Button>

      <Card className="p-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge
                variant={fund.status === "active" ? "default" : "outline"}
              >
                {STATUS_LABEL[fund.status] ?? fund.status}
              </Badge>
              {fund.isAdmin && (
                <Badge variant="secondary" className="gap-1">
                  <Crown size={12} /> أنت المسؤول
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold tracking-tight">{fund.title}</h1>
            {fund.description && (
              <p className="text-muted-foreground max-w-2xl">{fund.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
              <span className="flex items-center gap-1.5">
                <Users size={14} />
                {fund.currentMembers}/{fund.totalMembers} عضو
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {periodLabel(fund.periodType)}
              </span>
              <span className="flex items-center gap-1.5">
                <WalletIcon size={14} />
                {formatMoney(fund.shareValue, fund.currencyCode)} لكل دورة
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="text-end">
              <p className="text-xs text-muted-foreground uppercase">
                إجمالي الجمعية في كل جولة
              </p>
              <p className="text-3xl font-bold">{formatMoney(totalPot, fund.currencyCode)}</p>
            </div>
            <div className="flex gap-2 justify-end flex-wrap">
              {fund.isMember && !fund.isAdmin && fund.status === "pending" && (
                <Button
                  variant="outline"
                  onClick={handleLeave}
                  disabled={leave.isPending}
                  className="rounded-full"
                >
                  <LogOut size={14} className="me-1.5" /> مغادرة
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground border-t pt-4">
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            تم الإنشاء في {formatDateTimeAr(fund.createdAt)}
          </span>
          {!startReached && (
            <span className="flex items-center gap-1.5 text-amber-600">
              <Calendar size={14} />
              يبدأ التحصيل من {formatDateAr(fund.startDate)}
            </span>
          )}
        </div>
      </Card>

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">الجدول</TabsTrigger>
          <TabsTrigger value="members">الأعضاء ({fund.members.length})</TabsTrigger>
          <TabsTrigger value="wallet">المحفظة</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-6">
          {fund.payouts.length === 0 ? (
            <Card className="p-12 flex flex-col items-center text-center gap-4">
              <Mascot size={120} />
              <p className="text-muted-foreground max-w-md">
                سيظهر الجدول هنا بمجرد أن يبدأ الصندوق.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {!startReached && (
                <Card className="p-4 bg-amber-50 border-amber-200 text-amber-900 text-sm flex items-center gap-2">
                  <Calendar size={14} />
                  لم يبدأ التحصيل بعد. ستفتح الجولة الأولى تلقائيًا في{" "}
                  {formatDateAr(fund.startDate)}.
                </Card>
              )}
              {fund.payouts.map((p, idx) => {
                const myTurn = isMyTurn(p);
                // RESTRICTED: contribution allowed only while in "collecting"
                // state AND once the fund's start date has arrived.
                const canContribute =
                  !myTurn &&
                  !p.hasContributed &&
                  p.status === "collecting" &&
                  fund.status === "active" &&
                  startReached;
                const canCollect =
                  myTurn &&
                  p.status === "collecting" &&
                  p.contributedCount >= p.totalContributors - 1 &&
                  fund.status === "active" &&
                  startReached;

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card
                      className={`p-5 ${
                        myTurn ? "border-primary/40 bg-primary/5" : ""
                      } ${p.status === "paid" ? "opacity-70" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                              p.status === "paid"
                                ? "bg-muted text-muted-foreground"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            #{p.roundNumber}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setDrawerUserId(p.userId)}
                              className="font-semibold text-start hover:underline"
                            >
                              {p.recipientFullName ?? "عضو"}
                              {myTurn && (
                                <span className="ms-2 text-xs text-primary font-medium">
                                  (أنت)
                                </span>
                              )}
                            </button>
                            <p className="text-sm text-muted-foreground">
                              مستحقة في {formatDateAr(p.dueDate)} •{" "}
                              {formatMoney(p.amount, fund.currencyCode)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-end">
                            <PayoutStatusBadge
                              status={p.status}
                              hasContributed={p.hasContributed}
                              myTurn={myTurn}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              ساهم {p.contributedCount} من {p.totalContributors}
                            </p>
                          </div>
                          {canContribute && (
                            <Button
                              onClick={() => handleContribute(p.id)}
                              disabled={contribute.isPending}
                              className="rounded-full"
                            >
                              <Send size={14} className="me-1.5" /> ادفع نصيبي
                            </Button>
                          )}
                          {canCollect && (
                            <Button
                              onClick={() => handleCollect(p.id)}
                              disabled={collect.isPending}
                              className="rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                            >
                              <Trophy size={14} className="me-1.5" /> استلم الجمعية
                            </Button>
                          )}
                          {p.hasContributed && !myTurn && (
                            <span className="text-xs text-primary font-medium flex items-center gap-1">
                              <CheckCircle2 size={14} /> تم الدفع
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <Card className="p-6">
            <p className="text-xs text-muted-foreground mb-4">
              تم تثبيت الأعضاء وترتيبهم عند إنشاء الصندوق ولا يمكن تعديلهم.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {getOrderedMembers().map((m: FundMember) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setDrawerUserId(m.userId)}
                  className="flex items-center gap-3 p-3 rounded-2xl border hover:bg-muted/40 transition text-start"
                >
                  <Avatar className="h-11 w-11 border-2 border-primary/10">
                    <AvatarImage src={m.profileImageUrl ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {(m.fullName ?? m.username ?? "؟").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate flex items-center gap-2">
                      {m.fullName ?? "عضو"}
                      {m.userId === fund.adminId && (
                        <Crown size={12} className="text-secondary" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {m.username ? `@${m.username}` : "—"}
                    </p>
                  </div>
                  {m.payoutOrder !== null && (
                    <Badge variant="outline">الجولة {m.payoutOrder}</Badge>
                  )}
                  <ArrowUpRight size={14} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="wallet" className="mt-6">
          <WalletPanel fundId={fund.id} currencyCode={fund.currencyCode} />
        </TabsContent>
      </Tabs>

      <PersonInfoDrawer
        userId={drawerUserId}
        onOpenChange={(open) => !open && setDrawerUserId(null)}
      />
    </div>
  );
}

function PayoutStatusBadge({
  status,
  hasContributed,
  myTurn,
}: {
  status: string;
  hasContributed: boolean;
  myTurn: boolean;
}) {
  // The three labels the user requested:
  //   مدفوع       - the current viewer has paid their share for this round
  //   تم الاستلام  - the recipient has collected this round's funds
  //   معلّق        - upcoming round (not started yet)
  if (status === "paid") {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 size={12} /> تم الاستلام
      </Badge>
    );
  }
  if (status === "collecting") {
    if (!myTurn && hasContributed) {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1" variant="outline">
          <CheckCircle2 size={12} /> مدفوع
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1">
        قيد التحصيل
      </Badge>
    );
  }
  // upcoming or overdue -> معلّق
  return <Badge variant="outline">معلّق</Badge>;
}

function WalletPanel({ fundId, currencyCode }: { fundId: string; currencyCode: string }) {
  const { data: walletEnv, isLoading } = useGetFundWallet(fundId, {
    query: { queryKey: getGetFundWalletQueryKey(fundId) },
  });
  const { data: txData } = useListWalletTransactions(fundId, {
    query: { queryKey: getListWalletTransactionsQueryKey(fundId) },
  });

  return (
    <div className="space-y-4">
      <Card className="p-8 bg-gradient-to-br from-primary/10 to-secondary/5">
        <p className="text-sm text-muted-foreground">رصيد الصندوق</p>
        {isLoading ? (
          <Skeleton className="h-12 w-48 mt-2" />
        ) : (
          <p className="text-5xl font-bold mt-2">
            {formatMoney(walletEnv?.wallet.balance ?? 0, currencyCode)}
          </p>
        )}
      </Card>
      <Card className="p-6">
        <h3 className="font-semibold mb-4">المعاملات</h3>
        {!txData?.transactions ? (
          <Skeleton className="h-32 w-full" />
        ) : txData.transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            لا توجد معاملات بعد.
          </p>
        ) : (
          <div className="divide-y">
            {txData.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      t.type === "contribution"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary/20 text-secondary"
                    }`}
                  >
                    {t.type === "contribution" ? (
                      <ArrowUpRight size={16} />
                    ) : (
                      <ArrowDownLeft size={16} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {t.userFullName ?? "عضو"}{" "}
                      {t.type === "contribution" ? "ساهم" : "استلم"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTimeAr(t.paymentDate)}
                    </p>
                  </div>
                </div>
                <p className="font-semibold">
                  {t.type === "contribution" ? "+" : "−"}
                  {formatMoney(t.amount, currencyCode)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
