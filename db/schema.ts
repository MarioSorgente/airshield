import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// AirShield waitlist signups - main beta application form
export const waitlistSignups = mysqlTable("waitlist_signups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 50 }),
  city: varchar("city", { length: 100 }).notNull(),
  ridingMinutesPerDay: int("riding_minutes_per_day").notNull(),
  mainUse: mysqlEnum("main_use", [
    "commuting",
    "grab_gojek_delivery",
    "bali_daily_riding",
    "sport_riding",
    "family_parent_use",
    "other",
  ]).notNull(),
  currentHelmetType: mysqlEnum("current_helmet_type", [
    "open_face",
    "full_face",
    "half_face",
    "none",
  ]),
  priceOpinion: mysqlEnum("price_opinion", ["yes", "maybe", "no"]),
  filterSubscription: mysqlEnum("filter_subscription", ["yes", "maybe", "no"]),
  objection: varchar("objection", { length: 255 }),
  variantPreference: varchar("variant_preference", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WaitlistSignup = typeof waitlistSignups.$inferSelect;
export type InsertWaitlistSignup = typeof waitlistSignups.$inferInsert;

// Exposure calculator results
export const exposureCalculations = mysqlTable("exposure_calculations", {
  id: serial("id").primaryKey(),
  city: varchar("city", { length: 100 }).notNull(),
  minutesPerDay: int("minutes_per_day").notNull(),
  daysPerWeek: int("days_per_week").notNull(),
  trafficLevel: mysqlEnum("traffic_level", ["light", "normal", "heavy"]).notNull(),
  helmetType: mysqlEnum("helmet_type", [
    "open_face",
    "full_face",
    "mask_under_helmet",
    "no_mask",
  ]).notNull(),
  email: varchar("email", { length: 320 }),
  weeklyHours: varchar("weekly_hours", { length: 20 }),
  yearlyHours: varchar("yearly_hours", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExposureCalculation = typeof exposureCalculations.$inferSelect;
export type InsertExposureCalculation = typeof exposureCalculations.$inferInsert;

// Price test responses
export const priceResponses = mysqlTable("price_responses", {
  id: serial("id").primaryKey(),
  priceOption: mysqlEnum("price_option", ["essential", "standard", "premium"]).notNull(),
  email: varchar("email", { length: 320 }),
  whatsapp: varchar("whatsapp", { length: 50 }),
  city: varchar("city", { length: 100 }),
  useCase: varchar("use_case", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PriceResponse = typeof priceResponses.$inferSelect;
export type InsertPriceResponse = typeof priceResponses.$inferInsert;

// Variant selections
export const variantSelections = mysqlTable("variant_selections", {
  id: serial("id").primaryKey(),
  variantName: varchar("variant_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VariantSelection = typeof variantSelections.$inferSelect;
export type InsertVariantSelection = typeof variantSelections.$inferInsert;

// Filter subscription intent
export const filterSubscriptions = mysqlTable("filter_subscriptions", {
  id: serial("id").primaryKey(),
  frequency: mysqlEnum("frequency", [
    "reminders_only",
    "every_4_weeks",
    "every_6_weeks",
    "every_8_weeks",
    "not_interested",
  ]).notNull(),
  email: varchar("email", { length: 320 }),
  priceAcceptance: mysqlEnum("price_acceptance", ["yes", "maybe", "no"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FilterSubscription = typeof filterSubscriptions.$inferSelect;
export type InsertFilterSubscription = typeof filterSubscriptions.$inferInsert;

// Use case selections
export const useCaseSelections = mysqlTable("use_case_selections", {
  id: serial("id").primaryKey(),
  useCaseName: varchar("use_case_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UseCaseSelection = typeof useCaseSelections.$inferSelect;
export type InsertUseCaseSelection = typeof useCaseSelections.$inferInsert;

// Objection selections
export const objectionSelections = mysqlTable("objection_selections", {
  id: serial("id").primaryKey(),
  objectionName: varchar("objection_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ObjectionSelection = typeof objectionSelections.$inferSelect;
export type InsertObjectionSelection = typeof objectionSelections.$inferInsert;

// Early access reservations
export const earlyAccessReservations = mysqlTable("early_access_reservations", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 100 }),
  email: varchar("email", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EarlyAccessReservation = typeof earlyAccessReservations.$inferSelect;
export type InsertEarlyAccessReservation = typeof earlyAccessReservations.$inferInsert;
