import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { HotelsClient } from "./hotels-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HotelsPage({ params }: Props) {
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
              _count: { select: { assignments: true } },
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!event || event.organizationId !== member.organizationId) notFound();

  return (
    <HotelsClient
      eventId={id}
      event={{
        checkInDate: event.checkInDate.toISOString(),
        checkOutDate: event.checkOutDate.toISOString(),
      }}
      hotels={event.hotels.map((h) => ({
        id: h.id,
        name: h.name,
        address: h.address,
        phone: h.phone,
        notes: h.notes,
        roomTypes: h.roomTypes.map((rt) => ({
          id: rt.id,
          name: rt.name,
          category: rt.category,
          bedType: rt.bedType,
          occupancy: rt.occupancy,
          maxOccupancy: rt.maxOccupancy,
          pricePerNight: rt.pricePerNight,
          assignedCount: rt._count.assignments,
          blocks: rt.blocks.map((b) => ({
            date: b.date.toISOString(),
            quantity: b.quantity,
          })),
        })),
      }))}
    />
  );
}
