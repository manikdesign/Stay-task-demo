"use client";

import { useActionState } from "react";
import { register } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";

type State = { error?: string } | undefined;

export default function RegisterPage() {
  const [state, action, isPending] = useActionState<State, FormData>(
    register as unknown as (state: State, formData: FormData) => Promise<State>,
    undefined
  );

  return (
    <div className="space-y-8 animate-in-up">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Set up StayFlow for your planning business
        </p>
      </div>

      {/* Error */}
      {state?.error && (
        <div className="flex items-start gap-2.5 rounded-lg bg-destructive/8 border border-destructive/20 px-3.5 py-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Form */}
      <form action={action} className="space-y-4">
        {/* Org name */}
        <div className="space-y-1.5">
          <Label htmlFor="orgName" className="text-sm font-medium">
            Company / Agency name
          </Label>
          <Input
            id="orgName"
            name="orgName"
            type="text"
            placeholder="The Grand Celebrations"
            required
            className="h-10"
          />
        </div>

        <div className="h-px bg-border" />

        {/* Personal details */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium">
            Your name
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Priya Mehta"
            autoComplete="name"
            required
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">
            Work email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            required
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            required
            minLength={8}
            className="h-10"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-10"
          disabled={isPending}
        >
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary font-medium hover:underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs text-muted-foreground/70">
        By creating an account, you agree to our terms and privacy policy.
      </p>
    </div>
  );
}
