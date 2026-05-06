"use server";

import { prisma } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { slugify } from "@/lib/utils";
import { z } from "zod";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  orgName: z.string().min(2),
});

export async function register(_prevState: unknown, formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    orgName: formData.get("orgName") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid input. Please check your details." };
  }

  const { name, email, password, orgName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const hashed = await bcrypt.hash(password, 12);
  const baseSlug = slugify(orgName);

  let slug = baseSlug;
  let counter = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });

  const org = await prisma.organization.create({
    data: { name: orgName, slug },
  });

  await prisma.member.create({
    data: { organizationId: org.id, userId: user.id, role: "OWNER" },
  });

  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
}

export async function login(_prevState: unknown, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
