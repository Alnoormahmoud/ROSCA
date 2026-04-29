import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import iconImg from "@/assets/icon.png";
import nameImg from "@/assets/name.png";
import { UserPlus, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/local/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: username.trim(),
          nationalId: nationalId.trim(),
          bankAccount: bankAccount.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "تعذر إنشاء الحساب");
        setSubmitting(false);
        return;
      }
      await queryClient.invalidateQueries();
      toast.success("تم إنشاء حسابك بنجاح!");
      // Onboarding is auto-marked complete on registration since we already
      // collected the KYC data, so the user goes straight to the dashboard.
      setLocation("/app");
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/5 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <div className="flex flex-col items-center mb-6 gap-3">
          <img src={iconImg} alt="صرفة" className="w-24 h-24 object-contain drop-shadow-xl" />
          <img src={nameImg} alt="صرفة" className="h-10 object-contain" />
          <h1 className="text-2xl font-bold tracking-tight">أنشئ حسابك في صرفة</h1>
          <p className="text-muted-foreground text-sm text-center">
            ابدأ بالادخار مع من تثق بهم في دقائق.
          </p>
        </div>
        <Card className="p-7 space-y-5 shadow-lg border-primary/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium">
                الاسم الكامل
              </Label>
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="مثال: محمد أحمد"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium">
                اسم المستخدم
              </Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                dir="ltr"
                className="text-start"
                placeholder="my_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                ٣ إلى ٣٢ حرفًا. أحرف إنجليزية، أرقام، ثم _ . -
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nationalId" className="text-sm font-medium">
                  رقم الهوية الوطنية
                </Label>
                <Input
                  id="nationalId"
                  type="text"
                  inputMode="numeric"
                  placeholder="رقم الهوية"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bankAccount" className="text-sm font-medium">
                  رقم الحساب البنكي
                </Label>
                <Input
                  id="bankAccount"
                  type="text"
                  inputMode="numeric"
                  placeholder="IBAN أو رقم الحساب"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">
                  كلمة المرور
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  dir="ltr"
                  className="text-start"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-sm font-medium">
                  تأكيد كلمة المرور
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  dir="ltr"
                  className="text-start"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive bg-destructive/5 rounded-lg p-2.5 text-center">
                {error}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full rounded-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="ms-2 animate-spin" size={18} /> جارٍ الإنشاء…
                </>
              ) : (
                <>
                  <UserPlus className="ms-2" size={18} /> أنشئ الحساب
                </>
              )}
            </Button>
          </form>
          <div className="text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              سجّل الدخول
            </Link>
          </div>
        </Card>
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            ← العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
