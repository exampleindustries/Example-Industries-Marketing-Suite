import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, DollarSign, CalendarCheck, Target, TrendingUp, Eye, MousePointerClick, UserCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import type { Client, AdCampaign, Lead, SocialPost } from "@shared/schema";

interface Summary {
  totalClients: number;
  activeClients: number;
  totalSpend: number;
  totalBudget: number;
  scheduledPosts: number;
  postedPosts: number;
  newLeads: number;
  totalLeads: number;
  convertedLeads: number;
  totalImpressions: number;
  totalClicks: number;
  avgCTR: string;
}

const COLORS = ["hsl(218,72%,28%)", "hsl(33,95%,50%)", "hsl(143,55%,40%)", "hsl(0,72%,51%)"];

function KpiCard({ title, value, sub, icon: Icon, color = "primary" }: {
  title: string; value: string | number; sub?: string; icon: any; color?: "primary" | "accent" | "success" | "destructive";
}) {
  const colorMap = {
    primary: "text-primary bg-primary/10",
    accent: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20",
    success: "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20",
    destructive: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold tabular-nums mt-1 text-foreground">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>
            <Icon size={18} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  const { data: summary, isLoading: loadingSum } = useQuery<Summary>({
    queryKey: ["/api/dashboard/summary"],
    queryFn: () => apiRequest("GET", "/api/dashboard/summary").then(r => r.json()),
  });
  const { data: campaigns = [] } = useQuery<AdCampaign[]>({
    queryKey: ["/api/campaigns"],
    queryFn: () => apiRequest("GET", "/api/campaigns").then(r => r.json()),
  });
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    queryFn: () => apiRequest("GET", "/api/leads").then(r => r.json()),
  });
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest("GET", "/api/clients").then(r => r.json()),
  });

  // Chart data
  const spendByPlatform = [
    { name: "Google Ads", value: campaigns.filter(c => c.platform === "google").reduce((s, c) => s + c.spent, 0) },
    { name: "Meta Ads", value: campaigns.filter(c => c.platform === "meta").reduce((s, c) => s + c.spent, 0) },
  ].filter(d => d.value > 0);

  const leadsByStatus = [
    { name: "New", value: leads.filter(l => l.status === "new").length },
    { name: "Contacted", value: leads.filter(l => l.status === "contacted").length },
    { name: "Qualified", value: leads.filter(l => l.status === "qualified").length },
    { name: "Converted", value: leads.filter(l => l.status === "converted").length },
  ].filter(d => d.value > 0);

  const campaignBarData = campaigns.slice(0, 6).map(c => ({
    name: c.campaignName.length > 12 ? c.campaignName.slice(0, 12) + "…" : c.campaignName,
    Budget: c.budget,
    Spent: c.spent,
  }));

  if (loadingSum) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Agency Overview</h1>
        <p className="text-sm text-muted-foreground">Example Industries · Temecula, CA</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Active Clients" value={summary?.activeClients ?? 0} sub={`${summary?.totalClients ?? 0} total`} icon={Users} color="primary" />
        <KpiCard title="Total Ad Spend" value={`$${(summary?.totalSpend ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub={`of $${(summary?.totalBudget ?? 0).toLocaleString()} budget`} icon={DollarSign} color="accent" />
        <KpiCard title="Leads This Month" value={summary?.totalLeads ?? 0} sub={`${summary?.newLeads ?? 0} new · ${summary?.convertedLeads ?? 0} converted`} icon={Target} color="success" />
        <KpiCard title="Scheduled Posts" value={summary?.scheduledPosts ?? 0} sub={`${summary?.postedPosts ?? 0} published`} icon={CalendarCheck} color="primary" />
      </div>

      {/* Second KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Impressions" value={(summary?.totalImpressions ?? 0).toLocaleString()} sub="all campaigns" icon={Eye} />
        <KpiCard title="Clicks" value={(summary?.totalClicks ?? 0).toLocaleString()} sub="all campaigns" icon={MousePointerClick} />
        <KpiCard title="Avg CTR" value={`${summary?.avgCTR ?? "0.00"}%`} sub="click-through rate" icon={TrendingUp} color="success" />
        <KpiCard title="Converted Leads" value={summary?.convertedLeads ?? 0} sub={`of ${summary?.totalLeads ?? 0} total leads`} icon={UserCheck} color="success" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Campaign spend bar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Budget vs. Spend by Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            {campaignBarData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No campaigns yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={campaignBarData} barGap={2}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                  <Bar dataKey="Budget" fill="hsl(218,72%,28%)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Spent" fill="hsl(33,95%,50%)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Lead funnel pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Lead Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {leadsByStatus.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No leads yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={leadsByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {leadsByStatus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent clients */}
      {clients.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Client Roster</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {clients.slice(0, 5).map(client => (
                <div key={client.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{client.businessName}</p>
                    <p className="text-xs text-muted-foreground">{client.location} · {client.industry}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    client.status === "active" ? "badge-success" :
                    client.status === "paused" ? "badge-warning" : "badge-destructive"
                  }`}>{client.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
