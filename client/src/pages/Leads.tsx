import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Target, Mail, Phone, ArrowRight, Trash2, DollarSign, Edit2 } from "lucide-react";
import type { Lead, Client, InsertLead } from "@shared/schema";
import { useForm, Controller } from "react-hook-form";

const statusOrder = ["new", "contacted", "qualified", "converted", "lost"];
const statusColors: Record<string, string> = {
  new: "badge-meta",
  contacted: "badge-warning",
  qualified: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  converted: "badge-success",
  lost: "badge-destructive",
};

const sourceStyles: Record<string, string> = {
  google: "badge-google",
  meta: "badge-meta",
  organic: "badge-success",
  referral: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
};

function LeadForm({ clients, onSubmit, loading, initial }: {
  clients: Client[];
  onSubmit: (data: InsertLead) => void;
  loading: boolean;
  initial?: Partial<InsertLead>;
}) {
  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<InsertLead>({
    defaultValues: initial || { status: "new", source: "google" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Client *</Label>
          <Controller name="clientId" control={control} rules={{ required: true }}
            render={({ field }) => (
              <Select onValueChange={v => field.onChange(Number(v))} value={field.value?.toString()}>
                <SelectTrigger data-testid="select-lead-client"><SelectValue placeholder="Select client…" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.businessName}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
          {errors.clientId && <p className="text-xs text-destructive">Required</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Lead Name *</Label>
          <Input data-testid="input-lead-name" placeholder="John Homeowner" {...register("name", { required: true })} />
          {errors.name && <p className="text-xs text-destructive">Required</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Email</Label>
          <Input data-testid="input-lead-email" type="email" placeholder="john@example.com" {...register("email")} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Phone</Label>
          <Input data-testid="input-lead-phone" placeholder="(951) 555-0100" {...register("phone")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Source</Label>
          <Select defaultValue="google" onValueChange={v => setValue("source", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="google">Google Leads</SelectItem>
              <SelectItem value="meta">Meta Ads</SelectItem>
              <SelectItem value="organic">Organic</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Lead Value ($)</Label>
          <Input data-testid="input-lead-value" type="number" step="100" placeholder="5000" {...register("value", { valueAsNumber: true })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Status</Label>
        <Select defaultValue="new" onValueChange={v => setValue("status", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {statusOrder.map(s => <SelectItem key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Notes</Label>
        <Textarea data-testid="input-lead-notes" placeholder="Any notes about this lead…" rows={2} {...register("notes")} />
      </div>
      <Button data-testid="button-submit-lead" type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving…" : initial ? "Update Lead" : "Add Lead"}
      </Button>
    </form>
  );
}

export default function LeadsPage() {
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const { toast } = useToast();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    queryFn: () => apiRequest("GET", "/api/leads").then(r => r.json()),
  });
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest("GET", "/api/clients").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertLead) => apiRequest("POST", "/api/leads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setOpen(false);
      toast({ title: "Lead added" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertLead> }) =>
      apiRequest("PATCH", `/api/leads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setEditLead(null);
      toast({ title: "Lead updated" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/leads/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
    },
  });

  const getClientName = (id: number) => clients.find(c => c.id === id)?.businessName || "Unknown";
  const getNextStatus = (status: string) => {
    const idx = statusOrder.indexOf(status);
    return idx >= 0 && idx < statusOrder.length - 2 ? statusOrder[idx + 1] : null;
  };

  const filtered = leads.filter(l => statusFilter === "all" || l.status === statusFilter);
  const totalValue = filtered.filter(l => l.value).reduce((s, l) => s + (l.value || 0), 0);
  const convertedValue = leads.filter(l => l.status === "converted" && l.value).reduce((s, l) => s + (l.value || 0), 0);

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">Google Leads · Meta Leads · Pipeline Tracking</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-lead" size="sm" className="gap-1.5" disabled={clients.length === 0}>
              <Plus size={14} /> Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Lead</DialogTitle></DialogHeader>
            <LeadForm clients={clients} onSubmit={d => createMutation.mutate(d)} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statusOrder.slice(0, 4).map(s => {
          const count = leads.filter(l => l.status === s).length;
          return (
            <Card key={s} className={`cursor-pointer transition-all ${statusFilter === s ? "ring-2 ring-primary" : ""}`}
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold tabular-nums">{count}</p>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">{s}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Value summary */}
      {(totalValue > 0 || convertedValue > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg"><DollarSign size={16} className="text-amber-600 dark:text-amber-400" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Pipeline Value</p>
                <p className="text-lg font-bold tabular-nums">${totalValue.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg"><Target size={16} className="text-green-700 dark:text-green-400" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Converted Value</p>
                <p className="text-lg font-bold tabular-nums">${convertedValue.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...statusOrder].map(f => (
          <button key={f}
            data-testid={`filter-lead-${f}`}
            onClick={() => setStatusFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all capitalize ${
              statusFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >{f === "all" ? "All Leads" : f}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
      ) : clients.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12 text-center">
          <p className="font-semibold text-sm">Add a client first</p>
          <p className="text-xs text-muted-foreground mt-1">Leads are linked to clients.</p>
        </CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12 text-center">
          <Target size={32} className="text-muted-foreground mb-2" />
          <p className="font-semibold text-sm">No {statusFilter !== "all" ? statusFilter : ""} leads</p>
          <p className="text-xs text-muted-foreground mt-1">Add a lead to start tracking your sales pipeline.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(lead => {
            const nextStatus = getNextStatus(lead.status);
            return (
              <Card key={lead.id} data-testid={`card-lead-${lead.id}`} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-sm">{lead.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[lead.status] || ""}`}>{lead.status}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceStyles[lead.source] || ""}`}>{lead.source}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span>{getClientName(lead.clientId)}</span>
                        {lead.email && <span className="flex items-center gap-1"><Mail size={10} />{lead.email}</span>}
                        {lead.phone && <span className="flex items-center gap-1"><Phone size={10} />{lead.phone}</span>}
                        {lead.value && <span className="flex items-center gap-1 font-medium text-foreground"><DollarSign size={10} />${lead.value.toLocaleString()}</span>}
                      </div>
                      {lead.notes && <p className="text-xs text-muted-foreground mt-1 italic">{lead.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {nextStatus && (
                        <Button
                          data-testid={`button-advance-lead-${lead.id}`}
                          variant="outline" size="sm"
                          className="h-7 px-2 text-xs gap-1 capitalize"
                          onClick={() => updateStatus.mutate({ id: lead.id, status: nextStatus })}
                        >
                          <ArrowRight size={11} /> {nextStatus}
                        </Button>
                      )}
                      <Button
                        data-testid={`button-edit-lead-${lead.id}`}
                        variant="outline" size="sm"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => setEditLead(lead)}
                      >
                        <Edit2 size={11} /> Edit
                      </Button>
                      <Button
                        data-testid={`button-delete-lead-${lead.id}`}
                        variant="ghost" size="sm"
                        className="h-7 px-2 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteMutation.mutate(lead.id)}
                      >
                        <Trash2 size={11} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editLead} onOpenChange={o => !o && setEditLead(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Lead</DialogTitle></DialogHeader>
          {editLead && (
            <LeadForm
              clients={clients}
              initial={editLead}
              onSubmit={data => updateMutation.mutate({ id: editLead.id, data })}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
