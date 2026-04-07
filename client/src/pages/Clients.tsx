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
import { Plus, Building2, Mail, Phone, MapPin, Edit2, Trash2, DollarSign } from "lucide-react";
import type { Client, InsertClient } from "@shared/schema";
import { useForm } from "react-hook-form";

const statusColors: Record<string, string> = {
  active: "badge-success",
  paused: "badge-warning",
  inactive: "badge-destructive",
};

function ClientForm({ initial, onSubmit, loading }: {
  initial?: Partial<InsertClient>;
  onSubmit: (data: InsertClient) => void;
  loading: boolean;
}) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<InsertClient>({
    defaultValues: initial || { status: "active" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Contact Name *</Label>
          <Input data-testid="input-name" placeholder="Jane Smith" {...register("name", { required: true })} />
          {errors.name && <p className="text-xs text-destructive">Required</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Business Name *</Label>
          <Input data-testid="input-business" placeholder="Acme Contracting" {...register("businessName", { required: true })} />
          {errors.businessName && <p className="text-xs text-destructive">Required</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Email *</Label>
          <Input data-testid="input-email" type="email" placeholder="jane@acme.com" {...register("email", { required: true })} />
          {errors.email && <p className="text-xs text-destructive">Required</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Phone</Label>
          <Input data-testid="input-phone" placeholder="(951) 555-0100" {...register("phone")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Location</Label>
          <Input data-testid="input-location" placeholder="Temecula, CA" {...register("location")} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Industry</Label>
          <Input data-testid="input-industry" placeholder="General Contracting" {...register("industry")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Monthly Budget ($)</Label>
          <Input data-testid="input-budget" type="number" placeholder="1500" {...register("monthlyBudget", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select defaultValue={initial?.status || "active"} onValueChange={v => setValue("status", v)}>
            <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Notes</Label>
        <Textarea data-testid="input-notes" placeholder="Any notes about this client…" rows={2} {...register("notes")} />
      </div>
      <Button data-testid="button-submit-client" type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving…" : initial?.name ? "Update Client" : "Add Client"}
      </Button>
    </form>
  );
}

export default function ClientsPage() {
  const [open, setOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest("GET", "/api/clients").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertClient) => apiRequest("POST", "/api/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setOpen(false);
      toast({ title: "Client added" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertClient> }) =>
      apiRequest("PATCH", `/api/clients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setEditClient(null);
      toast({ title: "Client updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      toast({ title: "Client removed" });
    },
  });

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground">{clients.length} client{clients.length !== 1 ? "s" : ""} in your roster</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-client" size="sm" className="gap-1.5">
              <Plus size={14} /> Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Client</DialogTitle>
            </DialogHeader>
            <ClientForm
              onSubmit={data => createMutation.mutate(data)}
              loading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 size={36} className="text-muted-foreground mb-3" />
            <p className="font-semibold text-sm">No clients yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add your first client to get started tracking campaigns and leads.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clients.map(client => (
            <Card key={client.id} data-testid={`card-client-${client.id}`} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{client.businessName}</p>
                    <p className="text-xs text-muted-foreground">{client.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${statusColors[client.status] || ""}`}>
                    {client.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                  {client.email && <div className="flex items-center gap-1.5"><Mail size={12} />{client.email}</div>}
                  {client.phone && <div className="flex items-center gap-1.5"><Phone size={12} />{client.phone}</div>}
                  {client.location && <div className="flex items-center gap-1.5"><MapPin size={12} />{client.location}</div>}
                  {client.monthlyBudget && (
                    <div className="flex items-center gap-1.5"><DollarSign size={12} />${client.monthlyBudget.toLocaleString()}/mo budget</div>
                  )}
                  {client.industry && <div className="text-xs bg-secondary px-2 py-0.5 rounded-full inline-block">{client.industry}</div>}
                </div>
                {client.notes && <p className="text-xs text-muted-foreground italic border-t border-border pt-2 mt-2">{client.notes}</p>}
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <Dialog open={editClient?.id === client.id} onOpenChange={o => !o && setEditClient(null)}>
                    <DialogTrigger asChild>
                      <Button data-testid={`button-edit-${client.id}`} variant="outline" size="sm" className="flex-1 gap-1" onClick={() => setEditClient(client)}>
                        <Edit2 size={12} /> Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader><DialogTitle>Edit Client</DialogTitle></DialogHeader>
                      <ClientForm
                        initial={editClient || undefined}
                        onSubmit={data => updateMutation.mutate({ id: client.id, data })}
                        loading={updateMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    data-testid={`button-delete-${client.id}`}
                    variant="outline" size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => deleteMutation.mutate(client.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
