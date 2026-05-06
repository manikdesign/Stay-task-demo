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
}

export async function updateDocumentStatus(
  eventId: string,
  documentId: string,
  status: "PENDING" | "SUBMITTED" | "REVIEWED"
) {
  await assertAccess(eventId);

  await prisma.document.update({
    where: { id: documentId },
    data: { status },
  });

  revalidatePath(`/events/${eventId}/documents`);
  return { success: true };
}

export async function bulkUpdateDocumentStatus(
  eventId: string,
  guestIds: string[],
  status: "PENDING" | "SUBMITTED" | "REVIEWED"
) {
  await assertAccess(eventId);

  await prisma.document.updateMany({
    where: { guestId: { in: guestIds } },
    data: { status },
  });

  revalidatePath(`/events/${eventId}/documents`);
  return { success: true };
}

export async function createDocument(
  eventId: string,
  guestId: string,
  formData: FormData
) {
  await assertAccess(eventId);

  const doc = await prisma.document.create({
    data: {
      guestId,
      name: formData.get("name") as string,
      type: formData.get("type") as string || undefined,
      status: "PENDING",
    },
  });

  revalidatePath(`/events/${eventId}/documents`);
  return { documentId: doc.id };
}

export async function deleteDocument(eventId: string, documentId: string) {
  await assertAccess(eventId);
  await prisma.document.delete({ where: { id: documentId } });
  revalidatePath(`/events/${eventId}/documents`);
  return { success: true };
}
