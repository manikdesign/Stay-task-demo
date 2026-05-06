import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { EventNav } from "@/components/layout/event-nav";

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function EventLayout({ children, params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });
  if (!member) redirect("/login");

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.organizationId !== member.organizationId) notFound();

  return (
    <div className="flex flex-col min-h-full">
      <EventNav eventId={id} eventName={event.name} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
