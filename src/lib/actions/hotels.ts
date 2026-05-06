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
  return member;
}

export async function createHotel(eventId: string, formData: FormData) {
  await assertAccess(eventId);

  const hotel = await prisma.hotel.create({
    data: {
      eventId,
      name: formData.get("name") as string,
      address: formData.get("address") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    },
  });

  revalidatePath(`/events/${eventId}/hotels`);
  return { hotelId: hotel.id };
}

export async function updateHotel(eventId: string, hotelId: string, formData: FormData) {
  await assertAccess(eventId);

  await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      name: formData.get("name") as string,
      address: formData.get("address") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    },
  });

  revalidatePath(`/events/${eventId}/hotels`);
  return { success: true };
}

export async function deleteHotel(eventId: string, hotelId: string) {
  await assertAccess(eventId);
  await prisma.hotel.delete({ where: { id: hotelId } });
  revalidatePath(`/events/${eventId}/hotels`);
  return { success: true };
}

export async function createRoomType(eventId: string, hotelId: string, formData: FormData) {
  await assertAccess(eventId);

  const roomType = await prisma.roomType.create({
    data: {
      hotelId,
      name: formData.get("name") as string,
      category: formData.get("category") as string || undefined,
      bedType: formData.get("bedType") as string || undefined,
      occupancy: parseInt(formData.get("occupancy") as string) || 2,
      maxOccupancy: parseInt(formData.get("maxOccupancy") as string) || 3,
      pricePerNight: formData.get("pricePerNight")
        ? parseFloat(formData.get("pricePerNight") as string)
        : undefined,
    },
  });

  revalidatePath(`/events/${eventId}/hotels`);
  return { roomTypeId: roomType.id };
}

export async function updateRoomType(
  eventId: string,
  roomTypeId: string,
  formData: FormData
) {
  await assertAccess(eventId);

  await prisma.roomType.update({
    where: { id: roomTypeId },
    data: {
      name: formData.get("name") as string,
      category: formData.get("category") as string || undefined,
      bedType: formData.get("bedType") as string || undefined,
      occupancy: parseInt(formData.get("occupancy") as string) || 2,
      maxOccupancy: parseInt(formData.get("maxOccupancy") as string) || 3,
      pricePerNight: formData.get("pricePerNight")
        ? parseFloat(formData.get("pricePerNight") as string)
        : undefined,
    },
  });

  revalidatePath(`/events/${eventId}/hotels`);
  return { success: true };
}

export async function deleteRoomType(eventId: string, roomTypeId: string) {
  await assertAccess(eventId);
  await prisma.roomType.delete({ where: { id: roomTypeId } });
  revalidatePath(`/events/${eventId}/hotels`);
  return { success: true };
}

export async function upsertRoomBlock(
  eventId: string,
  roomTypeId: string,
  date: string,
  quantity: number
) {
  await assertAccess(eventId);

  await prisma.roomBlock.upsert({
    where: { roomTypeId_date: { roomTypeId, date: new Date(date) } },
    create: { roomTypeId, date: new Date(date), quantity },
    update: { quantity },
  });

  revalidatePath(`/events/${eventId}/hotels`);
  return { success: true };
}
