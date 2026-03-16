"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DateRow } from "@/db/schema";
import { updateDate, toggleDateVisibility, deleteDate } from "@/app/admin/dashboard/actions";

interface Props {
  dates: (DateRow & { confirmedCount: number; waitlistCount: number })[];
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function DateRow({ date }: { date: Props["dates"][number] }) {
  const [editing, setEditing] = useState(false);
  const [capacity, setCapacity] = useState(date.capacity);
  const [label, setLabel] = useState(date.label ?? "");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    await updateDate(date.id, capacity, label);
    setLoading(false);
    setEditing(false);
  }

  async function toggleVisibility() {
    setLoading(true);
    await toggleDateVisibility(date.id, !date.isVisible);
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete ${formatDate(date.date)}? All signups will be removed.`)) return;
    setLoading(true);
    await deleteDate(date.id);
  }

  return (
    <TableRow className={!date.isVisible ? "opacity-50" : ""}>
      <TableCell className="font-medium">{formatDate(date.date)}</TableCell>
      <TableCell>
        {editing ? (
          <Input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="h-7 w-40 text-sm"
            placeholder="Label"
          />
        ) : (
          <span className="text-stone-500 text-sm">{date.label || "—"}</span>
        )}
      </TableCell>
      <TableCell>
        {editing ? (
          <Input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1))}
            className="h-7 w-20 text-sm"
          />
        ) : (
          date.capacity
        )}
      </TableCell>
      <TableCell>
        <span className="text-green-700 font-medium">{date.confirmedCount}</span>
        {date.waitlistCount > 0 && (
          <span className="text-amber-600 text-sm ml-2">(+{date.waitlistCount} waitlist)</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={date.isVisible ? "text-green-700 border-green-300" : "text-stone-400"}>
          {date.isVisible ? "Visible" : "Hidden"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={save} disabled={loading} className="bg-lake hover:bg-lake-dark h-7 text-xs">
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setEditing(false); setCapacity(date.capacity); setLabel(date.label ?? ""); }} className="h-7 text-xs">
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="h-7 text-xs">
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={toggleVisibility} disabled={loading} className="h-7 text-xs">
                {date.isVisible ? "Hide" : "Show"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleDelete} disabled={loading} className="h-7 text-xs text-red-600 hover:text-red-700 border-red-200">
                Delete
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function DateManager({ dates }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Label</TableHead>
          <TableHead>Capacity</TableHead>
          <TableHead>Signups</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dates.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-stone-400 py-6">
              No dates yet.
            </TableCell>
          </TableRow>
        )}
        {dates.map((d) => (
          <DateRow key={d.id} date={d} />
        ))}
      </TableBody>
    </Table>
  );
}
