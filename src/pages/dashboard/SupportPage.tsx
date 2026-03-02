import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, MessageSquare } from "lucide-react";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "outline",
  resolved: "default",
  closed: "secondary",
};

export default function SupportPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user!.id,
        subject: subject.trim(),
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Support request submitted");
      setSubject("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: () => toast.error("Failed to submit request"),
  });

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Support</h1>
        <p className="text-sm text-muted-foreground">Submit a request and we'll get back to you.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">New Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Textarea
            placeholder="Describe your issue or question..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={!subject.trim() || !message.trim() || submitMutation.isPending}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            {submitMutation.isPending ? "Submitting..." : "Submit"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Your Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <div className="space-y-4">
              {tickets.map((t: any) => (
                <div key={t.id} className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{t.subject}</p>
                    <Badge variant={statusVariant[t.status] || "outline"} className="capitalize text-xs">
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{t.message}</p>
                  <p className="text-xs text-muted-foreground/60">
                    {new Date(t.created_at).toLocaleDateString()}
                  </p>
                  {t.admin_response && (
                    <div className="mt-2 p-3 bg-primary/5 border border-primary/10 rounded-md">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MessageSquare className="w-3 h-3 text-primary" />
                        <span className="text-xs font-medium text-primary">Admin Response</span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{t.admin_response}</p>
                      {t.responded_at && (
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {new Date(t.responded_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
