import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/Mascot";
import { SpeechBubble } from "@/components/SpeechBubble";
import {
  useCompleteOnboarding,
  getGetMyProfileQueryKey,
} from "@workspace/api-client-react";
import { ArrowLeft, Check, Users, RefreshCw, Wallet } from "lucide-react";

// All KYC info is now collected at registration, so this is a short
// welcome tour only.
export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const queryClient = useQueryClient();
  const completeOnboarding = useCompleteOnboarding();

  async function handleFinish() {
    try {
      await completeOnboarding.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
      toast.success("أهلًا بك في صرفة!");
      setLocation("/app");
    } catch {
      toast.error("حدث خطأ. حاول مرة أخرى.");
    }
  }

  const steps = [
    {
      message: (
        <>
          <p className="text-2xl font-bold mb-2">مرحبًا، أنا موفّر!</p>
          <p className="text-muted-foreground">
            سأساعدك على ادخار المال مع من تثق بهم. دعني أعرّفك على الطريقة في دقيقة فقط.
          </p>
        </>
      ),
      action: (
        <Button size="lg" className="rounded-full" onClick={() => setStep(1)}>
          هيّا بنا <ArrowLeft className="ms-2" size={18} />
        </Button>
      ),
    },
    {
      message: (
        <>
          <p className="text-2xl font-bold mb-2">ادخروا بالدور، معًا.</p>
          <p className="text-muted-foreground mb-4">
            كل عضو في الصندوق يدفع مبلغًا ثابتًا في كل دورة. عضو واحد يستلم
            المجموع كاملًا في تلك الدورة. ثم تنتقل للعضو التالي وهكذا حتى يأخذ
            الجميع نصيبهم.
          </p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <DiagramTile icon={<Users size={20} />} label="كوّن صندوقك" />
            <DiagramTile icon={<RefreshCw size={20} />} label="ادفع بالدور" />
            <DiagramTile icon={<Wallet size={20} />} label="استلم نصيبك" />
          </div>
        </>
      ),
      action: (
        <Button size="lg" className="rounded-full" onClick={() => setStep(2)}>
          فهمت <ArrowLeft className="ms-2" size={18} />
        </Button>
      ),
    },
    {
      message: (
        <>
          <p className="text-2xl font-bold mb-2">أنت جاهز!</p>
          <p className="text-muted-foreground">
            أنشئ صندوقك الأول وادعُ من تثق بهم. الالتزام بالدفع في موعده
            يرفع نقاط النزاهة الخاصة بك.
          </p>
        </>
      ),
      action: (
        <Button
          size="lg"
          className="rounded-full"
          onClick={handleFinish}
          disabled={completeOnboarding.isPending}
        >
          <Check className="me-2" size={18} /> إلى لوحة التحكم
        </Button>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col">
      <div className="px-8 pt-8">
        <div className="flex gap-2 max-w-md mx-auto">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.85, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.85, rotate: 8 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
              >
                <Mascot size={280} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <SpeechBubble key={step} side="right">
                {current.message}
              </SpeechBubble>
            </AnimatePresence>
            {current.action && <div>{current.action}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function DiagramTile({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl bg-primary/5 border border-primary/10 p-3 flex flex-col items-center gap-2 text-primary">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}
