import type { Express } from "express";
import { type Server } from "http";
import passport from "passport";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { insertClientSchema, insertSocialPostSchema, insertAdCampaignSchema, insertLeadSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(httpServer: Server, app: Express): Server {
  // Setup authentication first
  setupAuth(app);

  // ─── Auth Routes (public) ────────────────────────────────────────────────
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });
      req.logIn(user, (err) => {
        if (err) return next(err);
        res.json({ user });
      });
    })(req, res, next);
  });

  app.post("/api/auth/register", (req, res) => {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password || !displayName) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    // Check for duplicates
    if (storage.getUserByUsername(username)) {
      return res.status(409).json({ error: "Username already taken" });
    }
    if (storage.getUserByEmail(email)) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const hashedPassword = bcrypt.hashSync(password, 12);
    const user = storage.createUser({ username, email, password: hashedPassword, displayName, role: "admin" });
    const { password: _, ...safeUser } = user;
    req.logIn(safeUser as Express.User, (err) => {
      if (err) return res.status(500).json({ error: "Login failed after registration" });
      res.json({ user: safeUser });
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ user: req.user });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // ─── All routes below require authentication ──────────────────────────────
  app.use("/api", (req, res, next) => {
    // Skip auth check for auth routes
    if (req.path.startsWith("/auth/")) return next();
    requireAuth(req, res, next);
  });

  // ─── Clients ─────────────────────────────────────────────────────────────
  app.get("/api/clients", (_req, res) => {
    res.json(storage.getClients());
  });

  app.get("/api/clients/:id", (req, res) => {
    const client = storage.getClient(Number(req.params.id));
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json(client);
  });

  app.post("/api/clients", (req, res) => {
    const parsed = insertClientSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    res.json(storage.createClient(parsed.data));
  });

  app.patch("/api/clients/:id", (req, res) => {
    const updated = storage.updateClient(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Client not found" });
    res.json(updated);
  });

  app.delete("/api/clients/:id", (req, res) => {
    storage.deleteClient(Number(req.params.id));
    res.json({ success: true });
  });

  // ─── Social Posts ─────────────────────────────────────────────────────────
  app.get("/api/posts", (req, res) => {
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    res.json(storage.getSocialPosts(clientId));
  });

  app.get("/api/posts/:id", (req, res) => {
    const post = storage.getSocialPost(Number(req.params.id));
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  });

  app.post("/api/posts", (req, res) => {
    const parsed = insertSocialPostSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    res.json(storage.createSocialPost(parsed.data));
  });

  app.patch("/api/posts/:id", (req, res) => {
    const updated = storage.updateSocialPost(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Post not found" });
    res.json(updated);
  });

  app.delete("/api/posts/:id", (req, res) => {
    storage.deleteSocialPost(Number(req.params.id));
    res.json({ success: true });
  });

  // ─── Generate Caption (AI simulation) ────────────────────────────────────
  app.post("/api/generate-caption", (req, res) => {
    const { clientName, location, postType, keywords } = req.body;

    const captions: Record<string, string[]> = {
      general: [
        `Building dreams one project at a time in ${location || "Temecula, CA"} 🏗️ ${clientName || "Full Circle Builders"} delivers quality craftsmanship you can count on. From concept to completion, we handle it all. Ready to transform your space? Contact us today for a free estimate!`,
        `Excellence in every nail, precision in every plan. ${clientName || "Full Circle Builders"} is proud to serve the ${location || "Temecula"} community with top-tier construction services. Your vision, our expertise. Let's build something amazing together!`,
        `${location || "Temecula, CA"}'s trusted name in construction. At ${clientName || "Full Circle Builders"}, we bring your ideas to life with quality materials and skilled craftsmanship. No project too big or too small — we do it all!`,
      ],
      project: [
        `Another stunning project completed in ${location || "Temecula, CA"}! 🏠 The team at ${clientName || "Full Circle Builders"} put their heart into every detail of this beautiful renovation. Proud to deliver results that exceed expectations every time!`,
        `Fresh off the job site in ${location || "the Temecula Valley"}! This transformation by ${clientName || "Full Circle Builders"} is a perfect example of what quality construction looks like. Swipe to see the before and after ➡️`,
        `Project complete! ✅ Another happy homeowner in ${location || "Temecula"} thanks to the dedicated crew at ${clientName || "Full Circle Builders"}. We love what we do and it shows in our work!`,
      ],
      testimonial: [
        `"Working with ${clientName || "Full Circle Builders"} was an absolute pleasure. They finished on time, on budget, and the quality exceeded our expectations!" — Happy client in ${location || "Temecula, CA"} ⭐⭐⭐⭐⭐ Your story could be next. Contact us today!`,
        `5-star reviews keep coming in! 🌟 Our customers in ${location || "the Temecula area"} love the work ${clientName || "Full Circle Builders"} delivers. Thank you for trusting us with your most important investment — your home!`,
      ],
      promo: [
        `Limited time offer! 🚨 Book your free consultation with ${clientName || "Full Circle Builders"} this month and receive a complimentary project assessment valued at $250. Serving ${location || "Temecula"} and surrounding areas. Don't miss out — spots are filling fast!`,
        `Spring into your renovation! 🌸 ${clientName || "Full Circle Builders"} is booking projects for the season in ${location || "Temecula, CA"} and surrounding communities. Get ahead of the rush — call today for your free estimate!`,
      ],
    };

    const type = postType || "general";
    const captionList = captions[type] || captions.general;
    const caption = captionList[Math.floor(Math.random() * captionList.length)];

    const hashtagSets: Record<string, string[]> = {
      general: [
        "#FullCircleBuilders", "#TemeculaCA", "#TemeculaConstruction", "#SoCalConstruction",
        "#GeneralContractor", "#HomeRenovation", "#BuildingDreams", "#ContractorLife",
        "#RiversideCounty", "#InlandEmpire", "#HomeImprovement", "#QualityCraftsmanship",
        "#ADU", "#NewConstruction", "#HomeBuilder", "#Temecula"
      ],
      project: [
        "#ProjectComplete", "#BeforeAndAfter", "#HomeTransformation", "#FullCircleBuilders",
        "#TemeculaCA", "#RenovationGoals", "#HomeRenovation", "#ContractorLife",
        "#SoCalConstruction", "#InlandEmpire", "#ADUBuilder", "#HomeImprovement"
      ],
      testimonial: [
        "#HappyClients", "#5StarReview", "#CustomerSatisfaction", "#FullCircleBuilders",
        "#TemeculaContractor", "#HomeRenovation", "#TrustTheProcess", "#SoCalBuilders",
        "#InlandEmpire", "#RiversideCounty", "#BuildWithUs"
      ],
      promo: [
        "#LimitedTimeOffer", "#FreeEstimate", "#FullCircleBuilders", "#TemeculaCA",
        "#SpringRenovation", "#HomeImprovement", "#ADU", "#SoCalConstruction",
        "#GeneralContractor", "#InlandEmpire", "#BookNow"
      ],
    };

    const hashtags = hashtagSets[type] || hashtagSets.general;
    res.json({ caption, hashtags });
  });

  // ─── Ad Campaigns ─────────────────────────────────────────────────────────
  app.get("/api/campaigns", (req, res) => {
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    res.json(storage.getAdCampaigns(clientId));
  });

  app.get("/api/campaigns/:id", (req, res) => {
    const campaign = storage.getAdCampaign(Number(req.params.id));
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    res.json(campaign);
  });

  app.post("/api/campaigns", (req, res) => {
    const parsed = insertAdCampaignSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    res.json(storage.createAdCampaign(parsed.data));
  });

  app.patch("/api/campaigns/:id", (req, res) => {
    const updated = storage.updateAdCampaign(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Campaign not found" });
    res.json(updated);
  });

  app.delete("/api/campaigns/:id", (req, res) => {
    storage.deleteAdCampaign(Number(req.params.id));
    res.json({ success: true });
  });

  // ─── Leads ─────────────────────────────────────────────────────────────────
  app.get("/api/leads", (req, res) => {
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    res.json(storage.getLeads(clientId));
  });

  app.get("/api/leads/:id", (req, res) => {
    const lead = storage.getLead(Number(req.params.id));
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    res.json(lead);
  });

  app.post("/api/leads", (req, res) => {
    const parsed = insertLeadSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    res.json(storage.createLead(parsed.data));
  });

  app.patch("/api/leads/:id", (req, res) => {
    const updated = storage.updateLead(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Lead not found" });
    res.json(updated);
  });

  app.delete("/api/leads/:id", (req, res) => {
    storage.deleteLead(Number(req.params.id));
    res.json({ success: true });
  });

  // ─── Dashboard Summary ───────────────────────────────────────────────────
  app.get("/api/dashboard/summary", (_req, res) => {
    const allClients = storage.getClients();
    const allPosts = storage.getSocialPosts();
    const allCampaigns = storage.getAdCampaigns();
    const allLeads = storage.getLeads();

    const activeClients = allClients.filter(c => c.status === "active").length;
    const totalSpend = allCampaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
    const totalBudget = allCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const scheduledPosts = allPosts.filter(p => p.status === "scheduled").length;
    const newLeads = allLeads.filter(l => l.status === "new").length;
    const convertedLeads = allLeads.filter(l => l.status === "converted").length;
    const totalImpressions = allCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
    const totalClicks = allCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);

    res.json({
      totalClients: allClients.length,
      activeClients,
      totalSpend,
      totalBudget,
      scheduledPosts,
      postedPosts: allPosts.filter(p => p.status === "posted").length,
      newLeads,
      totalLeads: allLeads.length,
      convertedLeads,
      totalImpressions,
      totalClicks,
      avgCTR: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00",
    });
  });

  return httpServer;
}
