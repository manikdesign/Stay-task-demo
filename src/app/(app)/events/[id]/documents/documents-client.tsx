"use client";

import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  updateDocumentStatus, createDocument, deleteDocument,
} from "@/lib/actions/documents";
import {
  FileText, Search, X, Plus, ChevronDown, Trash2,
  CheckCircle2, Clock, Eye, AlertCircle, Loader2, Users,
} from "lucide-react";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import { toast } from "sonner";

interface Doc {
  id: string; name: string; type: string | null; status: string;
  fileUrl: string | null; createdAt: string;
}
interface GuestDoc {
  id: string; name: string; groupName?: string; groupColor?: string | null;
  documents: Doc[];
}
interface Totals { total: number; pending: number; submitted: number; reviewed: number }

interface Props {
  eventId: string; guests: GuestDoc[]; totals: Totals;
}

const STATUS_CONFIG = {
  PENDING: { label: "Pending", icon: Clock, className: "status-pending" },
  SUBMITTED: { label: "Submitted", icon: Eye, className: "status-submitted" },
  REVIEWED: { label: "Reviewed", icon: CheckCircle2, className: "status-reviewed" },
};

export function DocumentsClient({ eventId, guests, totals }: Props) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [addDialog, setAddDialog] = useState<{ open: boolean; guestId?: string; guestName?: string }>({ open: false });
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || g.documents.some((d) => d.status === filterStatus);
      return matchSearch && matchStatus;
    });
  }, [guests, search, filterStatus]);

  function handleStatusChange(docId: string, status: "PENDING" | "SUBMITTED" | "REVIEWED") {
    startTransition(async () => {
      await updateDocumentStatus(eventId, docId, status);
      toast.success(`Status updated to ${status.toLowerCase()}`);
      window.location.reload();
    });
  }

  function handleDelete(docId: string) {
    if (!confirm("Delete this document record?")) return;
    startTransition(async () => {
      await deleteDocument(eventId, docId);
      toast.success("Document removed");
      window.location.reload();
    });
  }

  function handleAddDoc(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createDocument(eventId, addDialog.guestId!, fd);
      toast.success("Document added");
      setAddDialog({ open: false });
      window.location.reload();
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-6 flex-wrap">
          {[
            { label: "Total", value: totals.total, color: "text-foreground" },
            { label: "Pending", value: totals.pending, color: "text-amber-600" },
            { label: "Submitted", value: totals.submitted, color: "text-blue-600" },
            { label: "Reviewed", value: totals.reviewed, color: "text-emerald-600" },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => setFilterStatus(s.label === "Total" ? null : s.label.toUpperCase())}
              className={cn(
                "text-center transition-opacity",
                filterStatus && filterStatus !== s.label.toUpperCase() && s.label !== "Total" ? "opacity-40" : ""
              )}
            >
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Search guests…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm w-48" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            {filterStatus && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setFilterStatus(null)}>
                <X className="w-3.5 h-3.5 mr-1" />
                Clear filter
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Guest list with docs */}
      <div className="flex-1 overflow-auto p-6 space-y-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-8 h-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">No guests found</p>
          </div>
        )}
        {filtered.map((guest) => {
          const docs = filterStatus
            ? guest.documents.filter((d) => d.status === filterStatus)
            : guest.documents;

          return (
            <div key={guest.id} className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Guest header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-border/60">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{guest.name}</p>
                  {guest.groupName && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: guest.groupColor || "#6366f1" }} />
                      {guest.groupName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Quick status summary */}
                  {["PENDING", "SUBMITTED", "REVIEWED"].map((s) => {
                    const count = guest.documents.filter((d) => d.status === s).length;
                    if (count === 0) return null;
                    const cfg = STATUS_CONFIG[s as keyof typeof STATUS_CONFIG];
                    return (
                      <span key={s} className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded border", cfg.className)}>
                        {count} {cfg.label}
                      </span>
                    );
                  })}
                  <Button variant="ghost" size="sm" className="h-7 text-xs"
                    onClick={() => setAddDialog({ open: true, guestId: guest.id, guestName: guest.name })}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add doc
                  </Button>
                </div>
              </div>

              {/* Documents */}
              {docs.length === 0 ? (
                <div className="px-5 py-4 text-xs text-muted-foreground/50 italic">
                  No documents {filterStatus ? "with this status" : "added"}
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {docs.map((doc) => {
                    const cfg = STATUS_CONFIG[doc.status as keyof typeof STATUS_CONFIG];
                    const Icon = cfg.icon;
                    return (
                      <div key={doc.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors group">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {doc.type && <span className="mr-2">{doc.type}</span>}
                            Added {formatRelative(doc.createdAt)}
                          </p>
                        </div>

                        {/* Status badge with dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<button className={cn(
                              "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border transition-colors hover:opacity-80",
                              cfg.className
                            )} />}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                            <ChevronDown className="w-3 h-3" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                              <DropdownMenuItem key={key}
                                onClick={() => handleStatusChange(doc.id, key as "PENDING" | "SUBMITTED" | "REVIEWED")}
                                className={doc.status === key ? "font-medium" : ""}>
                                <val.icon className="w-3.5 h-3.5 mr-2" />
                                {val.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity"
                          onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add document dialog */}
      <Dialog open={addDialog.open} onOpenChange={(o: boolean) => setAddDialog({ open: o })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add document</DialogTitle>
            {addDialog.guestName && (
              <p className="text-sm text-muted-foreground">For {addDialog.guestName}</p>
            )}
          </DialogHeader>
          <form onSubmit={handleAddDoc} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Document name *</Label>
              <Input name="name" placeholder="Aadhaar Card, Passport…" required className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Input name="type" placeholder="ID Proof, Travel Document…" className="h-9" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddDialog({ open: false })}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Add document
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
