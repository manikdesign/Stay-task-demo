import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { ExportsClient } from "./exports-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ExportsPage({ params }: Props) {
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
          assignment: {
            include: {
              roomType: { include: { hotel: true } },
            },
          },
          documents: true,
        },
        orderBy: { firstName: "asc" },
      },
      hotels: {
        include: {
          roomTypes: {
            include: {
              assignments: {
                include: { guest: { include: { group: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!event || event.organizationId !== member.organizationId) notFound();

  const exportData = {
    event: {
      name: event.name,
      venue: event.venue,
      checkInDate: event.checkInDate.toISOString(),
      checkOutDate: event.checkOutDate.toISOString(),
    },
    guestList: event.guests.map((g) => ({
      name: `${g.firstName} ${g.lastName || ""}`.trim(),
      title: g.title,
      phone: g.phone,
      email: g.email,
      paxCount: g.paxCount,
      group: g.group?.name || "",
      checkInDate: g.checkInDate?.toISOString() || event.checkInDate.toISOString(),
      checkOutDate: g.checkOutDate?.toISOString() || event.checkOutDate.toISOString(),
      hotel: g.assignment?.roomType.hotel.name || "",
      roomType: g.assignment?.roomType.name || "",
      roomNumber: g.assignment?.roomNumber || "",
      billingInstructions: g.assignment?.billingInstructions || "",
      docStatus: g.documents.length === 0 ? "No docs" :
        g.documents.every((d) => d.status === "REVIEWED") ? "All reviewed" :
        g.documents.some((d) => d.status === "PENDING") ? "Pending" : "Submitted",
      assigned: !!g.assignment,
    })),
    hotelList: event.hotels.flatMap((hotel) =>
      hotel.roomTypes.flatMap((rt) =>
        rt.assignments.map((a) => ({
          hotel: hotel.name,
          roomType: rt.name,
          roomNumber: a.roomNumber || "",
          guestName: `${a.guest.firstName} ${a.guest.lastName || ""}`.trim(),
          paxCount: a.guest.paxCount,
          group: a.guest.group?.name || "",
          checkIn: a.guest.checkInDate?.toISOString() || event.checkInDate.toISOString(),
          checkOut: a.guest.checkOutDate?.toISOString() || event.checkOutDate.toISOString(),
          billingInstructions: a.billingInstructions || "",
        }))
      )
    ),
  };

  return <ExportsClient eventId={id} eventName={event.name} data={exportData} />;
}
