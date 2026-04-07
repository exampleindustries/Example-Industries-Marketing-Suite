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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Sparkles, CalendarCheck, Instagram, Facebook, Clock, Trash2, CheckCircle, Hash } from "lucide-react";
import type { SocialPost, Client, InsertSocialPost } from "@shared/schema";
import { useForm, Controller } from "react-hook-form";

const platformIcons: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  both: CalendarCheck,
};

const statusColors: Record<string, string> = {
  draft: "badge-warning",
  scheduled: "badge-meta",
  posted: "badge-success",
};

function PostForm({ clients, onSubmit, loading }: {
  clients: Client[];
  onSubmit: (data: InsertSocialPost) => void;
  loading: boolean;
}) {
  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<InsertSocialPost>({
    defaultValues: { platform: "both", status: "draft", postType: "general" },
  });
  const [generating, setGenerating] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const { toast } = useToast();

  const selectedClientId = watch("clientId");
  const selectedClient = clients.find(c => c.id === Number(selectedClientId));

  const generateCaption = async () => {
    setGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/generate-caption", {
        clientName: selectedClient?.businessName || "Full Circle Builders",
        location: selectedClient?.location || "Temecula, CA",
        postType: watch("postType") || "general",
        keywords: selectedClient?.industry || "",
      });
      const data = await res.json();
      setValue("caption", data.caption);
      setHashtags(data.hashtags);
      setValue("hashtags", JSON.stringify(data.hashtags));
      toast({ title: "Caption generated", description: "AI caption and hashtags ready." });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(data => {
      if (!data.hashtags) data.hashtags = JSON.stringify(hashtags);
      onSubmit(data);
    })} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Client *</Label>
          <Controller
            name="clientId"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select onValueChange={v => field.onChange(Number(v))} value={field.value?.toString()}>
                <SelectTrigger data-testid="select-client"><SelectValue placeholder="Select client…" /></SelectTrigger>
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
          <Select defaultValue="both" onValueChange={v => setValue("platform", v)}>
            <SelectTrigger data-testid="select-platform"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Post Type</Label>
          <Select defaultValue="general" onValueChange={v => setValue("postType", v)}>
            <SelectTrigger data-testid="select-post-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="project">Project Showcase</SelectItem>
              <SelectItem value="testimonial">Testimonial</SelectItem>
              <SelectItem value="promo">Promotion</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Schedule Date</Label>
          <Input data-testid="input-schedule" type="datetime-local" {...register("scheduledAt")} />
        </div>
      </div>

      {/* AI Generate button */}
      <Button
        data-testid="button-generate-caption"
        type="button"
        variant="outline"
        className="w-full gap-2 border-dashed border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
        onClick={generateCaption}
        disabled={generating}
      >
        <Sparkles size={14} />
        {generating ? "Generating…" : "AI Generate Caption + Hashtags"}
      </Button>

      <div className="space-y-1.5">
        <Label className="text-xs">Caption *</Label>
        <Textarea
          data-testid="input-caption"
          rows={4}
          placeholder="Caption will appear here after generation, or type your own…"
          {...register("caption", { required: true })}
        />
        {errors.caption && <p className="text-xs text-destructive">Required</p>}
      </div>

      {/* Hashtag display */}
      {hashtags.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1"><Hash size={12} /> Hashtags</Label>
          <div className="flex flex-wrap gap-1.5 p-3 bg-secondary rounded-lg">
            {hashtags.map((tag, i) => (
              <span key={i} className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">Status</Label>
        <Select defaultValue="draft" onValueChange={v => setValue("status", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="posted">Posted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button data-testid="button-submit-post" type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving…" : "Save Post"}
      </Button>
    </form>
  );
}

export default function SocialPage() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  const { data: posts = [], isLoading } = useQuery<SocialPost[]>({
    queryKey: ["/api/posts"],
    queryFn: () => apiRequest("GET", "/api/posts").then(r => r.json()),
  });
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest("GET", "/api/clients").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertSocialPost) => apiRequest("POST", "/api/posts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setOpen(false);
      toast({ title: "Post saved" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/posts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
    },
  });

  const markPosted = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/posts/${id}`, { status: "posted" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Post marked as published" });
    },
  });

  const getClientName = (id: number) => clients.find(c => c.id === id)?.businessName || "Unknown";

  const filtered = posts.filter(p => filter === "all" || p.status === filter);

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Social Posts</h1>
          <p className="text-sm text-muted-foreground">{posts.length} total · {posts.filter(p => p.status === "scheduled").length} scheduled</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-post" size="sm" className="gap-1.5" disabled={clients.length === 0}>
              <Plus size={14} /> New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Social Post</DialogTitle>
            </DialogHeader>
            <PostForm clients={clients} onSubmit={data => createMutation.mutate(data)} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["all", "draft", "scheduled", "posted"].map(f => (
          <button
            key={f}
            data-testid={`filter-${f}`}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all capitalize ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 rounded-lg" />)}</div>
      ) : clients.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12 text-center">
          <p className="font-semibold text-sm">Add a client first</p>
          <p className="text-xs text-muted-foreground mt-1">Posts are linked to clients. Create a client in the Clients tab.</p>
        </CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12 text-center">
          <CalendarCheck size={32} className="text-muted-foreground mb-2" />
          <p className="font-semibold text-sm">No {filter !== "all" ? filter : ""} posts yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click "New Post" to create one with AI-generated captions.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(post => {
            const PlatformIcon = platformIcons[post.platform] || CalendarCheck;
            let tags: string[] = [];
            try { tags = JSON.parse(post.hashtags) || []; } catch {}
            return (
              <Card key={post.id} data-testid={`card-post-${post.id}`} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[post.status] || ""}`}>{post.status}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <PlatformIcon size={12} /> {post.platform}
                        </span>
                        <span className="text-xs text-muted-foreground">{getClientName(post.clientId)}</span>
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{post.postType}</span>
                      </div>
                      <p className="text-sm leading-relaxed line-clamp-3">{post.caption}</p>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tags.slice(0, 6).map((tag, i) => (
                            <span key={i} className="text-xs text-primary">{tag}</span>
                          ))}
                          {tags.length > 6 && <span className="text-xs text-muted-foreground">+{tags.length - 6} more</span>}
                        </div>
                      )}
                      {post.scheduledAt && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Clock size={11} /> {new Date(post.scheduledAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {post.status !== "posted" && (
                        <Button
                          data-testid={`button-mark-posted-${post.id}`}
                          variant="outline" size="sm"
                          className="h-7 px-2 text-xs gap-1 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                          onClick={() => markPosted.mutate(post.id)}
                        >
                          <CheckCircle size={11} /> Post
                        </Button>
                      )}
                      <Button
                        data-testid={`button-delete-post-${post.id}`}
                        variant="ghost" size="sm"
                        className="h-7 px-2 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteMutation.mutate(post.id)}
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
    </div>
  );
}
