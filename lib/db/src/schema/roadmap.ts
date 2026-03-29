import { pgTable, serial, text, boolean, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const dailyCheckinsTable = pgTable("daily_checkins", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  date: text("date").notNull(),
  hasUni: boolean("has_uni").notNull().default(false),
  hasOffice: boolean("has_office").notNull().default(false),
  tasks: text("tasks").notNull().default(""),
  availableHours: real("available_hours").notNull().default(0),
  pomodoroSessions: integer("pomodoro_sessions").notNull().default(0),
  hoursLogged: real("hours_logged").notNull().default(0),
  aiSchedule: text("ai_schedule"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDailyCheckinSchema = createInsertSchema(dailyCheckinsTable).omit({ id: true, createdAt: true });
export type InsertDailyCheckin = z.infer<typeof insertDailyCheckinSchema>;
export type DailyCheckin = typeof dailyCheckinsTable.$inferSelect;

export const pomodoroSessionsTable = pgTable("pomodoro_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  date: text("date").notNull(),
  workDuration: integer("work_duration").notNull().default(25),
  breakDuration: integer("break_duration").notNull().default(5),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const insertPomodoroSessionSchema = createInsertSchema(pomodoroSessionsTable).omit({ id: true, completedAt: true });
export type InsertPomodoroSession = z.infer<typeof insertPomodoroSessionSchema>;
export type PomodoroSession = typeof pomodoroSessionsTable.$inferSelect;

export const episodeProgressTable = pgTable("episode_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  episodeId: text("episode_id").notNull(),
  episodeTitle: text("episode_title").notNull(),
  phase: text("phase").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const insertEpisodeProgressSchema = createInsertSchema(episodeProgressTable).omit({ id: true, completedAt: true });
export type InsertEpisodeProgress = z.infer<typeof insertEpisodeProgressSchema>;
export type EpisodeProgress = typeof episodeProgressTable.$inferSelect;

export const userProfilesTable = pgTable("user_profiles", {
  id: text("id").primaryKey().references(() => usersTable.id),
  currentPhase: text("current_phase").notNull().default("Phase 1"),
  totalHoursLogged: real("total_hours_logged").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastCheckIn: text("last_check_in"),
  achievements: text("achievements").array().notNull().default([]),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserProfileSchema = createInsertSchema(userProfilesTable);
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfilesTable.$inferSelect;
