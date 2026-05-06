"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createHotel,
  updateHotel,
  deleteHotel,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  upsertRoomBlock,
} from "@/lib/actions/hotels";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  BedDouble,
  Users,
  Loader2,
  ChevronDown,
  ChevronRight,
  Phone,
  MapPin,
} from "lucide-react";
import { cn, formatDate, nightsBetween } from "@/lib/utils";
import { eachDayOfInterval, format } from "date-fns";
import { toast } from "sonner";

interface RoomBlock { date: string; quantity: number }
interface RoomType {
  id: string; name: string; category: string | null; bedType: string | null;
  occupancy: number; maxOccupancy: number; pricePerNight: number | null;
  assignedCount: number; blocks: RoomBlock[];
}
interface Hotel {
  id: string; name: string; address: string | null; phone: string | null;
  notes: string | null; roomTypes: RoomType[];
}
interface EventMeta { checkInDate: string; checkOutDate: string }

interface Props {
  eventId: string;
  event: EventMeta;
  hotels: Hotel[];
}

export function HotelsClient({ eventId, event, hotels: initialHotels }: Props) {
  const [hotels, setHotels] = useState(initialHotels);
  const [expandedHotels, setExpandedHotels] = useState<Set<string>>(
    new Set(initialHotels.map((h) => h.id))
  );
  const [hotelDialog, setHotelDialog] = useState<{ open: boolean; hotel?: Hotel }>({ open: false });
  const [roomDialog, setRoomDialog] = useState<{ open: boolean; hotelId?: string; room?: RoomType }>({ open: false });
  const [isPending, startTransition] = useTransition();

  const eventDates = eachDayOfInterval({
    start: new Date(event.checkInDate),
    end: new Date(new Date(event.checkOutDate).getTime() - 86400000),
  });

  const toggleHotel = (id: string) => {
    setExpandedHotels((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  function handleHotelSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      if (hotelDialog.hotel) {
        await updateHotel(eventId, hotelDialog.hotel.id, fd);
        toast.success("Hotel updated");
      } else {
        await createHotel(eventId, fd);
        toast.success("Hotel added");
      }
      setHotelDialog({ open: false });
      window.location.reload();
    });
  }

  function handleRoomSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      if (roomDialog.room) {
        await updateRoomType(eventId, roomDialog.room.id, fd);
        toast.success("Room type updated");
      } else {
        await createRoomType(eventId, roomDialog.hotelId!, fd);
        toast.success("Room type added");
      }
      setRoomDialog({ open: false });
      window.location.reload();
    });
  }

  function handleDeleteHotel(hotelId: string, name: string) {
    if (!confirm(`Delete hotel "${name}"? This will remove all room types.`)) return;
    startTransition(async () => {
      await deleteHotel(eventId, hotelId);
      toast.success("Hotel removed");
      window.location.reload();
    });
  }

  function handleDeleteRoom(roomId: string, name: string) {
    if (!confirm(`Delete room type "${name}"?`)) return;
    startTransition(async () => {
      await deleteRoomType(eventId, roomId);
      toast.success("Room type removed");
      window.location.reload();
    });
  }

  function handleBlockChange(roomTypeId: string, date: string, value: string) {
    const qty = parseInt(value) || 0;
    startTransition(async () => {
      await upsertRoomBlock(eventId, roomTypeId, date, qty);
    });
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Hotels & Room Blocks</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define your contracted hotels and room allocations per night
          </p>
        </div>
        <Button size="sm" onClick={() => setHotelDialog({ open: true })}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add hotel
        </Button>
      </div>

      {/* Empty state */}
      {hotels.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-xl border border-border border-dashed">
          <Building2 className="w-8 h-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">No hotels yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add the hotels where your guests will be staying
          </p>
          <Button size="sm" className="mt-4" onClick={() => setHotelDialog({ open: true })}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add first hotel
          </Button>
        </div>
      )}

      {/* Hotel cards */}
      {hotels.map((hotel) => {
        const expanded = expandedHotels.has(hotel.id);
        const totalRooms = hotel.roomTypes.reduce((sum, rt) => {
          const maxBlock = Math.max(0, ...rt.blocks.map((b) => b.quantity));
          return sum + maxBlock;
        }, 0);

        return (
          <div key={hotel.id} className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Hotel header */}
            <div
              className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => toggleHotel(hotel.id)}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{hotel.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {hotel.address && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />{hotel.address}
                    </span>
                  )}
                  {hotel.phone && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />{hotel.phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant="secondary" className="text-xs">
                  {hotel.roomTypes.length} type{hotel.roomTypes.length !== 1 ? "s" : ""}
                </Badge>
                <Button
                  variant="ghost" size="sm" className="h-7 w-7 p-0"
                  onClick={(e) => { e.stopPropagation(); setHotelDialog({ open: true, hotel }); }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); handleDeleteHotel(hotel.id, hotel.name); }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                {expanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Room types + block grid */}
            {expanded && (
              <div className="border-t border-border">
                {/* Room types table */}
                {hotel.roomTypes.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="text-left px-5 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Room type</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Category</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Bed</th>
                          <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">Occ.</th>
                          {eventDates.map((date) => (
                            <th key={date.toISOString()} className="text-center px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap min-w-[80px]">
                              {format(date, "d MMM")}
                            </th>
                          ))}
                          <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">Assigned</th>
                          <th className="px-3 py-2.5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {hotel.roomTypes.map((rt) => (
                          <tr key={rt.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-5 py-3 font-medium text-foreground whitespace-nowrap">{rt.name}</td>
                            <td className="px-3 py-3 text-muted-foreground">{rt.category || "—"}</td>
                            <td className="px-3 py-3 text-muted-foreground">{rt.bedType || "—"}</td>
                            <td className="px-3 py-3 text-center text-muted-foreground">{rt.occupancy}</td>
                            {eventDates.map((date) => {
                              const iso = date.toISOString();
                              const block = rt.blocks.find(
                                (b) => new Date(b.date).toDateString() === date.toDateString()
                              );
                              return (
                                <td key={iso} className="px-3 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    defaultValue={block?.quantity || 0}
                                    className="w-14 h-7 text-center text-xs rounded-md border border-input bg-background px-1 focus:outline-none focus:ring-1 focus:ring-ring"
                                    onBlur={(e) => handleBlockChange(rt.id, iso, e.target.value)}
                                  />
                                </td>
                              );
                            })}
                            <td className="px-3 py-3 text-center">
                              <span className={cn(
                                "font-medium",
                                rt.assignedCount > 0 ? "text-emerald-600" : "text-muted-foreground"
                              )}>
                                {rt.assignedCount}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost" size="sm" className="h-6 w-6 p-0"
                                  onClick={() => setRoomDialog({ open: true, hotelId: hotel.id, room: rt })}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteRoom(rt.id, rt.name)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add room type button */}
                <div className="px-5 py-3 border-t border-border/50">
                  <Button
                    variant="ghost" size="sm" className="text-xs h-7 text-primary hover:text-primary"
                    onClick={() => setRoomDialog({ open: true, hotelId: hotel.id })}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add room type
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Hotel dialog */}
      <Dialog open={hotelDialog.open} onOpenChange={(o) => setHotelDialog({ open: o })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{hotelDialog.hotel ? "Edit hotel" : "Add hotel"}</DialogTitle>
          </DialogHeader>
          <form key={hotelDialog.hotel?.id ?? "new-hotel"} onSubmit={handleHotelSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="hotel-name">Hotel name *</Label>
              <Input id="hotel-name" name="name" defaultValue={hotelDialog.hotel?.name} required className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hotel-address">Address</Label>
              <Input id="hotel-address" name="address" defaultValue={hotelDialog.hotel?.address || ""} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hotel-phone">Phone</Label>
              <Input id="hotel-phone" name="phone" defaultValue={hotelDialog.hotel?.phone || ""} className="h-9" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setHotelDialog({ open: false })}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                {hotelDialog.hotel ? "Update" : "Add hotel"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Room type dialog */}
      <Dialog open={roomDialog.open} onOpenChange={(o) => setRoomDialog({ open: o })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{roomDialog.room ? "Edit room type" : "Add room type"}</DialogTitle>
          </DialogHeader>
          <form key={roomDialog.room?.id ?? "new-room"} onSubmit={handleRoomSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="room-name">Room type name *</Label>
              <Input id="room-name" name="name" defaultValue={roomDialog.room?.name} placeholder="Deluxe King" required className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="room-category">Category</Label>
                <Input id="room-category" name="category" defaultValue={roomDialog.room?.category || ""} placeholder="Deluxe" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="room-bed">Bed type</Label>
                <Input id="room-bed" name="bedType" defaultValue={roomDialog.room?.bedType || ""} placeholder="King" className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="room-occ">Occupancy</Label>
                <Input id="room-occ" name="occupancy" type="number" min="1" defaultValue={roomDialog.room?.occupancy || 2} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="room-maxocc">Max occ.</Label>
                <Input id="room-maxocc" name="maxOccupancy" type="number" min="1" defaultValue={roomDialog.room?.maxOccupancy || 3} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="room-price">Price/night</Label>
                <Input id="room-price" name="pricePerNight" type="number" step="0.01" defaultValue={roomDialog.room?.pricePerNight || ""} placeholder="0" className="h-9" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setRoomDialog({ open: false })}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                {roomDialog.room ? "Update" : "Add room type"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
