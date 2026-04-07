import { db } from "./db";
import { clients, socialPosts, adCampaigns, leads, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { InsertClient, Client, InsertSocialPost, SocialPost, InsertAdCampaign, AdCampaign, InsertLead, Lead, InsertUser, User } from "@shared/schema";

export interface IStorage {
  // Users
  getUserById(id: number): User | undefined;
  getUserByUsername(username: string): User | undefined;
  getUserByEmail(email: string): User | undefined;
  createUser(data: InsertUser): User;
  getUsers(): User[];

  // Clients
  getClients(): Client[];
  getClient(id: number): Client | undefined;
  createClient(data: InsertClient): Client;
  updateClient(id: number, data: Partial<InsertClient>): Client | undefined;
  deleteClient(id: number): void;

  // Social Posts
  getSocialPosts(clientId?: number): SocialPost[];
  getSocialPost(id: number): SocialPost | undefined;
  createSocialPost(data: InsertSocialPost): SocialPost;
  updateSocialPost(id: number, data: Partial<InsertSocialPost>): SocialPost | undefined;
  deleteSocialPost(id: number): void;

  // Ad Campaigns
  getAdCampaigns(clientId?: number): AdCampaign[];
  getAdCampaign(id: number): AdCampaign | undefined;
  createAdCampaign(data: InsertAdCampaign): AdCampaign;
  updateAdCampaign(id: number, data: Partial<InsertAdCampaign>): AdCampaign | undefined;
  deleteAdCampaign(id: number): void;

  // Leads
  getLeads(clientId?: number): Lead[];
  getLead(id: number): Lead | undefined;
  createLead(data: InsertLead): Lead;
  updateLead(id: number, data: Partial<InsertLead>): Lead | undefined;
  deleteLead(id: number): void;
}

export class DatabaseStorage implements IStorage {
  // Users
  getUserById(id: number): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  }
  getUserByUsername(username: string): User | undefined {
    return db.select().from(users).where(eq(users.username, username)).get();
  }
  getUserByEmail(email: string): User | undefined {
    return db.select().from(users).where(eq(users.email, email)).get();
  }
  createUser(data: InsertUser): User {
    return db.insert(users).values({ ...data, createdAt: new Date().toISOString() }).returning().get();
  }
  getUsers(): User[] {
    return db.select().from(users).all();
  }

  // Clients
  getClients(): Client[] {
    return db.select().from(clients).all();
  }
  getClient(id: number): Client | undefined {
    return db.select().from(clients).where(eq(clients.id, id)).get();
  }
  createClient(data: InsertClient): Client {
    return db.insert(clients).values({ ...data, createdAt: new Date().toISOString() }).returning().get();
  }
  updateClient(id: number, data: Partial<InsertClient>): Client | undefined {
    return db.update(clients).set(data).where(eq(clients.id, id)).returning().get();
  }
  deleteClient(id: number): void {
    db.delete(clients).where(eq(clients.id, id)).run();
  }

  // Social Posts
  getSocialPosts(clientId?: number): SocialPost[] {
    if (clientId !== undefined) {
      return db.select().from(socialPosts).where(eq(socialPosts.clientId, clientId)).all();
    }
    return db.select().from(socialPosts).all();
  }
  getSocialPost(id: number): SocialPost | undefined {
    return db.select().from(socialPosts).where(eq(socialPosts.id, id)).get();
  }
  createSocialPost(data: InsertSocialPost): SocialPost {
    return db.insert(socialPosts).values({ ...data, createdAt: new Date().toISOString() }).returning().get();
  }
  updateSocialPost(id: number, data: Partial<InsertSocialPost>): SocialPost | undefined {
    return db.update(socialPosts).set(data).where(eq(socialPosts.id, id)).returning().get();
  }
  deleteSocialPost(id: number): void {
    db.delete(socialPosts).where(eq(socialPosts.id, id)).run();
  }

  // Ad Campaigns
  getAdCampaigns(clientId?: number): AdCampaign[] {
    if (clientId !== undefined) {
      return db.select().from(adCampaigns).where(eq(adCampaigns.clientId, clientId)).all();
    }
    return db.select().from(adCampaigns).all();
  }
  getAdCampaign(id: number): AdCampaign | undefined {
    return db.select().from(adCampaigns).where(eq(adCampaigns.id, id)).get();
  }
  createAdCampaign(data: InsertAdCampaign): AdCampaign {
    return db.insert(adCampaigns).values({ ...data, createdAt: new Date().toISOString() }).returning().get();
  }
  updateAdCampaign(id: number, data: Partial<InsertAdCampaign>): AdCampaign | undefined {
    return db.update(adCampaigns).set(data).where(eq(adCampaigns.id, id)).returning().get();
  }
  deleteAdCampaign(id: number): void {
    db.delete(adCampaigns).where(eq(adCampaigns.id, id)).run();
  }

  // Leads
  getLeads(clientId?: number): Lead[] {
    if (clientId !== undefined) {
      return db.select().from(leads).where(eq(leads.clientId, clientId)).all();
    }
    return db.select().from(leads).all();
  }
  getLead(id: number): Lead | undefined {
    return db.select().from(leads).where(eq(leads.id, id)).get();
  }
  createLead(data: InsertLead): Lead {
    return db.insert(leads).values({ ...data, createdAt: new Date().toISOString() }).returning().get();
  }
  updateLead(id: number, data: Partial<InsertLead>): Lead | undefined {
    return db.update(leads).set(data).where(eq(leads.id, id)).returning().get();
  }
  deleteLead(id: number): void {
    db.delete(leads).where(eq(leads.id, id)).run();
  }
}

export const storage = new DatabaseStorage();
