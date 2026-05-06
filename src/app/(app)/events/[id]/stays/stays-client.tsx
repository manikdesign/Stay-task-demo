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
import { assignRoom, removeAssignment } from "@/lib/actions/assignments";
import {
  BedDouble, Users, Search, X, CheckCircle2, AlertCircle,
  Building2, Loader2, ArrowRight, SlidersHorizontal,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Assignment {
  id: string; guestId: string; guestName: string;
  groupName?: string; groupColor?: string | null;
  roomNumber?: string | null; extraBeds: number; billingInstructions?: string | null;
}
interface RoomType {
  id: string; name: string; category: string | null; bedType: string | null;
  occupancy: number; maxOccupancy: number; totalBlock: number; assignedCount: number;
  assignments: Assignment[];
}
interface Hotel { id: string; name: string; roomTypes: RoomType[] }
interface Guest {
  id: string; title: string | null; firstName: string; lastName: string | null;
  paxCount: number; groupId: string | null; groupName?: string; groupColor?: string | null;
  checkInDate?: string; checkOutDate?: string;
  assigned: boolean; assignedHotel?: string; assignedRoom?: string; assignmentId?: string;
}
interface Group { id: string; name: string; color: string | null }

interface Props {
  eventId: string;
  event: { checkInDate: string; checkOutDate: string };
  hotels: Hotel[];
  guests: Guest[];
  groups: Group[];
}

type ViewMode = "guest" | "room";

export function StaysClient({ eventId, event, hotels, guests, groups }: Props) {
  const [view, setView] = useState<ViewMode>("guest");
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [filterAssigned, setFilterAssigned] = useState<"all" | "assigned" | "unassigned">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignDialog, setAssignDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const name = `${g.firstName} ${g.lastName || ""}`.toLowerCase();
      const matchSearch = !search || name.includes(search.toLowerCase());
      const matchGroup = !filterGroup || g.groupId === filterGroup;
      const matchAssigned =
        filterAssigned === "all" ||
        (filterAssigned === "assigned" && g.assigned) ||
        (filterAssigned === "unassigned" && !g.assigned);
      return matchSearch && matchGroup && matchAssigned;
    });
  }, [guests, search, filterGroup, filterAssigned]);

  const stats = {
    total: guests.length,
    assigned: guests.filter((g) => g.assigned).length,
    unassigned: guests.filter((g) => !g.assigned).length,
  };

  function toggleGuest(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleRemove(guestId: string, name: string) {
    if (!confirm(`Remove room assignment for "${name}"?`)) return;
    startTransition(async () => {
      await removeAssignment(eventId, guestId);
      toast.success("Assignment removed");
      window.location.reload();
    });
  }

  function handleAssignSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const roomTypeId = fd.get("roomTypeId") as string;
    const roomNumber = fd.get("roomNumber") as string;
    const billingInstructions = fd.get("billingInstructions") as string;
    const extraBeds = parseInt(fd.get("extraBeds") as string) || 0;

    if (!roomTypeId) { toast.error("Please select a room type"); return; }

    startTransition(async () => {
      await assignRoom(eventId, {
        guestIds: Array.from(selected),
        roomTypeId,
        roomNumber: roomNumber || undefined,
        billingInstructions: billingInstructions || undefined,
        extraBeds,
      });
      toast.success(`${selected.size} guest${selected.size > 1 ? "s" : ""} assigned`);
      setSelected(new Set());
      setAssignDialog(false);
      window.location.reload();
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.assigned}</p>
              <p className="text-xs text-muted-foreground">Assigned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.unassigned}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex-1 min-w-[120px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Assignment rate</span>
              <span className="text-xs font-semibold">
                {stats.total > 0 ? Math.round((stats.assigned / stats.total) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${stats.total > 0 ? (stats.assigned / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 ml-auto">
            <button
              onClick={() => setView("guest")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                view === "guest" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="w-3.5 h-3.5 inline mr-1" />
              Guest view
            </button>
            <button
              onClick={() => setView("room")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                view === "room" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BedDouble className="w-3.5 h-3.5 inline mr-1" />
              Room view
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-border bg-card/60 backdrop-blur-sm flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Group pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFilterGroup(null)}
            className={cn("px-2.5 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
              !filterGroup ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
            )}>All</button>
          {groups.map((g) => (
            <button key={g.id}
              onClick={() => setFilterGroup(filterGroup === g.id ? null : g.id)}
              className={cn("px-2.5 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap flex items-center gap-1",
                filterGroup === g.id ? "text-white border-transparent" : "border-border text-muted-foreground hover:text-foreground"
              )}
              style={filterGroup === g.id ? { backgroundColor: g.color || "#6366f1", borderColor: g.color || "#6366f1" } : {}}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: g.color || "#6366f1" }} />
              {g.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 ml-auto">
          {["all", "assigned", "unassigned"].map((f) => (
            <button key={f}
              onClick={() => setFilterAssigned(f as "all" | "assigned" | "unassigned")}
              className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize",
                filterAssigned === f ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              )}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Floating assign bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 bg-foreground text-background rounded-xl px-4 py-3 shadow-xl">
            <span className="text-sm font-medium">{selected.size} guest{selected.size > 1 ? "s" : ""} selected</span>
            <Button size="sm" className="h-7 bg-primary hover:bg-primary/90 text-white"
              onClick={() => setAssignDialog(true)}>
              Assign room
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
            <button onClick={() => setSelected(new Set())}
              className="text-background/60 hover:text-background transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {view === "guest" ? (
          <GuestView
            guests={filteredGuests}
            selected={selected}
            onToggle={toggleGuest}
            onRemove={handleRemove}
          />
        ) : (
          <RoomView hotels={hotels} eventId={eventId} onRemove={handleRemove} />
        )}
      </div>

      {/* Assign dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign room</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Assigning {selected.size} guest{selected.size > 1 ? "s" : ""}
            </p>
          </DialogHeader>
          <form onSubmit={handleAssignSubmit} className="space-y-5">
            {/* Selected guests preview */}
            <div className="flex flex-wrap gap-1.5">
              {Array.from(selected).slice(0, 8).map((gid) => {
                const g = guests.find((g) => g.id === gid);
                if (!g) return null;
                return (
                  <span key={gid} className="text-xs px-2 py-1 bg-muted rounded-full font-medium">
                    {g.firstName} {g.lastName || ""}
                  </span>
                );
              })}
              {selected.size > 8 && (
                <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                  +{selected.size - 8} more
                </span>
              )}
            </div>

            {/* Hotel + room type selection */}
            <div className="space-y-3">
              {hotels.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hotels added yet. Go to the <strong>Hotels</strong> tab to add hotels and room types.
                </p>
              ) : (
                hotels.map((hotel) => (
                  <div key={hotel.id}>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {hotel.name}
                    </p>
                    {hotel.roomTypes.length === 0 ? (
                      <p className="text-xs text-muted-foreground pl-5 italic">
                        No room types — add them in the Hotels tab.
                      </p>
                    ) : (
                      <div className="space-y-2 pl-5">
                        {hotel.roomTypes.map((rt) => {
                          const available = rt.totalBlock - rt.assignedCount;
                          return (
                            <label key={rt.id} className="flex items-center gap-3 cursor-pointer group">
                              <input type="radio" name="roomTypeId" value={rt.id} className="w-3.5 h-3.5 accent-primary" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{rt.name}</span>
                                  {rt.category && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{rt.category}</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {rt.bedType && `${rt.bedType} · `}{rt.occupancy} pax
                                  <span className={cn("ml-2 font-medium", available > 0 ? "text-emerald-600" : "text-destructive")}>
                                    {available} available
                                  </span>
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="h-px bg-border" />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="roomNumber">Room number</Label>
                <Input id="roomNumber" name="roomNumber" placeholder="101" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="extraBeds">Extra beds</Label>
                <Input id="extraBeds" name="extraBeds" type="number" min="0" defaultValue="0" className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="billingInstructions">Billing instructions</Label>
              <Input id="billingInstructions" name="billingInstructions" placeholder="e.g. Bill to client account" className="h-9" />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAssignDialog(false)}>Cancel</Button>
              <Button
                type="submit"
                disabled={isPending || hotels.every((h) => h.roomTypes.length === 0)}
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Assign {selected.size > 1 ? `${selected.size} guests` : "guest"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GuestView({
  guests, selected, onToggle, onRemove,
}: {
  guests: Guest[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onRemove: (guestId: string, name: string) => void;
}) {
  if (guests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BedDouble className="w-8 h-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium">No guests match your filters</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {guests.map((guest) => (
        <div
          key={guest.id}
          className={cn(
            "flex items-center gap-4 px-6 py-3.5 hover:bg-muted/30 transition-colors",
            selected.has(guest.id) && "bg-primary/4"
          )}
        >
          <Checkbox
            checked={selected.has(guest.id)}
            onCheckedChange={() => onToggle(guest.id)}
          />

          {/* Name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {guest.title ? `${guest.title} ` : ""}{guest.firstName}
                {guest.lastName ? ` ${guest.lastName}` : ""}
              </span>
              {guest.paxCount > 1 && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Users className="w-3 h-3" />{guest.paxCount}
                </span>
              )}
            </div>
            {guest.groupName && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: guest.groupColor || "#6366f1" }} />
                {guest.groupName}
              </span>
            )}
          </div>

          {/* Dates */}
          <div className="hidden md:block text-xs text-muted-foreground">
            {formatDate(guest.checkInDate)} – {formatDate(guest.checkOutDate)}
          </div>

          {/* Assignment status */}
          <div className="shrink-0">
            {guest.assigned ? (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {guest.assignedRoom}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{guest.assignedHotel}</p>
                </div>
                <Button
                  variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(guest.id, `${guest.firstName} ${guest.lastName || ""}`)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-600">
                <AlertCircle className="w-3.5 h-3.5" />
                Not assigned
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RoomView({
  hotels, eventId, onRemove,
}: {
  hotels: Hotel[];
  eventId: string;
  onRemove: (guestId: string, name: string) => void;
}) {
  return (
    <div className="p-6 space-y-6">
      {hotels.map((hotel) => (
        <div key={hotel.id} className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">{hotel.name}</h3>
            <Badge variant="secondary" className="ml-auto text-xs">
              {hotel.roomTypes.reduce((s, rt) => s + rt.assignedCount, 0)} assigned
            </Badge>
          </div>
          <div className="divide-y divide-border">
            {hotel.roomTypes.map((rt) => (
              <div key={rt.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-medium">{rt.name}</span>
                    {rt.category && <span className="text-xs text-muted-foreground ml-2">{rt.category}</span>}
                    {rt.bedType && <span className="text-xs text-muted-foreground ml-2">· {rt.bedType}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className={cn("font-medium", rt.assignedCount <= rt.totalBlock ? "text-emerald-600" : "text-destructive")}>
                      {rt.assignedCount}
                    </span>
                    /{rt.totalBlock} rooms
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-1 mb-3">
                  <div
                    className={cn("h-1 rounded-full", rt.assignedCount > rt.totalBlock ? "bg-destructive" : "bg-emerald-500")}
                    style={{ width: `${rt.totalBlock > 0 ? Math.min((rt.assignedCount / rt.totalBlock) * 100, 100) : 0}%` }}
                  />
                </div>

                {/* Assignments */}
                {rt.assignments.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {rt.assignments.map((a) => (
                      <div key={a.id} className="group flex items-center gap-2 px-2.5 py-1.5 bg-muted/60 rounded-lg text-xs">
                        {a.groupColor && (
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: a.groupColor }} />
                        )}
                        <span className="font-medium">{a.guestName}</span>
                        {a.roomNumber && <span className="text-muted-foreground">#{a.roomNumber}</span>}
                        <button
                          onClick={() => onRemove(a.guestId, a.guestName)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/50 italic">No guests assigned</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
