import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { DocumentsClient } from "./documents-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DocumentsPage({ params }: Props) {
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
          documents: { orderBy: { createdAt: "desc" } },
          group: true,
        },
        orderBy: { firstName: "asc" },
      },
      groups: true,
    },
  });

  if (!event || event.organizationId !== member.organizationId) notFound();

  const guestData = event.guests.map((g) => ({
    id: g.id,
    name: `${g.firstName} ${g.lastName || ""}`.trim(),
    groupName: g.group?.name,
    groupColor: g.group?.color,
    documents: g.documents.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      status: d.status,
      fileUrl: d.fileUrl,
      createdAt: d.createdAt.toISOString(),
    })),
  }));

  const totals = {
    total: event.guests.reduce((s, g) => s + g.documents.length, 0),
    pending: event.guests.reduce((s, g) => s + g.documents.filter((d) => d.status === "PENDING").length, 0),
    submitted: event.guests.reduce((s, g) => s + g.documents.filter((d) => d.status === "SUBMITTED").length, 0),
    reviewed: event.guests.reduce((s, g) => s + g.documents.filter((d) => d.status === "REVIEWED").length, 0),
  };

  return <DocumentsClient eventId={id} guests={guestData} totals={totals} />;
}
