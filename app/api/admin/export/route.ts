import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { db } from "@/db";
import { reservations, confirmedDays } from "@/db/schema";
import { asc, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const ok = await isAdminAuthenticated();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allReservations = await db.select().from(reservations).orderBy(asc(reservations.startDate));
  const resIds = allReservations.map((r) => r.id);
  const allConfirmed = resIds.length
    ? await db.select().from(confirmedDays).where(inArray(confirmedDays.reservationId, resIds))
    : [];

  const confirmedByRes = new Map<string, string[]>();
  for (const cd of allConfirmed) {
    if (!confirmedByRes.has(cd.reservationId)) confirmedByRes.set(cd.reservationId, []);
    confirmedByRes.get(cd.reservationId)!.push(cd.date);
  }

  const rows = allReservations.map((r) => {
    const confirmed = confirmedByRes.get(r.id) ?? [];
    const totalNights = Math.round(
      (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / 86_400_000
    );
    const status =
      confirmed.length === 0 ? "pending" : confirmed.length === totalNights ? "confirmed" : "partial";
    return [
      r.name,
      r.email ?? "",
      r.partySize,
      r.startDate,
      r.endDate,
      totalNights,
      status,
      confirmed.sort().join("; "),
      r.createdAt.toISOString(),
    ];
  });

  const header = ["Name", "Email", "Party Size", "Check-In", "Checkout", "Nights", "Status", "Confirmed Nights", "Requested At"];
  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="reservations-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
