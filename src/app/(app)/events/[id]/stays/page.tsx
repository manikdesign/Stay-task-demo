import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { StaysClient } from "./stays-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StaysPage({ params }: Props) {
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
      hotels: {
        include: {
          roomTypes: {
            include: {
              blocks: true,
              assignments: {
                include: {
                  guest: { include: { group: true } },
                },
              },
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
      guests: {
        include: {
          group: true,
          assignment: { include: { roomType: { include: { hotel: true } } } },
        },
        orderBy: { firstName: "asc" },
      },
      groups: { orderBy: { name: "asc" } },
    },
  });

  if (!event || event.organizationId !== member.organizationId) notFound();

  return (
    <StaysClient
      eventId={id}
      event={{
        checkInDate: event.checkInDate.toISOString(),
        checkOutDate: event.checkOutDate.toISOString(),
      }}
      hotels={event.hotels.map((h) => ({
        id: h.id,
        name: h.name,
        roomTypes: h.roomTypes.map((rt) => ({
          id: rt.id,
          name: rt.name,
          category: rt.category,
          bedType: rt.bedType,
          occupancy: rt.occupancy,
          maxOccupancy: rt.maxOccupancy,
          totalBlock: rt.blocks.length > 0 ? Math.min(...rt.blocks.map((b) => b.quantity)) : 0,
          assignedCount: rt.assignments.length,
          assignments: rt.assignments.map((a) => ({
            id: a.id,
            guestId: a.guestId,
            guestName: `${a.guest.firstName} ${a.guest.lastName || ""}`.trim(),
            groupName: a.guest.group?.name,
            groupColor: a.guest.group?.color,
            roomNumber: a.roomNumber,
            extraBeds: a.extraBeds,
            billingInstructions: a.billingInstructions,
          })),
        })),
      }))}
      guests={event.guests.map((g) => ({
        id: g.id,
        title: g.title,
        firstName: g.firstName,
        lastName: g.lastName,
        paxCount: g.paxCount,
        groupId: g.groupId,
        groupName: g.group?.name,
        groupColor: g.group?.color,
        checkInDate: g.checkInDate?.toISOString(),
        checkOutDate: g.checkOutDate?.toISOString(),
        assigned: !!g.assignment,
        assignedHotel: g.assignment?.roomType.hotel.name,
        assignedRoom: g.assignment?.roomType.name,
        assignmentId: g.assignment?.id,
      }))}
      groups={event.groups.map((g) => ({ id: g.id, name: g.name, color: g.color }))}
    />
  );
}
