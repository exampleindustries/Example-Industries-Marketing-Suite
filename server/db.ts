import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import * as schema from "@shared/schema";
import { mkdirSync } from "fs";
import { dirname } from "path";

const dbPath = process.env.DATABASE_PATH || "./data.db";
mkdirSync(dirname(dbPath), { recursive: true });
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    business_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    industry TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    monthly_budget REAL,
    notes TEXT,
    logo_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS social_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    platform TEXT NOT NULL,
    caption TEXT NOT NULL,
    hashtags TEXT NOT NULL,
    image_url TEXT,
    scheduled_at TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    post_type TEXT NOT NULL DEFAULT 'general',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ad_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    platform TEXT NOT NULL,
    campaign_name TEXT NOT NULL,
    budget REAL NOT NULL DEFAULT 0,
    spent REAL NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    ctr REAL NOT NULL DEFAULT 0,
    cpc REAL NOT NULL DEFAULT 0,
    start_date TEXT,
    end_date TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source TEXT NOT NULL DEFAULT 'google',
    status TEXT NOT NULL DEFAULT 'new',
    value REAL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed with demo data if empty
const clientCount = sqlite.prepare("SELECT COUNT(*) as count FROM clients").get() as { count: number };
if (clientCount.count === 0) {
  // Insert Full Circle Builders
  const fcb = sqlite.prepare(`
    INSERT INTO clients (name, business_name, email, phone, location, industry, status, monthly_budget, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run("Robert Campos", "Full Circle Builders Inc", "rcampos@exampleindustries.com", "(951) 555-0101", "Temecula, CA", "General Contracting / ADU", "active", 2500, "Primary account — ADU builder serving Temecula, Murrieta, and surrounding Inland Empire communities.");

  const fcbId = fcb.lastInsertRowid;

  // Insert a second demo client
  const demo2 = sqlite.prepare(`
    INSERT INTO clients (name, business_name, email, phone, location, industry, status, monthly_budget, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run("Sarah Martinez", "Inland Empire Roofing", "sarah@ieroofinginc.com", "(951) 555-0202", "Murrieta, CA", "Roofing / Home Improvement", "active", 1800, "Residential roofing contractor — targeting homeowners in Murrieta and Temecula.");

  const demo2Id = demo2.lastInsertRowid;

  // Insert sample social posts for FCB
  sqlite.prepare(`
    INSERT INTO social_posts (client_id, platform, caption, hashtags, status, post_type, scheduled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(fcbId, "both",
    "Building dreams one project at a time in Temecula, CA 🏗️ Full Circle Builders Inc delivers quality craftsmanship you can count on. From concept to completion, we handle it all. Ready to transform your space? Contact us today for a free estimate!",
    JSON.stringify(["#FullCircleBuilders", "#TemeculaCA", "#TemeculaConstruction", "#SoCalConstruction", "#GeneralContractor", "#HomeRenovation", "#BuildingDreams", "#ADU", "#InlandEmpire"]),
    "scheduled", "general", new Date(Date.now() + 86400000).toISOString()
  );

  sqlite.prepare(`
    INSERT INTO social_posts (client_id, platform, caption, hashtags, status, post_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(fcbId, "instagram",
    "Another stunning ADU completed in Temecula, CA! The team at Full Circle Builders Inc put their heart into every detail of this beautiful addition. Proud to deliver results that exceed expectations every time!",
    JSON.stringify(["#ProjectComplete", "#ADU", "#BeforeAndAfter", "#FullCircleBuilders", "#TemeculaCA", "#HomeTransformation", "#ContractorLife", "#SoCalConstruction"]),
    "posted", "project"
  );

  // Sample campaigns
  sqlite.prepare(`
    INSERT INTO ad_campaigns (client_id, platform, campaign_name, budget, spent, clicks, impressions, conversions, ctr, cpc, status, start_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(fcbId, "google", "ADU Spring Campaign", 1500, 982.50, 412, 18450, 8, 2.23, 2.38, "active", "2026-03-01");

  sqlite.prepare(`
    INSERT INTO ad_campaigns (client_id, platform, campaign_name, budget, spent, clicks, impressions, conversions, ctr, cpc, status, start_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(fcbId, "meta", "Home Renovation — Temecula", 1000, 644.20, 286, 22100, 5, 1.29, 2.25, "active", "2026-03-15");

  sqlite.prepare(`
    INSERT INTO ad_campaigns (client_id, platform, campaign_name, budget, spent, clicks, impressions, conversions, ctr, cpc, status, start_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(demo2Id, "google", "Roofing — Murrieta", 800, 520.00, 198, 11200, 4, 1.77, 2.63, "active", "2026-03-10");

  // Sample leads for FCB
  const leadData = [
    [fcbId, "Mike Torres", "mike.torres@gmail.com", "(951) 555-0303", "google", "new", 18000, "Interested in detached ADU — 500 sqft backyard build"],
    [fcbId, "Linda Chen", "lchen@hotmail.com", "(951) 555-0404", "meta", "contacted", 12500, "Kitchen + bathroom remodel — wants to start Q2"],
    [fcbId, "James Whitfield", "jwhit@yahoo.com", "(760) 555-0505", "google", "qualified", 45000, "Full home addition — 400 sqft master suite"],
    [fcbId, "Patricia Gomez", "pgomez@gmail.com", "(951) 555-0606", "organic", "converted", 22000, "Garage conversion to ADU — permit approved"],
    [fcbId, "David Kim", "dkim@example.com", "(951) 555-0707", "referral", "new", 8500, "Patio cover + decking project"],
    [demo2Id, "Rosa Flores", "rflores@gmail.com", "(951) 555-0808", "google", "contacted", 9500, "Full roof replacement — tile to composition"],
    [demo2Id, "Tom Bradley", "tbrad@yahoo.com", "(951) 555-0909", "meta", "new", 7200, "Partial reroof + gutter install"],
  ];

  const insertLead = sqlite.prepare(`
    INSERT INTO leads (client_id, name, email, phone, source, status, value, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  leadData.forEach(l => insertLead.run(...l));
}

// Seed default admin if no users exist
const userCount = sqlite.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const hashedPassword = bcrypt.hashSync("admin123", 12);
  sqlite.prepare(`
    INSERT INTO users (username, email, password, display_name, role)
    VALUES (?, ?, ?, ?, ?)
  `).run("admin", "rcampos@exampleindustries.com", hashedPassword, "Example Industries", "admin");
}
