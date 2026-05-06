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
  return { member, event };
}

export async function createGuest(eventId: string, formData: FormData) {
  const { event } = await assertAccess(eventId);

  const guest = await prisma.guest.create({
    data: {
      eventId,
      title: formData.get("title") as string || undefined,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      email: formData.get("email") as string || undefined,
      paxCount: parseInt(formData.get("paxCount") as string) || 1,
      groupId: formData.get("groupId") as string || undefined,
      checkInDate: formData.get("checkInDate")
        ? new Date(formData.get("checkInDate") as string)
        : event.checkInDate,
      checkOutDate: formData.get("checkOutDate")
        ? new Date(formData.get("checkOutDate") as string)
        : event.checkOutDate,
      notes: formData.get("notes") as string || undefined,
    },
  });

  revalidatePath(`/events/${eventId}/guests`);
  return { guestId: guest.id };
}

export async function updateGuest(eventId: string, guestId: string, formData: FormData) {
  await assertAccess(eventId);

  await prisma.guest.update({
    where: { id: guestId },
    data: {
      title: formData.get("title") as string || undefined,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      email: formData.get("email") as string || undefined,
      paxCount: parseInt(formData.get("paxCount") as string) || 1,
      groupId: formData.get("groupId") as string || null,
      checkInDate: formData.get("checkInDate")
        ? new Date(formData.get("checkInDate") as string)
        : undefined,
      checkOutDate: formData.get("checkOutDate")
        ? new Date(formData.get("checkOutDate") as string)
        : undefined,
      notes: formData.get("notes") as string || undefined,
    },
  });

  revalidatePath(`/events/${eventId}/guests`);
  return { success: true };
}

export async function deleteGuest(eventId: string, guestId: string) {
  await assertAccess(eventId);
  await prisma.guest.delete({ where: { id: guestId } });
  revalidatePath(`/events/${eventId}/guests`);
  return { success: true };
}

export async function importGuests(
  eventId: string,
  guests: Array<{
    firstName: string;
    lastName?: string;
    phone?: string;
    email?: string;
    paxCount?: number;
    groupName?: string;
  }>
) {
  const { event } = await assertAccess(eventId);

  const groupCache: Record<string, string> = {};

  const created = await Promise.all(
    guests.map(async (g) => {
      let groupId: string | undefined;

      if (g.groupName) {
        if (!groupCache[g.groupName]) {
          const existing = await prisma.group.findFirst({
            where: { eventId, name: g.groupName },
          });
          const group =
            existing ||
            (await prisma.group.create({ data: { eventId, name: g.groupName } }));
          groupCache[g.groupName] = group.id;
        }
        groupId = groupCache[g.groupName];
      }

      return prisma.guest.create({
        data: {
          eventId,
          firstName: g.firstName,
          lastName: g.lastName,
          phone: g.phone,
          email: g.email,
          paxCount: g.paxCount || 1,
          groupId,
          checkInDate: event.checkInDate,
          checkOutDate: event.checkOutDate,
        },
      });
    })
  );

  revalidatePath(`/events/${eventId}/guests`);
  return { count: created.length };
}

export async function createGroup(eventId: string, formData: FormData) {
  await assertAccess(eventId);

  const group = await prisma.group.create({
    data: {
      eventId,
      name: formData.get("name") as string,
      color: formData.get("color") as string || undefined,
      parentId: formData.get("parentId") as string || undefined,
    },
  });

  revalidatePath(`/events/${eventId}/guests`);
  return { groupId: group.id };
}

export async function deleteGroup(eventId: string, groupId: string) {
  await assertAccess(eventId);

  await prisma.guest.updateMany({
    where: { eventId, groupId },
    data: { groupId: null },
  });

  await prisma.group.delete({ where: { id: groupId } });
  revalidatePath(`/events/${eventId}/guests`);
  return { success: true };
}
