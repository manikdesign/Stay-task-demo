"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

async function getCurrentMember() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  if (!member) throw new Error("No organization found");
  return member;
}

const eventSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  venue: z.string().optional(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
});

export async function createEvent(formData: FormData) {
  const member = await getCurrentMember();

  const raw = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    venue: formData.get("venue") as string,
    checkInDate: formData.get("checkInDate") as string,
    checkOutDate: formData.get("checkOutDate") as string,
  };

  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid event data." };

  const event = await prisma.event.create({
    data: {
      organizationId: member.organizationId,
      name: parsed.data.name,
      description: parsed.data.description,
      venue: parsed.data.venue,
      checkInDate: new Date(parsed.data.checkInDate),
      checkOutDate: new Date(parsed.data.checkOutDate),
    },
  });

  revalidatePath("/events");
  return { eventId: event.id };
}

export async function updateEvent(eventId: string, formData: FormData) {
  const member = await getCurrentMember();
  await assertEventAccess(eventId, member.organizationId);

  const raw = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    venue: formData.get("venue") as string,
    checkInDate: formData.get("checkInDate") as string,
    checkOutDate: formData.get("checkOutDate") as string,
  };

  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid event data." };

  await prisma.event.update({
    where: { id: eventId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      venue: parsed.data.venue,
      checkInDate: new Date(parsed.data.checkInDate),
      checkOutDate: new Date(parsed.data.checkOutDate),
    },
  });

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function deleteEvent(eventId: string) {
  const member = await getCurrentMember();
  await assertEventAccess(eventId, member.organizationId);

  await prisma.event.delete({ where: { id: eventId } });
  revalidatePath("/events");
  return { success: true };
}

async function assertEventAccess(eventId: string, orgId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.organizationId !== orgId) throw new Error("Not found");
  return event;
}
