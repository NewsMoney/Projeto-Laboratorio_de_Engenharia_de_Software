import { BottomNav } from "./MobileUI";
import { DesktopSidebar } from "./DesktopUI";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // true quando estiver em desktop
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop */}
      {isDesktop && <DesktopSidebar />}

      <main className="flex-1 flex flex-col pb-16 lg:pb-0">
        {children}
      </main>

      {/* Mobile */}
      {!isDesktop && <BottomNav />}
    </div>
  );
}