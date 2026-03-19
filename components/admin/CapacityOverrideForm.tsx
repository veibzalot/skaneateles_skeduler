"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setCapacityOverride } from "@/app/admin/dashboard/actions";
import { DEFAULT_CAPACITY } from "@/lib/constants";
import type { CapacityOverride } from "@/db/schema";

interface Props {
  overrides: CapacityOverride[];
}

export default function CapacityOverrideForm({ overrides }: Props) {
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState<number | "">(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || capacity === "") return;
    setSaving(true);
    setError("");
    setSuccess(false);
    const result = await setCapacityOverride(date, Number(capacity));
    if (result.success) {
      setSuccess(true);
      setDate("");
      setCapacity(0);
    } else {
      setError(result.error ?? "Failed.");
    }
    setSaving(false);
  }

  async function handleRemove(overrideDate: string) {
    await setCapacityOverride(overrideDate, null);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end mb-4">
        <div>
          <label className="text-xs font-medium text-stone-600 block mb-1">Date</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600 block mb-1">
            Capacity <span className="text-stone-400">(default: {DEFAULT_CAPACITY})</span>
          </label>
          <Input
            type="number"
            min={0}
            max={100}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-24"
            required
          />
        </div>
        <Button type="submit" disabled={saving} className="bg-sky-600 hover:bg-sky-700 text-white">
          {saving ? "Saving…" : "Set Override"}
        </Button>
        {success && <span className="text-green-600 text-sm">Saved.</span>}
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </form>

      {overrides.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Active overrides</p>
          {[...overrides].sort((a, b) => a.date.localeCompare(b.date)).map((o) => (
            <div key={o.id} className="flex items-center gap-3 text-sm">
              <span className="font-medium text-stone-700 w-28">{o.date}</span>
              <span className="text-stone-500">
                capacity: <strong>{o.capacity}</strong>
                {o.capacity === 0 && <span className="text-red-500 ml-1">(closed)</span>}
              </span>
              <button
                onClick={() => handleRemove(o.date)}
                className="text-xs text-stone-400 hover:text-red-500 ml-auto"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
