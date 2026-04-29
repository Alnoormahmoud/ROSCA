export type IntegrityLevel = "ممتاز" | "جيد" | "متوسط" | "ضعيف" | "خطر";

export interface IntegrityProfile {
  totalRequired: number;
  totalPaid: number;
  onTimePayments: number;
  latePaymentsCount: number;
  missingPayments: number;
  commitmentRate: number;
  rawScore: number;
  level: IntegrityLevel;
}

export const LEVEL_BADGE_CLASS: Record<IntegrityLevel, string> = {
  ممتاز: "bg-emerald-100 text-emerald-700 border-emerald-200",
  جيد: "bg-sky-100 text-sky-700 border-sky-200",
  متوسط: "bg-amber-100 text-amber-700 border-amber-200",
  ضعيف: "bg-orange-100 text-orange-700 border-orange-200",
  خطر: "bg-rose-100 text-rose-700 border-rose-200",
};

export const LEVEL_BAR_CLASS: Record<IntegrityLevel, string> = {
  ممتاز: "bg-emerald-500",
  جيد: "bg-sky-500",
  متوسط: "bg-amber-500",
  ضعيف: "bg-orange-500",
  خطر: "bg-rose-500",
};
