import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { db } from "@/db";
import { dates, signups } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const ok = await isAdminAuthenticated();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allDates = await db.select().from(dates).orderBy(asc(dates.date));
  const allSignups = await db.select().from(signups).orderBy(asc(signups.dateId), asc(signups.status), asc(signups.position));

  const dateMap = new Map(allDates.map((d) => [d.id, d]));

  const rows = allSignups.map((s) => {
    const d = dateMap.get(s.dateId);
    return [
      d?.date ?? "",
      d?.label ?? "",
      s.name,
      s.partySize,
      s.status,
      s.position,
      s.email ?? "",
      s.createdAt.toISOString(),
    ];
  });

  const header = ["Date", "Label", "Name", "Party Size", "Status", "Position", "Email", "Signed Up At"];
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="signups-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
