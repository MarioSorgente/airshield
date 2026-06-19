import { relations } from "drizzle-orm";
import { users } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  // User relations can be added here as needed
}));
