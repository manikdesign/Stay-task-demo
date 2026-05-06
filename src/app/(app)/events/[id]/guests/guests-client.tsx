"use client";

import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createGuest, updateGuest, deleteGuest, createGroup, importGuests,
} from "@/lib/actions/guests";
import {
  Plus, Search, Filter, Users, Trash2, Pencil, Loader2,
  Upload, ChevronDown, UserPlus, CheckCircle2, Clock, X,
} from "lucide-react";
import { cn, formatDate, GROUP_COLORS } from "@/lib/utils";
import { toast } from "sonner";

interface Guest {
  id: string; title: string | null; firstName: string; lastName: string | null;
  phone: string | null; email: string | null; paxCount: number;
  groupId: string | null; groupName: string | undefined; groupColor: string | null | undefined;
  checkInDate: string | undefined; checkOutDate: string | undefined;
  notes: string | null; docCount: number; docPending: number;
  assigned: boolean; assignedTo: string | null;
}
interface Group { id: string; name: string; color: string | null; parentId: string | null }
interface EventMeta { checkInDate: string; checkOutDate: string }

interface Props {
  eventId: string; event: EventMeta; guests: Guest[]; groups: Group[];
}

export function GuestsClient({ eventId, event, guests: initial, groups: initialGroups }: Props) {
  const [guests] = useState(initial);
  const [groups] = useState(initialGroups);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [filterAssigned, setFilterAssigned] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [guestDialog, setGuestDialog] = useState<{ open: boolean; guest?: Guest }>({ open: false });
  const [groupDialog, setGroupDialog] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      const name = `${g.firstName} ${g.lastName || ""}`.toLowerCase();
      const matchSearch = !search || name.includes(search.toLowerCase()) ||
        (g.phone?.includes(search)) || (g.email?.toLowerCase().includes(search.toLowerCase()));
      const matchGroup = !filterGroup || g.groupId === filterGroup;
      const matchAssigned = filterAssigned === null || g.assigned === filterAssigned;
      return matchSearch && matchGroup && matchAssigned;
    });
  }, [guests, search, filterGroup, filterAssigned]);

  const allSelected = filtered.length > 0 && filtered.every((g) => selected.has(g.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((g) => g.id)));
    }
  }

  function toggleGuest(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleGuestSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      if (guestDialog.guest) {
        await updateGuest(eventId, guestDialog.guest.id, fd);
        toast.success("Guest updated");
      } else {
        await createGuest(eventId, fd);
        toast.success("Guest added");
      }
      setGuestDialog({ open: false });
      window.location.reload();
    });
  }

  function handleDelete(guestId: string, name: string) {
    if (!confirm(`Remove "${name}"?`)) return;
    startTransition(async () => {
      await deleteGuest(eventId, guestId);
      toast.success("Guest removed");
      window.location.reload();
    });
  }

  function handleGroupSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createGroup(eventId, fd);
      toast.success("Group created");
      setGroupDialog(false);
      window.location.reload();
    });
  }

  const stats = {
    total: guests.length,
    assigned: guests.filter((g) => g.assigned).length,
    unassigned: guests.filter((g) => !g.assigned).length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search guests…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Group filter */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 text-xs" />}>
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              {filterGroup ? groups.find((g) => g.id === filterGroup)?.name : "All groups"}
              <ChevronDown className="w-3 h-3 ml-1.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterGroup(null)}>All groups</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterGroup("__none__")}>No group</DropdownMenuItem>
              {groups.map((g) => (
                <DropdownMenuItem key={g.id} onClick={() => setFilterGroup(g.id)}>
                  <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: g.color || "#6366f1" }} />
                  {g.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Assignment filter */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 text-xs" />}>
              {filterAssigned === null ? "All" : filterAssigned ? "Assigned" : "Unassigned"}
              <ChevronDown className="w-3 h-3 ml-1.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterAssigned(null)}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterAssigned(true)}>Assigned</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterAssigned(false)}>Unassigned</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1" />

          {/* Stats badges */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{stats.assigned} assigned
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />{stats.unassigned} pending
            </span>
          </div>

          {/* Actions */}
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setGroupDialog(true)}>
            <Users className="w-3.5 h-3.5 mr-1.5" />
            New group
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setImportDialog(true)}>
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Import CSV
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={() => setGuestDialog({ open: true })}>
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Add guest
          </Button>
        </div>

        {/* Selected actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">{selected.size} selected</span>
            <a href={`/events/${eventId}/stays?assign=${Array.from(selected).join(",")}`}
              className="inline-flex items-center justify-center h-7 px-2.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
              Assign rooms
            </a>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground"
              onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <EmptyGuests onAdd={() => setGuestDialog({ open: true })} />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card border-b border-border z-10">
              <tr>
                <th className="w-10 px-4 py-3">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </th>
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">#</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">Guest</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">Contact</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">Group</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground">Pax</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">Check-in</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">Room</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground">Docs</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((guest, i) => (
                <tr
                  key={guest.id}
                  className={cn(
                    "group hover:bg-muted/30 transition-colors",
                    selected.has(guest.id) && "bg-primary/4"
                  )}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selected.has(guest.id)}
                      onCheckedChange={() => toggleGuest(guest.id)}
                    />
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-3">
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {guest.title ? `${guest.title} ` : ""}{guest.firstName}
                        {guest.lastName ? ` ${guest.lastName}` : ""}
                      </p>
                      {guest.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">
                          {guest.notes}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-xs space-y-0.5">
                      {guest.phone && <p className="text-foreground">{guest.phone}</p>}
                      {guest.email && <p className="text-muted-foreground truncate max-w-[160px]">{guest.email}</p>}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {guest.groupName ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium">
                        <span className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: guest.groupColor || "#6366f1" }} />
                        {guest.groupName}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center text-xs font-medium">{guest.paxCount}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {formatDate(guest.checkInDate)}
                  </td>
                  <td className="px-3 py-3">
                    {guest.assigned ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[140px]">{guest.assignedTo}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">Not assigned</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {guest.docCount > 0 ? (
                      <span className={cn(
                        "text-xs font-medium",
                        guest.docPending > 0 ? "text-amber-600" : "text-emerald-600"
                      )}>
                        {guest.docCount - guest.docPending}/{guest.docCount}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                        onClick={() => setGuestDialog({ open: true, guest })}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(guest.id, `${guest.firstName} ${guest.lastName || ""}`)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Guest dialog */}
      <Dialog open={guestDialog.open} onOpenChange={(o: boolean) => setGuestDialog({ open: o })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{guestDialog.guest ? "Edit guest" : "Add guest"}</DialogTitle>
          </DialogHeader>
          <form key={guestDialog.guest?.id ?? "new-guest"} onSubmit={handleGuestSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input name="title" defaultValue={guestDialog.guest?.title || ""} placeholder="Mr/Mrs" className="h-9" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>First name *</Label>
                <Input name="firstName" defaultValue={guestDialog.guest?.firstName} required className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input name="lastName" defaultValue={guestDialog.guest?.lastName || ""} className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input name="phone" defaultValue={guestDialog.guest?.phone || ""} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label>Pax count</Label>
                <Input name="paxCount" type="number" min="1" defaultValue={guestDialog.guest?.paxCount || 1} className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input name="email" type="email" defaultValue={guestDialog.guest?.email || ""} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label>Group</Label>
              <select name="groupId" defaultValue={guestDialog.guest?.groupId || ""}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">No group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Check-in</Label>
                <Input name="checkInDate" type="date"
                  defaultValue={guestDialog.guest?.checkInDate?.split("T")[0] || event.checkInDate.split("T")[0]}
                  className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label>Check-out</Label>
                <Input name="checkOutDate" type="date"
                  defaultValue={guestDialog.guest?.checkOutDate?.split("T")[0] || event.checkOutDate.split("T")[0]}
                  className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input name="notes" defaultValue={guestDialog.guest?.notes || ""} placeholder="Any special requirements…" className="h-9" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setGuestDialog({ open: false })}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                {guestDialog.guest ? "Update" : "Add guest"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Group dialog */}
      <Dialog open={groupDialog} onOpenChange={setGroupDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Create group</DialogTitle></DialogHeader>
          <form onSubmit={handleGroupSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Group name *</Label>
              <Input name="name" required placeholder="Bride's Side" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {GROUP_COLORS.map((color) => (
                  <label key={color} className="cursor-pointer">
                    <input type="radio" name="color" value={color} className="sr-only" />
                    <span className="block w-6 h-6 rounded-full border-2 border-transparent hover:border-foreground/30 transition-colors"
                      style={{ backgroundColor: color }} />
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setGroupDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Create group
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import dialog */}
      <ImportDialog
        open={importDialog}
        onClose={() => setImportDialog(false)}
        eventId={eventId}
      />
    </div>
  );
}

function EmptyGuests({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-4">
        <Users className="w-5 h-5 text-primary" />
      </div>
      <h3 className="text-sm font-semibold">No guests yet</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
        Add guests manually or import from a CSV file
      </p>
      <Button size="sm" className="mt-4" onClick={onAdd}>
        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
        Add first guest
      </Button>
    </div>
  );
}

function ImportDialog({ open, onClose, eventId }: { open: boolean; onClose: () => void; eventId: string }) {
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<Array<Record<string, string>>>([]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(",").map((v) => v.trim().replace(/"/g, ""));
        return Object.fromEntries(headers.map((h, i) => [h, vals[i] || ""]));
      });
      setPreview(rows.slice(0, 5));
    };
    reader.readAsText(file);
  }

  function handleImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file") as File;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, "").toLowerCase());
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(",").map((v) => v.trim().replace(/"/g, ""));
        return Object.fromEntries(headers.map((h, i) => [h, vals[i] || ""]));
      });

      const guests = rows.filter((r) => r.firstname || r["first name"]).map((r) => ({
        firstName: r.firstname || r["first name"] || "",
        lastName: r.lastname || r["last name"] || "",
        phone: r.phone || r.mobile || "",
        email: r.email || "",
        paxCount: parseInt(r.pax || r.paxcount || "1") || 1,
        groupName: r.group || r["group name"] || "",
      }));

      startTransition(async () => {
        await importGuests(eventId, guests);
        toast.success(`${guests.length} guests imported`);
        onClose();
        window.location.reload();
      });
    };
    reader.readAsText(file);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Import guests from CSV</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/40 border border-border p-4 text-xs space-y-1.5">
            <p className="font-medium text-foreground">Expected columns:</p>
            <p className="text-muted-foreground">
              <span className="font-mono bg-background px-1 rounded">firstname</span>,{" "}
              <span className="font-mono bg-background px-1 rounded">lastname</span>,{" "}
              <span className="font-mono bg-background px-1 rounded">phone</span>,{" "}
              <span className="font-mono bg-background px-1 rounded">email</span>,{" "}
              <span className="font-mono bg-background px-1 rounded">pax</span>,{" "}
              <span className="font-mono bg-background px-1 rounded">group</span>
            </p>
          </div>
          <form onSubmit={handleImport} className="space-y-4">
            <Input type="file" name="file" accept=".csv" required onChange={handleFile} />
            {preview.length > 0 && (
              <div className="rounded-lg border border-border overflow-hidden text-xs">
                <div className="px-3 py-2 bg-muted/40 font-medium border-b border-border">
                  Preview ({preview.length} rows)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {Object.keys(preview[0]).slice(0, 5).map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          {Object.values(row).slice(0, 5).map((v, j) => (
                            <td key={j} className="px-3 py-2 text-foreground">{v as string}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Import guests
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
