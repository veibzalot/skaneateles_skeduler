export interface ReservationName {
  name: string;
  partySize: number;
  status: "confirmed" | "pending";
}

export interface DayData {
  dateStr: string; // YYYY-MM-DD
  effectiveCapacity: number;
  confirmedCount: number;
  names: ReservationName[];
  isPast: boolean;
}

export interface MonthData {
  key: string; // "2026-03"
  label: string; // "March 2026"
  days: (DayData | null)[]; // null = padding cell
}
