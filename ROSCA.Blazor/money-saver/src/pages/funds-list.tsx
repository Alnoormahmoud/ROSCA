import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  useListMyFunds,
  getListMyFundsQueryKey,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Mascot } from "@/components/Mascot";
import { formatMoney, periodLabel } from "@/lib/format";
import { PlusCircle, Users, ArrowUpRight } from "lucide-react";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  pending: "outline",
  active: "default",
  completed: "secondary",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "معلقة",
  active: "نشط",
  completed: "مكتمل",
};

export default function FundsList() {
  const { data, isLoading } = useListMyFunds({
    query: { queryKey: getListMyFundsQueryKey() },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">صناديقي</h1>
          <p className="text-muted-foreground mt-2">
            جميع صناديق الادخار التي تشارك فيها.
          </p>
        </div>
        <Link href="/app/funds/new">
          <Button className="rounded-full">
            <PlusCircle size={16} className="me-2" />
            إنشاء صندوق
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : !data?.funds.length ? (
        <Card className="p-12 flex flex-col items-center text-center gap-4">
          <Mascot size={140} />
          <div>
            <h3 className="text-xl font-bold">لا توجد صناديق بعد</h3>
            <p className="text-muted-foreground mt-1">
              ابدأ صندوقك الأول وادعُ أعضاءك.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/app/funds/new">
              <Button className="rounded-full">إنشاء صندوق</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.funds.map((fund, idx) => (
            <motion.div
              key={fund.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Link href={`/app/funds/${fund.id}`}>
                <Card className="p-6 hover:border-primary/40 hover:shadow-md transition cursor-pointer h-full flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={STATUS_VARIANT[fund.status] ?? "outline"}>
                      {STATUS_LABEL[fund.status] ?? fund.status}
                    </Badge>
                    <ArrowUpRight size={16} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">{fund.title}</h3>
                  {fund.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {fund.description}
                    </p>
                  )}
                  <div className="mt-auto pt-5 flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {formatMoney(fund.shareValue, fund.currencyCode)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        لكل دورة {periodLabel(fund.periodType)}
                      </p>
                    </div>
                    <div className="text-end text-sm">
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <Users size={14} />
                        {fund.currentMembers}/{fund.totalMembers}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
