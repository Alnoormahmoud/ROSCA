import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useCreateFund,
  useListCurrencies,
  useGetMyProfile,
  getGetMyProfileQueryKey,
  getListCurrenciesQueryKey,
  getListMyFundsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mascot } from "@/components/Mascot";
import { SpeechBubble } from "@/components/SpeechBubble";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Crown,
  Search,
  X,
  UserPlus,
  Loader2,
  Users as UsersIcon,
} from "lucide-react";

const schema = z.object({
  title: z.string().min(2, "حقل مطلوب").max(120),
  description: z.string().max(500).optional(),
  shareValue: z.coerce.number().positive("يجب أن يكون أكبر من صفر"),
  periodType: z.enum(["weekly", "biweekly", "monthly"]),
  startDate: z.string().min(1, "اختر تاريخًا"),
  currencyId: z.coerce.number().int().positive(),
});

type Values = z.infer<typeof schema>;

interface SearchUser {
  id: string;
  username: string;
  fullName: string;
  profileImageUrl: string | null;
}

export default function FundsNew() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const createFund = useCreateFund();
  const { data: currencies } = useListCurrencies({
    query: { queryKey: getListCurrenciesQueryKey() },
  });
  const { data: profileEnv } = useGetMyProfile({
    query: { queryKey: getGetMyProfileQueryKey(), enabled: !!user },
  });
  const profile = profileEnv?.profile;

  // Ordered roster — index 0 is round 1's recipient, etc. The admin (creator)
  // is included automatically but is FREELY REORDERABLE like any other
  // member. The entire roster is FROZEN at fund creation; nothing can be
  // added, removed, or reordered after submit.
  const [members, setMembers] = useState<SearchUser[]>([]);
  // Seed the admin into the roster as soon as we know who they are.
  useEffect(() => {
    if (!user) return;
    setMembers((prev) => {
      if (prev.length > 0) return prev;
      return [
        {
          id: user.id,
          username: profile?.username ?? "",
          fullName:
            profile?.fullName ||
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            "أنت",
          profileImageUrl:
            profile?.profileImageUrl ?? user.profileImageUrl ?? null,
        },
      ];
    });
  }, [user, profile]);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      shareValue: 100,
      periodType: "monthly",
      startDate: new Date().toISOString().slice(0, 10),
      currencyId: 1,
    },
  });

  function moveMember(idx: number, direction: -1 | 1) {
    setMembers((prev) => {
      const next = [...prev];
      const target = idx + direction;
      if (target < 0 || target >= next.length) return prev;
      // Admin can be reordered freely like any other member.
      [next[idx], next[target]] = [next[target]!, next[idx]!];
      return next;
    });
  }

  function removeMember(id: string) {
    if (id === user?.id) return; // Admin cannot remove themselves
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  function addMember(u: SearchUser) {
    setMembers((prev) => {
      if (prev.some((m) => m.id === u.id)) return prev;
      return [...prev, u];
    });
  }

  function onSubmit(values: Values) {
    if (members.length < 2) {
      toast.error("أضف عضوًا واحدًا على الأقل غيرك (الحد الأدنى ٢ أعضاء).");
      return;
    }
    if (members.length > 30) {
      toast.error("الحد الأقصى ٣٠ عضوًا.");
      return;
    }
    createFund.mutate(
      {
        data: {
          ...values,
          memberUserIds: members.map((m) => m.id),
        },
      },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListMyFundsQueryKey() });
          // The server returns the fund already classified as "active" or
          // "pending" depending on whether today's date matches the start
          // date. Reflect that in the toast so the user knows what happened.
          if (res?.fund?.status === "pending") {
            toast.success(
              "تم إنشاء الصندوق. سيبدأ تلقائيًا في تاريخ البداية.",
            );
          } else {
            toast.success("تم إنشاء الصندوق وبدأ تلقائيًا.");
          }
          if (res?.fund?.id) {
            setLocation(`/app/funds/${res.fund.id}`);
          } else {
            setLocation("/app/funds");
          }
        },
        onError: () => toast.error("تعذّر إنشاء الصندوق."),
      },
    );
  }

  const totalPot = (form.watch("shareValue") || 0) * members.length;
  const currencyCode =
    (currencies?.currencies ?? []).find(
      (c) => c.id === Number(form.watch("currencyId")),
    )?.code ?? "";

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/app/funds")}
          className="mb-2"
        >
          <ArrowRight size={14} className="me-1" /> رجوع
        </Button>
        <h1 className="text-4xl font-bold tracking-tight">إنشاء صندوق</h1>
        <p className="text-muted-foreground mt-2">
          أضف الأعضاء ورتّبهم الآن. لا يمكن إضافة أعضاء أو تغيير ترتيبهم
          بعد الإنشاء. إذا كان تاريخ البداية اليوم يبدأ الصندوق تلقائيًا،
          وإلا يبقى معلقًا حتى يحلّ التاريخ.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <Field label="اسم الصندوق" error={form.formState.errors.title?.message}>
              <Input {...form.register("title")} placeholder="صندوق الجمعة" />
            </Field>
            <Field label="وصف (اختياري)">
              <Textarea
                {...form.register("description")}
                placeholder="ملاحظة قصيرة عن هذا الصندوق"
                rows={3}
              />
            </Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="قيمة الاشتراك في كل دورة"
                error={form.formState.errors.shareValue?.message}
              >
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("shareValue")}
                />
              </Field>
              <Field label="العملة">
                <Select
                  value={String(form.watch("currencyId"))}
                  onValueChange={(v) =>
                    form.setValue("currencyId", Number(v), { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(currencies?.currencies ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="الدورية">
                <Select
                  value={form.watch("periodType")}
                  onValueChange={(v) =>
                    form.setValue("periodType", v as "weekly" | "biweekly" | "monthly")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">أسبوعي</SelectItem>
                    <SelectItem value="biweekly">كل أسبوعين</SelectItem>
                    <SelectItem value="monthly">شهري</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field
                label="تاريخ البداية"
                error={form.formState.errors.startDate?.message}
              >
                <Input type="date" {...form.register("startDate")} />
              </Field>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <UsersIcon size={16} /> أعضاء الصندوق وترتيبهم
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    رتّبهم بحرية — يمكنك وضع نفسك في أي جولة. سيُحدد ترتيبهم
                    هنا من يستلم الجمعية في كل جولة.
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full">
                  {members.length} {members.length === 1 ? "عضو" : "أعضاء"}
                </Badge>
              </div>

              <MemberPicker
                onPick={addMember}
                excludeIds={members.map((m) => m.id)}
              />

              <div className="space-y-2">
                {members.map((m, idx) => {
                  const isAdmin = m.id === user?.id;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 p-3 rounded-2xl border bg-card"
                    >
                      <Badge variant="default" className="min-w-12 justify-center">
                        جولة {idx + 1}
                      </Badge>
                      <Avatar className="h-10 w-10 border-2 border-primary/10">
                        <AvatarImage src={m.profileImageUrl ?? undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {(m.fullName ?? m.username ?? "؟")
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate flex items-center gap-2">
                          {m.fullName || "عضو"}
                          {isAdmin && (
                            <Crown size={12} className="text-secondary" />
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {m.username ? `@${m.username}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveMember(idx, -1)}
                          disabled={idx === 0}
                          aria-label="نقل لأعلى"
                        >
                          <ArrowUp size={14} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveMember(idx, 1)}
                          disabled={idx === members.length - 1}
                          aria-label="نقل لأسفل"
                        >
                          <ArrowDown size={14} />
                        </Button>
                      </div>
                      {!isAdmin && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeMember(m.id)}
                          aria-label="إزالة"
                        >
                          <X size={14} />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              type="submit"
              className="rounded-full"
              size="lg"
              disabled={createFund.isPending || members.length < 2}
            >
              {createFund.isPending ? "جارٍ الإنشاء…" : "إنشاء وبدء الصندوق"}
            </Button>
          </form>
        </Card>
        <div className="space-y-4">
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/5">
            <div className="flex flex-col items-center text-center gap-4">
              <Mascot size={120} />
              <SpeechBubble side="right" className="bg-white/90 backdrop-blur">
                <p className="text-sm">
                  أضف الأعضاء بأسماء المستخدمين، رتّبهم حسب الجولات، ثم أنشئ
                  الصندوق. سيبدأ تلقائيًا ولن يمكن تعديل القائمة لاحقًا.
                </p>
              </SpeechBubble>
            </div>
          </Card>
          <Card className="p-6 space-y-3">
            <p className="text-xs text-muted-foreground">المجموع في كل جولة</p>
            <p className="text-3xl font-bold">
              {totalPot.toLocaleString("ar")} {currencyCode}
            </p>
            <p className="text-xs text-muted-foreground">
              عدد الجولات: {members.length}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MemberPicker({
  onPick,
  excludeIds,
}: {
  onPick: (u: SearchUser) => void;
  excludeIds: string[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/users/search?q=${encodeURIComponent(q)}`,
          { credentials: "include" },
        );
        const data = await r.json();
        if (!cancelled) setResults(data?.users ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const visible = results.filter((u) => !excludeIds.includes(u.id));

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          size={14}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث باسم المستخدم لإضافته…"
          className="pe-9"
        />
      </div>
      {query.trim().length >= 2 && (
        <div className="rounded-2xl border bg-muted/30 max-h-60 overflow-y-auto">
          {searching && (
            <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> جارٍ البحث…
            </div>
          )}
          {!searching && visible.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">
              لا توجد نتائج.
            </p>
          )}
          {!searching &&
            visible.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  onPick(u);
                  setQuery("");
                  setResults([]);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-card transition text-start"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={u.profileImageUrl ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {(u.fullName ?? u.username ?? "؟").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {u.fullName || "عضو"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{u.username}
                  </p>
                </div>
                <UserPlus
                  size={14}
                  className="text-primary opacity-70 group-hover:opacity-100"
                />
              </button>
            ))}
        </div>
      )}
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
