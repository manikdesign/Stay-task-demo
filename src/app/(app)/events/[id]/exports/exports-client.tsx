"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download, FileSpreadsheet, FileText, User, Building2,
  CheckCircle2, Clock, AlertCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface ExportData {
  event: { name: string; venue: string | null; checkInDate: string; checkOutDate: string };
  guestList: Array<{
    name: string; title: string | null; phone: string | null; email: string | null;
    paxCount: number; group: string; checkInDate: string; checkOutDate: string;
    hotel: string; roomType: string; roomNumber: string; billingInstructions: string;
    docStatus: string; assigned: boolean;
  }>;
  hotelList: Array<{
    hotel: string; roomType: string; roomNumber: string; guestName: string;
    paxCount: number; group: string; checkIn: string; checkOut: string;
    billingInstructions: string;
  }>;
}

interface Props { eventId: string; eventName: string; data: ExportData }

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportsClient({ eventId, eventName, data }: Props) {
  const [generating, setGenerating] = useState<string | null>(null);

  function exportGuestList() {
    setGenerating("guest");
    const headers = ["#", "Name", "Phone", "Email", "Pax", "Group", "Check-in", "Check-out", "Hotel", "Room Type", "Room No.", "Billing", "Doc Status"];
    const rows = data.guestList.map((g, i) => [
      String(i + 1), g.name, g.phone || "", g.email || "",
      String(g.paxCount), g.group,
      formatDate(g.checkInDate), formatDate(g.checkOutDate),
      g.hotel, g.roomType, g.roomNumber, g.billingInstructions, g.docStatus,
    ]);
    downloadCSV(`${eventName}-guest-list.csv`, rows, headers);
    toast.success("Guest list exported");
    setGenerating(null);
  }

  function exportHotelHandover() {
    setGenerating("hotel");
    const headers = ["Hotel", "Room Type", "Room No.", "Guest Name", "Pax", "Group", "Check-in", "Check-out", "Billing"];
    const rows = data.hotelList.map((r) => [
      r.hotel, r.roomType, r.roomNumber, r.guestName,
      String(r.paxCount), r.group,
      formatDate(r.checkIn), formatDate(r.checkOut),
      r.billingInstructions,
    ]);
    downloadCSV(`${eventName}-hotel-handover.csv`, rows, headers);
    toast.success("Hotel handover exported");
    setGenerating(null);
  }

  function exportBillingSummary() {
    setGenerating("billing");
    const headers = ["Guest Name", "Group", "Hotel", "Room Type", "Room No.", "Check-in", "Check-out", "Pax", "Billing Instructions"];
    const rows = data.guestList
      .filter((g) => g.assigned)
      .map((g) => [
        g.name, g.group, g.hotel, g.roomType, g.roomNumber,
        formatDate(g.checkInDate), formatDate(g.checkOutDate),
        String(g.paxCount), g.billingInstructions,
      ]);
    downloadCSV(`${eventName}-billing-summary.csv`, rows, headers);
    toast.success("Billing summary exported");
    setGenerating(null);
  }

  const stats = {
    total: data.guestList.length,
    assigned: data.guestList.filter((g) => g.assigned).length,
    hotels: new Set(data.hotelList.map((r) => r.hotel)).size,
  };

  const EXPORTS = [
    {
      id: "guest",
      icon: User,
      title: "Guest list",
      description: "Complete guest roster with contact info, group assignments, room details, and document status.",
      audience: "For your reference & client reports",
      rows: data.guestList.length,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      iconColor: "text-blue-600 bg-blue-50",
      onExport: exportGuestList,
    },
    {
      id: "hotel",
      icon: Building2,
      title: "Hotel handover",
      description: "Room-by-room guest list sorted by hotel, room type, and room number. Ready to hand to the hotel.",
      audience: "For the hotel check-in desk",
      rows: data.hotelList.length,
      color: "bg-violet-50 text-violet-700 border-violet-200",
      iconColor: "text-violet-600 bg-violet-50",
      onExport: exportHotelHandover,
    },
    {
      id: "billing",
      icon: FileSpreadsheet,
      title: "Billing summary",
      description: "Assigned guests with billing instructions per room. Use for invoicing or reconciliation.",
      audience: "For finance & billing reconciliation",
      rows: data.guestList.filter((g) => g.assigned).length,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      iconColor: "text-emerald-600 bg-emerald-50",
      onExport: exportBillingSummary,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Summary */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold mb-4">Export summary</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/40 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total guests</p>
          </div>
          <div className="text-center p-3 bg-muted/40 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600">{stats.assigned}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Assigned</p>
          </div>
          <div className="text-center p-3 bg-muted/40 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{stats.hotels}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Hotel{stats.hotels !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Event: {data.event.name}
          {data.event.venue && <span>· {data.event.venue}</span>}
          <span>·</span>
          {formatDate(data.event.checkInDate)} → {formatDate(data.event.checkOutDate)}
        </div>
      </div>

      {/* Export cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {EXPORTS.map((exp) => (
          <div key={exp.id} className="bg-card rounded-xl border border-border p-5 space-y-4 flex flex-col">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${exp.iconColor}`}>
              <exp.icon className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-semibold">{exp.title}</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {exp.description}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-2 italic">{exp.audience}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">{exp.rows} rows · CSV</span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                disabled={generating === exp.id || exp.rows === 0}
                onClick={exp.onExport}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                {generating === exp.id ? "Generating…" : "Export"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Guest confirmation section */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">Guest confirmations</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Individual confirmation slips for guests — include hotel, room type, and stay dates.
              Print or share via WhatsApp.
            </p>
          </div>
          <Button
            size="sm" variant="outline"
            onClick={() => {
              const assigned = data.guestList.filter((g) => g.assigned);
              if (assigned.length === 0) { toast.error("No guests assigned yet"); return; }
              const text = assigned.map((g) =>
                `*Stay Confirmation — ${data.event.name}*\n` +
                `Guest: ${g.name}\n` +
                `Hotel: ${g.hotel}\n` +
                `Room: ${g.roomType}${g.roomNumber ? ` (#${g.roomNumber})` : ""}\n` +
                `Check-in: ${formatDate(g.checkInDate)}\n` +
                `Check-out: ${formatDate(g.checkOutDate)}\n` +
                `Pax: ${g.paxCount}`
              ).join("\n\n---\n\n");
              const blob = new Blob([text], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${eventName}-confirmations.txt`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success("Confirmations exported");
            }}
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Export confirmations
          </Button>
        </div>
      </div>
    </div>
  );
}
