import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, BarChart3, Trash2, TrendingUp, Eye, MousePointerClick, DollarSign, Zap } from "lucide-react";
import type { AdCampaign, Client, InsertAdCampaign } from "@shared/schema";
import { useForm, Controller } from "react-hook-form";

const platformStyles: Record<string, { label: string; cls: string }> = {
  google: { label: "Google Ads", cls: "badge-google" },
  meta: { label: "Meta Ads", cls: "badge-meta" },
};

function CampaignForm({ clients, onSubmit, loading }: {
  clients: Client[];
  onSubmit: (data: InsertAdCampaign) => void;
  loading: boolean;
}) {
  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<InsertAdCampaign>({
    defaultValues: { platform: "google", status: "active", budget: 0, spent: 0, clicks: 0, impressions: 0, conversions: 0, ctr: 0, cpc: 0 },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Client *</Label>
          <Controller name="clientId" control={control} rules={{ required: true }}
            render={({ field }) => (
              <Select onValueChange={v => field.onChange(Number(v))} value={field.value?.toString()}>
                <SelectTrigger data-testid="select-campaign-client"><SelectValue placeholder="Select client…" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.businessName}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
          {errors.clientId && <p className="text-xs text-destructive">Required</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Platform</Label>
          <Select defaultValue="google" onValueChange={v => setValue("platform", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="google">Google Ads</SelectItem>
              <SelectItem value="meta">Meta Ads</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Campaign Name *</Label>
        <Input data-testid="input-campaign-name" placeholder="Spring ADU Campaign" {...register("campaignName", { required: true })} />
        {errors.campaignName && <p className="text-xs text-destructive">Required</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Budget ($)</Label>
          <Input data-testid="input-budget" type="number" step="0.01" {...register("budget", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Spent ($)</Label>
          <Input data-testid="input-spent" type="number" step="0.01" {...register("spent", { valueAsNumber: true })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Impressions</Label>
          <Input type="number" {...register("impressions", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Clicks</Label>
          <Input type="number" {...register("clicks", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Conversions</Label>
          <Input type="number" {...register("conversions", { valueAsNumber: true })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">CTR (%)</Label>
          <Input type="number" step="0.01" {...register("ctr", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">CPC ($)</Label>
          <Input type="number" step="0.01" {...register("cpc", { valueAsNumber: true })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Start Date</Label>
          <Input type="date" {...register("startDate")} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">End Date</Label>
          <Input type="date" {...register("endDate")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Status</Label>
        <Select defaultValue="active" onValueChange={v => setValue("status", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button data-testid="button-submit-campaign" type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving…" : "Save Campaign"}
      </Button>
    </form>
  );
}

export default function AdsPage() {
  const [open, setOpen] = useState(false);
  const [platformFilter, setPlatformFilter] = useState("all");
  const { toast } = useToast();

  const { data: campaigns = [], isLoading } = useQuery<AdCampaign[]>({
    queryKey: ["/api/campaigns"],
    queryFn: () => apiRequest("GET", "/api/campaigns").then(r => r.json()),
  });
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest("GET", "/api/clients").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertAdCampaign) => apiRequest("POST", "/api/campaigns", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setOpen(false);
      toast({ title: "Campaign added" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
    },
  });

  const getClientName = (id: number) => clients.find(c => c.id === id)?.businessName || "Unknown";

  const filtered = campaigns.filter(c => platformFilter === "all" || c.platform === platformFilter);
  const totalSpend = filtered.reduce((s, c) => s + c.spent, 0);
  const totalBudget = filtered.reduce((s, c) => s + c.budget, 0);

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Ad Campaigns</h1>
          <p className="text-sm text-muted-foreground">Google Ads · Meta Ads · Spend Tracking</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-campaign" size="sm" className="gap-1.5" disabled={clients.length === 0}>
              <Plus size={14} /> Add Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Ad Campaign</DialogTitle></DialogHeader>
            <CampaignForm clients={clients} onSubmit={d => createMutation.mutate(d)} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Spend summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg"><DollarSign size={16} className="text-amber-600 dark:text-amber-400" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Spent</p>
              <p className="text-lg font-bold tabular-nums">${totalSpend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg"><Zap size={16} className="text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Budget</p>
              <p className="text-lg font-bold tabular-nums">${totalBudget.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg"><TrendingUp size={16} className="text-green-700 dark:text-green-400" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Budget Used</p>
              <p className="text-lg font-bold tabular-nums">{totalBudget > 0 ? ((totalSpend / totalBudget) * 100).toFixed(1) : 0}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform filter */}
      <div className="flex gap-2">
        {["all", "google", "meta"].map(f => (
          <button key={f}
            data-testid={`filter-platform-${f}`}
            onClick={() => setPlatformFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all capitalize ${
              platformFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All Platforms" : f === "google" ? "Google Ads" : "Meta Ads"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}</div>
      ) : clients.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12 text-center">
          <p className="font-semibold text-sm">Add a client first</p>
          <p className="text-xs text-muted-foreground mt-1">Campaigns are linked to clients.</p>
        </CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12 text-center">
          <BarChart3 size={32} className="text-muted-foreground mb-2" />
          <p className="font-semibold text-sm">No campaigns yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add a Google Ads or Meta Ads campaign to track spending.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const pct = c.budget > 0 ? Math.min((c.spent / c.budget) * 100, 100) : 0;
            const ps = platformStyles[c.platform] || { label: c.platform, cls: "" };
            return (
              <Card key={c.id} data-testid={`card-campaign-${c.id}`} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{c.campaignName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ps.cls}`}>{ps.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === "active" ? "badge-success" : c.status === "paused" ? "badge-warning" : "badge-destructive"}`}>{c.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{getClientName(c.clientId)}</p>
                    </div>
                    <Button
                      data-testid={`button-delete-campaign-${c.id}`}
                      variant="ghost" size="sm"
                      className="h-7 px-2 text-destructive hover:bg-destructive/10"
                      onClick={() => deleteMutation.mutate(c.id)}
                    >
                      <Trash2 size={11} />
                    </Button>
                  </div>

                  {/* Spend bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Spent: <span className="tabular-nums font-medium text-foreground">${c.spent.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></span>
                      <span>Budget: <span className="tabular-nums font-medium text-foreground">${c.budget.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-1 text-right">{pct.toFixed(1)}% used</p>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5"><Eye size={10} /> Impressions</div>
                      <p className="font-bold tabular-nums">{c.impressions.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5"><MousePointerClick size={10} /> Clicks</div>
                      <p className="font-bold tabular-nums">{c.clicks.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5"><TrendingUp size={10} /> CTR</div>
                      <p className="font-bold tabular-nums">{c.ctr.toFixed(2)}%</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5"><DollarSign size={10} /> CPC</div>
                      <p className="font-bold tabular-nums">${c.cpc.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
