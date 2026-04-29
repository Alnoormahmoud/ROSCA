import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import {
  LayoutDashboard,
  Wallet,
  PlusCircle,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import iconImg from "@/assets/normal.png";
import nameImg from "@/assets/name.png";
import {
  useGetMyProfile,
  getGetMyProfileQueryKey,
} from "@workspace/api-client-react";

const navItems = [
  { href: "/app", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/app/funds", label: "صناديقي", icon: Wallet },
  { href: "/app/funds/new", label: "إنشاء صندوق", icon: PlusCircle },
  { href: "/app/profile", label: "ملفي الشخصي", icon: User },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Pick exactly ONE active item: the longest navItem href whose path matches
  // the current location. Prevents "صناديقي" (/app/funds) from also lighting
  // up when the user is on "إنشاء صندوق" (/app/funds/new).
  const activeHref =
    [...navItems]
      .filter(
        (it) =>
          location === it.href ||
          (it.href !== "/app" && location.startsWith(it.href + "/")),
      )
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;

  const { data: profileEnv } = useGetMyProfile({
    query: {
      queryKey: getGetMyProfileQueryKey(),
      enabled: !!user,
    },
  });

  const profile = profileEnv?.profile;

  // إغلاق قائمة الجوال عند تغيير المسار
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* الشريط العلوي للجوال */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <img src={iconImg} alt="صرفة" className="w-8 h-8 object-contain" />
          <img
            src={nameImg}
            alt="صرفة"
            className="w-32 h-auto object-contain"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* الشريط الجانبي */}
      <AnimatePresence>
        {(isMobileMenuOpen ||
          (typeof window !== "undefined" && window.innerWidth >= 768)) && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`
              fixed md:static inset-y-0 end-0 z-50
              w-64 bg-card border-s flex flex-col
              ${isMobileMenuOpen ? "block" : "hidden md:flex"}
            `}
            >
              <div className="p-6 flex items-center gap-3 border-b hidden md:flex">
                <img
                  src={iconImg}
                  alt="صرفة"
                  className="w-10 h-10 object-contain"
                />
                <img
                  src={nameImg}
                  alt="صرفة"
                  className="w-32 h-auto object-contain"
                />
              </div>

              <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeHref === item.href;
                  return (
                    <Link key={item.href} href={item.href} className="block">
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start gap-3 h-12 ${isActive ? "font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        <Icon size={20} />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t flex flex-col gap-4">
                <div className="flex items-center gap-3 px-2">
                  <Avatar className="h-10 w-10 border-2 border-primary/10">
                    <AvatarImage
                      src={
                        profile?.profileImageUrl || user?.profileImageUrl || ""
                      }
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {profile?.fullName?.charAt(0) ||
                        user?.firstName?.charAt(0) ||
                        "م"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {profile?.fullName || user?.firstName || "مستخدم"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile?.username ? `@${profile.username}` : ""}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-center gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={logout}
                >
                  <LogOut size={16} />
                  تسجيل الخروج
                </Button>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">{children}</div>
        </div>
      </main>
    </div>
  );
}
