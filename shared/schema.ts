import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("admin"), // admin | viewer
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── Clients ──────────────────────────────────────────────────────────────────
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  businessName: text("business_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  location: text("location"),
  industry: text("industry"),
  status: text("status").notNull().default("active"), // active | paused | inactive
  monthlyBudget: real("monthly_budget"),
  notes: text("notes"),
  logoUrl: text("logo_url"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// ─── Social Posts ─────────────────────────────────────────────────────────────
export const socialPosts = sqliteTable("social_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull(),
  platform: text("platform").notNull(), // instagram | facebook | both
  caption: text("caption").notNull(),
  hashtags: text("hashtags").notNull(), // JSON string array
  imageUrl: text("image_url"),
  scheduledAt: text("scheduled_at"),
  status: text("status").notNull().default("draft"), // draft | scheduled | posted
  postType: text("post_type").notNull().default("general"), // general | project | testimonial | promo
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({ id: true, createdAt: true });
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type SocialPost = typeof socialPosts.$inferSelect;

// ─── Ad Campaigns ─────────────────────────────────────────────────────────────
export const adCampaigns = sqliteTable("ad_campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull(),
  platform: text("platform").notNull(), // google | meta
  campaignName: text("campaign_name").notNull(),
  budget: real("budget").notNull().default(0),
  spent: real("spent").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  impressions: integer("impressions").notNull().default(0),
  conversions: integer("conversions").notNull().default(0),
  ctr: real("ctr").notNull().default(0), // click-through rate %
  cpc: real("cpc").notNull().default(0), // cost per click
  startDate: text("start_date"),
  endDate: text("end_date"),
  status: text("status").notNull().default("active"), // active | paused | ended
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertAdCampaignSchema = createInsertSchema(adCampaigns).omit({ id: true, createdAt: true });
export type InsertAdCampaign = z.infer<typeof insertAdCampaignSchema>;
export type AdCampaign = typeof adCampaigns.$inferSelect;

// ─── Leads ────────────────────────────────────────────────────────────────────
export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  source: text("source").notNull().default("google"), // google | meta | organic | referral
  status: text("status").notNull().default("new"), // new | contacted | qualified | converted | lost
  value: real("value"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
