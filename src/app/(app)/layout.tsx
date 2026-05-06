import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
    include: { organization: true, user: true },
  });

  if (!member) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — desktop only */}
      <div className="hidden lg:flex lg:flex-col lg:h-full">
        <Sidebar
          user={{ name: member.user.name, email: member.user.email }}
          org={{ name: member.organization.name }}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile nav */}
      <MobileNav />

      <Toaster richColors position="top-right" />
    </div>
  );
}
