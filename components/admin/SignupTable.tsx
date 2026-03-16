"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRow, SignupRow } from "@/db/schema";
import { removeSignup } from "@/app/admin/dashboard/actions";

interface Props {
  dates: DateRow[];
  signups: SignupRow[];
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function SignupTable({ dates, signups }: Props) {
  const [removing, setRemoving] = useState<string | null>(null);
  const dateMap = new Map(dates.map((d) => [d.id, d]));

  async function handleRemove(signupId: string, name: string) {
    if (!confirm(`Remove ${name}? If they were confirmed, the next waitlisted person will be promoted.`)) return;
    setRemoving(signupId);
    await removeSignup(signupId);
    setRemoving(null);
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Party</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Signed Up</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {signups.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-stone-400 py-6">
              No signups yet.
            </TableCell>
          </TableRow>
        )}
        {signups.map((s) => {
          const d = dateMap.get(s.dateId);
          return (
            <TableRow key={s.id}>
              <TableCell className="text-sm">{d ? formatDate(d.date) : "—"}</TableCell>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell>{s.partySize}</TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={
                    s.status === "confirmed"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-amber-100 text-amber-700 border-amber-200"
                  }
                >
                  {s.status === "confirmed" ? "Confirmed" : `Waitlist #${s.position}`}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-stone-500">{s.email || "—"}</TableCell>
              <TableCell className="text-sm text-stone-500">
                {s.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-red-600 hover:text-red-700 border-red-200"
                  disabled={removing === s.id}
                  onClick={() => handleRemove(s.id, s.name)}
                >
                  {removing === s.id ? "Removing…" : "Remove"}
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
