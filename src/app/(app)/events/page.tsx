import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { formatDate, nightsBetween } from "@/lib/utils";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import {
  CalendarDays,
  Users,
  Building2,
  BedDouble,
  Plus,
  ArrowRight,
  MapPin,
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-muted text-muted-foreground border-border",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
};

export default async function EventsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });
  if (!member) redirect("/login");

  const events = await prisma.event.findMany({
    where: { organizationId: member.organizationId },
    include: {
      _count: { select: { guests: true, hotels: true } },
      hotels: {
        include: {
          _count: { select: { roomTypes: true } },
        },
        take: 1,
      },
    },
    orderBy: { checkInDate: "asc" },
  });

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Events"
        description={`${events.length} event${events.length !== 1 ? "s" : ""} in your organization`}
      >
        <ButtonLink size="sm" href="/events/new">
          <Plus className="w-4 h-4 mr-1.5" />
          New event
        </ButtonLink>
      </PageHeader>

      <div className="flex-1 p-6">
        {events.length === 0 ? (
          <EmptyEvents />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {events.map((event) => {
              const nights = nightsBetween(event.checkInDate, event.checkOutDate);
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200 p-5 flex flex-col gap-4"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-4 h-4 text-primary" />
                    </div>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${STATUS_STYLES[event.status] || STATUS_STYLES.ACTIVE}`}>
                      {event.status}
                    </span>
                  </div>

                  {/* Name */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {event.name}
                    </h3>
                    {event.venue && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        {event.venue}
                      </p>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">
                      {formatDate(event.checkInDate)}
                    </span>
                    <span className="mx-1.5 text-muted-foreground/40">→</span>
                    <span className="font-medium text-foreground/80">
                      {formatDate(event.checkOutDate)}
                    </span>
                    <span className="ml-2 text-muted-foreground/60">
                      {nights} night{nights !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 pt-1 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>{event._count.guests} guests</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{event._count.hotels} hotel{event._count.hotels !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="ml-auto">
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyEvents() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-5">
        <CalendarDays className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground">No events yet</h3>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-[280px]">
        Create your first event to start managing guest hotel allocations.
      </p>
      <ButtonLink className="mt-5" href="/events/new">
        <Plus className="w-4 h-4 mr-1.5" />
        Create your first event
      </ButtonLink>
    </div>
  );
}
