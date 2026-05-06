import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { formatDate, nightsBetween } from "@/lib/utils";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  BedDouble,
  FileText,
  CalendarDays,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventOverviewPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });
  if (!member) redirect("/login");

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      hotels: { include: { roomTypes: { include: { assignments: true, blocks: true } } } },
      guests: { include: { assignment: true, documents: true } },
      groups: true,
    },
  });

  if (!event || event.organizationId !== member.organizationId) notFound();

  const totalGuests = event.guests.length;
  const assignedGuests = event.guests.filter((g) => g.assignment).length;
  const unassignedGuests = totalGuests - assignedGuests;
  const assignmentRate = totalGuests > 0 ? Math.round((assignedGuests / totalGuests) * 100) : 0;

  const totalDocs = event.guests.reduce((sum, g) => sum + g.documents.length, 0);
  const pendingDocs = event.guests.reduce(
    (sum, g) => sum + g.documents.filter((d) => d.status === "PENDING").length,
    0
  );
  const reviewedDocs = event.guests.reduce(
    (sum, g) => sum + g.documents.filter((d) => d.status === "REVIEWED").length,
    0
  );

  const nights = nightsBetween(event.checkInDate, event.checkOutDate);

  const quickLinks = [
    { href: `/events/${id}/hotels`, icon: Building2, label: "Hotels & Rooms", count: event.hotels.length, sub: "Configure room blocks" },
    { href: `/events/${id}/guests`, icon: Users, label: "Guest List", count: totalGuests, sub: "Manage guest entries" },
    { href: `/events/${id}/stays`, icon: BedDouble, label: "Stay Assignments", count: `${assignmentRate}%`, sub: `${assignedGuests} of ${totalGuests} assigned` },
    { href: `/events/${id}/documents`, icon: FileText, label: "Documents", count: totalDocs, sub: `${pendingDocs} pending review` },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Event summary card */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-foreground">{event.name}</h2>
              <Badge variant="secondary" className="text-[10px] font-medium">
                {event.status}
              </Badge>
            </div>
            {event.venue && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="w-3 h-3" />
                {event.venue}
              </p>
            )}
            {event.description && (
              <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
              <div className="text-xs">
                <span className="text-muted-foreground">Check-in: </span>
                <span className="font-medium">{formatDate(event.checkInDate)}</span>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">Check-out: </span>
                <span className="font-medium">{formatDate(event.checkOutDate)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {nights} night{nights !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <ButtonLink variant="outline" size="sm" href={`/events/${id}/stays`}>Manage stays</ButtonLink>
        </div>
      </div>

      {/* Quick links grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{link.count}</p>
              <p className="text-xs font-medium text-foreground mt-0.5">{link.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{link.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Assignment progress */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Assignment progress</h3>
          <span className="text-sm font-bold text-primary">{assignmentRate}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${assignmentRate}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {assignedGuests} assigned
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {unassignedGuests} pending
          </div>
          {pendingDocs > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              {pendingDocs} docs need review
            </div>
          )}
        </div>
      </div>

      {/* Groups summary */}
      {event.groups.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-3">Groups</h3>
          <div className="flex flex-wrap gap-2">
            {event.groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-xs font-medium"
                style={{ borderColor: group.color || undefined }}
              >
                {group.color && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                )}
                {group.name}
                <span className="text-muted-foreground">
                  · {event.guests.filter((g) => g.groupId === group.id).length}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
