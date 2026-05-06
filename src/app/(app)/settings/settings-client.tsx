"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { initials, formatDate, ROLE_LABELS } from "@/lib/utils";
import {
  Building2, Users, Mail, Shield, UserPlus, Loader2, Crown, Pencil,
} from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string; userId: string; name: string; email: string; role: string; joinedAt: string;
}
interface Invite { id: string; email: string; role: string; expiresAt: string }
interface Props {
  currentUserId: string;
  currentRole: string;
  org: { id: string; name: string; slug: string };
  user: { id: string; name: string; email: string };
  members: Member[];
  invites: Invite[];
}

const ROLE_BADGE: Record<string, string> = {
  OWNER: "bg-amber-50 text-amber-700 border-amber-200",
  EDITOR: "bg-blue-50 text-blue-700 border-blue-200",
  VIEWER: "bg-muted text-muted-foreground border-border",
};

export function SettingsClient({ currentUserId, currentRole, org, user, members, invites }: Props) {
  const [activeTab, setActiveTab] = useState<"org" | "team" | "account">("org");
  const [inviteDialog, setInviteDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isOwner = currentRole === "OWNER";

  const TABS = [
    { id: "org", label: "Organization", icon: Building2 },
    { id: "team", label: "Team", icon: Users },
    { id: "account", label: "Account", icon: Shield },
  ] as const;

  function handleOrgUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      toast.success("Organization updated");
      window.location.reload();
    });
  }

  function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      toast.success("Invitation sent (feature coming soon)");
      setInviteDialog(false);
    });
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-card">
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your organization and account preferences
        </p>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Side tabs */}
        <div className="w-44 shrink-0 border-r border-border p-3 space-y-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                activeTab === id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "org" && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="text-sm font-semibold">Organization details</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update your organization name and settings
                </p>
              </div>

              <form onSubmit={handleOrgUpdate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Organization name</Label>
                  <Input defaultValue={org.name} name="name" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <div className="flex items-center">
                    <span className="flex items-center px-3 h-10 bg-muted border border-input border-r-0 rounded-l-md text-sm text-muted-foreground">
                      stayflow.io/
                    </span>
                    <Input defaultValue={org.slug} name="slug"
                      className="h-10 rounded-l-none" disabled />
                  </div>
                  <p className="text-xs text-muted-foreground">Slug cannot be changed after creation.</p>
                </div>
                {isOwner && (
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    Save changes
                  </Button>
                )}
              </form>

              {/* Danger zone */}
              {isOwner && (
                <div className="rounded-xl border border-destructive/20 p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
                  <p className="text-xs text-muted-foreground">
                    Deleting your organization is permanent and cannot be undone.
                    All events, guests, and data will be lost.
                  </p>
                  <Button variant="destructive" size="sm" disabled>
                    Delete organization
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === "team" && (
            <div className="max-w-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Team members</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {members.length} member{members.length !== 1 ? "s" : ""} in your organization
                  </p>
                </div>
                {isOwner && (
                  <Button size="sm" onClick={() => setInviteDialog(true)}>
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Invite
                  </Button>
                )}
              </div>

              {/* Members list */}
              <div className="bg-card rounded-xl border border-border divide-y divide-border">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3.5">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                        {initials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        {m.userId === currentUserId && (
                          <span className="text-[10px] text-muted-foreground">(you)</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${ROLE_BADGE[m.role] || ROLE_BADGE.VIEWER}`}>
                        {m.role === "OWNER" && <Crown className="w-2.5 h-2.5 inline mr-0.5" />}
                        {ROLE_LABELS[m.role] || m.role}
                      </span>
                      <span className="text-xs text-muted-foreground/60">
                        Joined {formatDate(m.joinedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pending invites */}
              {invites.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                    Pending invites
                  </h3>
                  <div className="bg-card rounded-xl border border-border divide-y divide-border">
                    {invites.map((inv) => (
                      <div key={inv.id} className="flex items-center gap-3 px-4 py-3.5">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{inv.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Expires {formatDate(inv.expiresAt)}
                          </p>
                        </div>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${ROLE_BADGE[inv.role] || ROLE_BADGE.VIEWER}`}>
                          {ROLE_LABELS[inv.role] || inv.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "account" && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="text-sm font-semibold">Account details</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your personal account information
                </p>
              </div>

              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Role: <span className="font-medium">{ROLE_LABELS[currentRole] || currentRole}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Display name</Label>
                  <Input defaultValue={user.name} className="h-10" disabled />
                  <p className="text-xs text-muted-foreground">Name editing coming soon</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Email address</Label>
                  <Input defaultValue={user.email} type="email" className="h-10" disabled />
                </div>
              </div>

              <div className="rounded-xl border border-border p-5 space-y-3">
                <h3 className="text-sm font-semibold">Change password</h3>
                <p className="text-xs text-muted-foreground">
                  Password change functionality coming soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email address *</Label>
              <Input type="email" name="email" placeholder="colleague@company.com" required className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select name="role" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setInviteDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Send invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
