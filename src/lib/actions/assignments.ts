"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function assertAccess(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });
  if (!member) throw new Error("Unauthorized");

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.organizationId !== member.organizationId) {
    throw new Error("Not found");
  }
  return event;
}

export async function assignRoom(
  eventId: string,
  data: {
    guestIds: string[];
    roomTypeId: string;
    roomNumber?: string;
    billingInstructions?: string;
    extraBeds?: number;
  }
) {
  await assertAccess(eventId);

  const results = await Promise.all(
    data.guestIds.map((guestId) =>
      prisma.assignment.upsert({
        where: { guestId },
        create: {
          guestId,
          roomTypeId: data.roomTypeId,
          roomNumber: data.roomNumber,
          billingInstructions: data.billingInstructions,
          extraBeds: data.extraBeds || 0,
        },
        update: {
          roomTypeId: data.roomTypeId,
          roomNumber: data.roomNumber,
          billingInstructions: data.billingInstructions,
          extraBeds: data.extraBeds || 0,
        },
      })
    )
  );

  revalidatePath(`/events/${eventId}/stays`);
  return { count: results.length };
}

export async function removeAssignment(eventId: string, guestId: string) {
  await assertAccess(eventId);

  await prisma.assignment.deleteMany({ where: { guestId } });
  revalidatePath(`/events/${eventId}/stays`);
  return { success: true };
}

export async function updateAssignment(
  eventId: string,
  assignmentId: string,
  data: {
    roomNumber?: string;
    billingInstructions?: string;
    extraBeds?: number;
  }
) {
  await assertAccess(eventId);

  await prisma.assignment.update({
    where: { id: assignmentId },
    data,
  });

  revalidatePath(`/events/${eventId}/stays`);
  return { success: true };
}
