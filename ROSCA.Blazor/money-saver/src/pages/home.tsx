import { Link } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import mascotImg from "@/assets/mascot.png";
import iconImg from "@/assets/icon.png";
import nameImg from "@/assets/name.png";
import { ShieldCheck, Users, TrendingUp } from "lucide-react";

const HOME_TEXT = {
  groupHeading: "كيف تعمل صناديق الادخار الدوارة",
  step1: "١. كوّن صندوقك",
  step1Body:
    "اجمع دائرة صغيرة موثوقة من الأصدقاء أو العائلة أو الزملاء ممن يشاركونك نفس الأهداف المالية.",
};

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden">
      {/* الرأس */}
      <header className="w-full border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={iconImg} alt="صرفة" className="w-10 h-10 object-contain drop-shadow-sm" />
            <img src={nameImg} alt="صرفة" className="h-8 object-contain" />
          </div>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="w-24 h-10 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated ? (
              <Link href="/app">
                <Button size="lg" className="rounded-full shadow-sm">
                  الذهاب إلى لوحة التحكم
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="rounded-full border-primary/20 hover:bg-primary/5 font-medium">
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" className="rounded-full font-medium">
                    إنشاء حساب
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* القسم الرئيسي */}
      <main className="flex-1">
        <section className="py-20 md:py-32 px-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

          <div className="max-w-6xl mx-auto flex flex-col md:flex-row-reverse items-center gap-12 md:gap-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 text-center md:text-start space-y-8 relative z-10"
            >
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.2]">
                ادّخروا معًا.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-secondary">
                  تنامَوا معًا.
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto md:mx-0 leading-relaxed">
                صرفة يساعد الأصدقاء والزملاء الموثوقين على جمع أموالهم
                والوصول إلى أهدافهم المالية أسرع من خلال صندوق ادخار دوّار.
                بسيط، شفّاف، ومبني على الثقة.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                {isAuthenticated ? (
                  <Link href="/app">
                    <Button size="xl" className="rounded-full h-14 px-8 text-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                      الذهاب إلى لوحة التحكم
                    </Button>
                  </Link>
                ) : (
                  <Link href="/register">
                    <Button size="xl" className="rounded-full h-14 px-8 text-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                      ابدأ الآن
                    </Button>
                  </Link>
                )}
                <p className="text-sm text-muted-foreground sm:ms-4 font-medium">
                  مجانًا للأبد. بدون رسوم خفية.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1 relative max-w-md w-full"
            >
              <div className="absolute inset-0 bg-secondary/20 rounded-full blur-3xl" />
              <img src={mascotImg} alt="تميمة موفّر" className="w-full h-auto drop-shadow-2xl relative z-10" />

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute top-10 -right-10 bg-card p-4 rounded-2xl shadow-xl border border-primary/10 z-20 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">تم استلام الدور!</p>
                  <p className="text-xs text-muted-foreground">١٬٢٠٠٫٠٠ ر.س</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute bottom-20 -left-4 bg-card p-4 rounded-2xl shadow-xl border border-secondary/20 z-20 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">
                  ر
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">دورك التالي</p>
                  <p className="text-xs text-muted-foreground">الأسبوع القادم</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* قسم المميزات */}
        <section className="py-24 bg-card px-6 border-y">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">{HOME_TEXT.groupHeading}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                نسخة عصرية من الجمعيات التقليدية. مبنية على الثقة والشفافية الكاملة.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-background border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Users size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">{HOME_TEXT.step1}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {HOME_TEXT.step1Body}
                </p>
              </div>
              <div className="p-8 rounded-3xl bg-background border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-secondary/20 text-secondary flex items-center justify-center mb-6">
                  <TrendingUp size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">٢. ادفعوا الاشتراك</h3>
                <p className="text-muted-foreground leading-relaxed">
                  كل عضو يدفع مبلغًا ثابتًا في كل دورة (أسبوعية أو شهرية)
                  لتكوين الدور الجماعي.
                </p>
              </div>
              <div className="p-8 rounded-3xl bg-background border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">٣. دوروا بالأدوار</h3>
                <p className="text-muted-foreground leading-relaxed">
                  عضو واحد يستلم كامل الدور في كل جولة، وتدور الأدوار
                  حتى يأخذ الجميع نصيبهم.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-muted-foreground border-t bg-card">
        <p className="font-medium flex items-center justify-center gap-2">
          <img src={iconImg} alt="صرفة" className="w-5 h-5 opacity-60" />
          صرفة &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
