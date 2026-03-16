"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDate } from "@/app/admin/dashboard/actions";

export default function AddDateForm() {
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState(10);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await createDate(date, capacity, label);
    setLoading(false);
    if (result.success) {
      setDate("");
      setCapacity(10);
      setLabel("");
    } else {
      setError(result.error ?? "Unknown error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600">Date *</label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600">Capacity *</label>
        <Input
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1))}
          required
          className="w-24"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-stone-600">Label <span className="text-stone-400">(optional)</span></label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. July 4th Weekend"
          className="w-52"
        />
      </div>
      <div className="flex flex-col gap-1">
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="bg-lake hover:bg-lake-dark">
          {loading ? "Adding…" : "Add Date"}
        </Button>
      </div>
    </form>
  );
}
