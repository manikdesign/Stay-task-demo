import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { GuestsClient } from "./guests-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GuestsPage({ params }: Props) {
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
      guests: {
        include: {
          group: true,
          assignment: { include: { roomType: { include: { hotel: true } } } },
          documents: true,
        },
        orderBy: { createdAt: "asc" },
      },
      groups: { orderBy: { name: "asc" } },
    },
  });

  if (!event || event.organizationId !== member.organizationId) notFound();

  return (
    <GuestsClient
      eventId={id}
      event={{
        checkInDate: event.checkInDate.toISOString(),
        checkOutDate: event.checkOutDate.toISOString(),
      }}
      guests={event.guests.map((g) => ({
        id: g.id,
        title: g.title,
        firstName: g.firstName,
        lastName: g.lastName,
        phone: g.phone,
        email: g.email,
        paxCount: g.paxCount,
        groupId: g.groupId,
        groupName: g.group?.name,
        groupColor: g.group?.color,
        checkInDate: g.checkInDate?.toISOString(),
        checkOutDate: g.checkOutDate?.toISOString(),
        notes: g.notes,
        docCount: g.documents.length,
        docPending: g.documents.filter((d) => d.status === "PENDING").length,
        assigned: !!g.assignment,
        assignedTo: g.assignment
          ? `${g.assignment.roomType.hotel.name} · ${g.assignment.roomType.name}`
          : null,
      }))}
      groups={event.groups.map((g) => ({
        id: g.id,
        name: g.name,
        color: g.color,
        parentId: g.parentId,
      }))}
    />
  );
}
