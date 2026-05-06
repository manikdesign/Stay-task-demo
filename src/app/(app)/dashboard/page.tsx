import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Users,
  Building2,
  BedDouble,
  ArrowRight,
  Plus,
  TrendingUp,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
    include: { organization: true, user: true },
  });
  if (!member) redirect("/login");

  const [events, totalGuests, totalAssigned, totalPending] = await Promise.all([
    prisma.event.findMany({
      where: { organizationId: member.organizationId },
      include: {
        _count: { select: { guests: true, hotels: true } },
      },
      orderBy: { checkInDate: "asc" },
      take: 5,
    }),
    prisma.guest.count({
      where: { event: { organizationId: member.organizationId } },
    }),
    prisma.assignment.count({
      where: { guest: { event: { organizationId: member.organizationId } } },
    }),
    prisma.document.count({
      where: {
        status: "PENDING",
        guest: { event: { organizationId: member.organizationId } },
      },
    }),
  ]);

  const totalEvents = events.length;
  const assignmentRate = totalGuests > 0
    ? Math.round((totalAssigned / totalGuests) * 100)
    : 0;

  const stats = [
    {
      label: "Active events",
      value: totalEvents,
      icon: CalendarDays,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Total guests",
      value: totalGuests.toLocaleString(),
      icon: Users,
      color: "text-violet-600 bg-violet-50",
    },
    {
      label: "Rooms assigned",
      value: `${assignmentRate}%`,
      icon: BedDouble,
      color: "text-emerald-600 bg-emerald-50",
      sub: `${totalAssigned} of ${totalGuests}`,
    },
    {
      label: "Docs pending",
      value: totalPending,
      icon: TrendingUp,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  const firstName = member.user.name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {greeting}, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {member.organization.name}
            </p>
          </div>
          <ButtonLink size="sm" href="/events/new">
            <Plus className="w-4 h-4 mr-1.5" />
            New event
          </ButtonLink>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card rounded-xl border border-border p-4 space-y-3"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                {stat.sub && (
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{stat.sub}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Events list */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">Upcoming events</h2>
            <ButtonLink variant="ghost" size="sm" className="text-xs h-7" href="/events">
              View all
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </ButtonLink>
          </div>

          {events.length === 0 ? (
            <EmptyDashboard />
          ) : (
            <div className="divide-y divide-border">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {event.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(event.checkInDate)} → {formatDate(event.checkOutDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      {event._count.guests}
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5" />
                      {event._count.hotels}
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-5 font-medium"
                    >
                      {event.status}
                    </Badge>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-4">
        <CalendarDays className="w-5 h-5 text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">No events yet</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
        Create your first event to start managing guest accommodations.
      </p>
      <ButtonLink size="sm" className="mt-4" href="/events/new">
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Create event
      </ButtonLink>
    </div>
  );
}
