"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";

type State = { error?: string } | undefined;

export default function LoginPage() {
  const [state, action, isPending] = useActionState<State, FormData>(
    login as unknown as (state: State, formData: FormData) => Promise<State>,
    undefined
  );

  return (
    <div className="space-y-8 animate-in-up">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your StayFlow account
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
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">
            Email address
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="h-10"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-10"
          disabled={isPending}
        >
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-primary font-medium hover:underline underline-offset-4"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
