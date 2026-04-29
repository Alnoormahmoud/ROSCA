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
import { LogIn, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("الرجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/local/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "تعذر تسجيل الدخول");
        setSubmitting(false);
        return;
      }
      await queryClient.invalidateQueries();
      toast.success("أهلًا بعودتك!");
      setLocation(data?.user?.onboardingComplete ? "/app" : "/onboarding");
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
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-6 gap-3">
          <img src={iconImg} alt="صرفة" className="w-24 h-24 object-contain drop-shadow-xl" />
          <img src={nameImg} alt="صرفة" className="h-10 object-contain" />
          <h1 className="text-2xl font-bold tracking-tight">أهلًا بعودتك إلى صرفة</h1>
          <p className="text-muted-foreground text-sm text-center">
            سجّل الدخول للمتابعة إلى صناديق الادخار الخاصة بك.
          </p>
        </div>
        <Card className="p-7 space-y-5 shadow-lg border-primary/10">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                كلمة المرور
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                dir="ltr"
                className="text-start"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
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
                  <Loader2 className="ms-2 animate-spin" size={18} /> جارٍ الدخول…
                </>
              ) : (
                <>
                  <LogIn className="ms-2" size={18} /> تسجيل الدخول
                </>
              )}
            </Button>
          </form>
          <div className="text-center text-sm text-muted-foreground">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              أنشئ حسابًا جديدًا
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
