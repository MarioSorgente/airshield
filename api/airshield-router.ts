import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  waitlistSignups,
  exposureCalculations,
  priceResponses,
  variantSelections,
  filterSubscriptions,
  useCaseSelections,
  objectionSelections,
  earlyAccessReservations,
} from "@db/schema";

export const airshieldRouter = createRouter({
  // Waitlist signup (main beta form)
  submitWaitlist: publicQuery
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Valid email is required"),
        whatsapp: z.string().optional(),
        city: z.string().min(1, "City is required"),
        ridingMinutesPerDay: z.number().min(1).max(600),
        mainUse: z.enum([
          "commuting",
          "grab_gojek_delivery",
          "bali_daily_riding",
          "sport_riding",
          "family_parent_use",
          "other",
        ]),
        currentHelmetType: z.enum(["open_face", "full_face", "half_face", "none"]).optional(),
        priceOpinion: z.enum(["yes", "maybe", "no"]).optional(),
        filterSubscription: z.enum(["yes", "maybe", "no"]).optional(),
        objection: z.string().optional(),
        variantPreference: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(waitlistSignups).values({
        name: input.name,
        email: input.email,
        whatsapp: input.whatsapp || null,
        city: input.city,
        ridingMinutesPerDay: input.ridingMinutesPerDay,
        mainUse: input.mainUse,
        currentHelmetType: input.currentHelmetType || null,
        priceOpinion: input.priceOpinion || null,
        filterSubscription: input.filterSubscription || null,
        objection: input.objection || null,
        variantPreference: input.variantPreference || null,
      });
      return { success: true, id: Number(result[0].insertId) };
    }),

  // Submit exposure calculation
  submitExposureCalc: publicQuery
    .input(
      z.object({
        city: z.string().min(1),
        minutesPerDay: z.number().min(1).max(600),
        daysPerWeek: z.number().min(1).max(7),
        trafficLevel: z.enum(["light", "normal", "heavy"]),
        helmetType: z.enum(["open_face", "full_face", "mask_under_helmet", "no_mask"]),
        email: z.string().email().optional(),
        weeklyHours: z.string().optional(),
        yearlyHours: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(exposureCalculations).values({
        city: input.city,
        minutesPerDay: input.minutesPerDay,
        daysPerWeek: input.daysPerWeek,
        trafficLevel: input.trafficLevel,
        helmetType: input.helmetType,
        email: input.email || null,
        weeklyHours: input.weeklyHours || null,
        yearlyHours: input.yearlyHours || null,
      });
      return { success: true, id: Number(result[0].insertId) };
    }),

  // Submit price response
  submitPriceResponse: publicQuery
    .input(
      z.object({
        priceOption: z.enum(["essential", "standard", "premium"]),
        email: z.string().email().optional(),
        whatsapp: z.string().optional(),
        city: z.string().optional(),
        useCase: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(priceResponses).values({
        priceOption: input.priceOption,
        email: input.email || null,
        whatsapp: input.whatsapp || null,
        city: input.city || null,
        useCase: input.useCase || null,
      });
      return { success: true, id: Number(result[0].insertId) };
    }),

  // Submit variant selection
  submitVariantSelection: publicQuery
    .input(
      z.object({
        variantName: z.string().min(1),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(variantSelections).values({
        variantName: input.variantName,
        email: input.email || null,
      });
      return { success: true, id: Number(result[0].insertId) };
    }),

  // Submit filter subscription intent
  submitFilterSubscription: publicQuery
    .input(
      z.object({
        frequency: z.enum([
          "reminders_only",
          "every_4_weeks",
          "every_6_weeks",
          "every_8_weeks",
          "not_interested",
        ]),
        email: z.string().email().optional(),
        priceAcceptance: z.enum(["yes", "maybe", "no"]).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(filterSubscriptions).values({
        frequency: input.frequency,
        email: input.email || null,
        priceAcceptance: input.priceAcceptance || null,
      });
      return { success: true, id: Number(result[0].insertId) };
    }),

  // Submit use case selection
  submitUseCase: publicQuery
    .input(
      z.object({
        useCaseName: z.string().min(1),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(useCaseSelections).values({
        useCaseName: input.useCaseName,
        email: input.email || null,
      });
      return { success: true, id: Number(result[0].insertId) };
    }),

  // Submit objection
  submitObjection: publicQuery
    .input(
      z.object({
        objectionName: z.string().min(1),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(objectionSelections).values({
        objectionName: input.objectionName,
        email: input.email || null,
      });
      return { success: true, id: Number(result[0].insertId) };
    }),

  // Reserve early access
  reserveEarlyAccess: publicQuery
    .input(
      z.object({
        source: z.string().optional(),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(earlyAccessReservations).values({
        source: input.source || null,
        email: input.email || null,
      });
      return { success: true, id: Number(result[0].insertId) };
    }),

  // Get aggregate stats for dashboard
  getStats: publicQuery.query(async () => {
    const db = getDb();
    const waitlistCount = await db.select().from(waitlistSignups);
    const exposureCount = await db.select().from(exposureCalculations);
    const priceCount = await db.select().from(priceResponses);
    const variantCount = await db.select().from(variantSelections);
    const filterCount = await db.select().from(filterSubscriptions);
    const useCaseCount = await db.select().from(useCaseSelections);
    const objectionCount = await db.select().from(objectionSelections);
    const reservationCount = await db.select().from(earlyAccessReservations);

    return {
      totalSignups: waitlistCount.length,
      totalCalculations: exposureCount.length,
      totalPriceResponses: priceCount.length,
      totalVariantSelections: variantCount.length,
      totalFilterSubscriptions: filterCount.length,
      totalUseCaseSelections: useCaseCount.length,
      totalObjections: objectionCount.length,
      totalReservations: reservationCount.length,
    };
  }),
});
