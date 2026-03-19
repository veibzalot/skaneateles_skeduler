import { pgTable, uuid, date, integer, text, timestamp, unique } from "drizzle-orm/pg-core";

export const capacityOverrides = pgTable("capacity_overrides", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: date("date").unique().notNull(),
  capacity: integer("capacity").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reservations = pgTable("reservations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  partySize: integer("party_size").notNull().default(1),
  startDate: date("start_date").notNull(), // inclusive check-in
  endDate: date("end_date").notNull(),     // exclusive checkout
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const confirmedDays = pgTable("confirmed_days", {
  id: uuid("id").defaultRandom().primaryKey(),
  reservationId: uuid("reservation_id")
    .references(() => reservations.id, { onDelete: "cascade" })
    .notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [unique().on(t.reservationId, t.date)]);

export type CapacityOverride = typeof capacityOverrides.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type ConfirmedDay = typeof confirmedDays.$inferSelect;
