import { pgTable, uuid, date, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const dates = pgTable("dates", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: date("date").unique().notNull(),
  capacity: integer("capacity").notNull(),
  label: text("label"),
  isVisible: boolean("is_visible").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const signups = pgTable("signups", {
  id: uuid("id").defaultRandom().primaryKey(),
  dateId: uuid("date_id")
    .references(() => dates.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  partySize: integer("party_size").notNull().default(1),
  email: text("email"),
  status: text("status").notNull(), // 'confirmed' | 'waitlisted'
  position: integer("position").notNull(), // order within status group for this date
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type DateRow = typeof dates.$inferSelect;
export type NewDate = typeof dates.$inferInsert;
export type SignupRow = typeof signups.$inferSelect;
export type NewSignup = typeof signups.$inferInsert;
