import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
    include: {
      organization: {
        include: {
          members: {
            include: { user: true },
            orderBy: { createdAt: "asc" },
          },
          invites: true,
        },
      },
      user: true,
    },
  });

  if (!member) redirect("/login");

  return (
    <SettingsClient
      currentUserId={session.user.id}
      currentRole={member.role}
      org={{
        id: member.organization.id,
        name: member.organization.name,
        slug: member.organization.slug,
      }}
      user={{
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
      }}
      members={member.organization.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        joinedAt: m.createdAt.toISOString(),
      }))}
      invites={member.organization.invites.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        expiresAt: i.expiresAt.toISOString(),
      }))}
    />
  );
}
