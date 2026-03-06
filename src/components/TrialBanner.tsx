import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Flame, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TrialBanner() {
  const { data: subscription, isExpired } = useSubscription();
  const { data: credits } = useCredits();
  const navigate = useNavigate();

  if (!subscription || subscription.plan !== "trial") return null;

  const creditsRemaining = credits?.credits_remaining ?? 0;

  const daysLeft = subscription.current_period_end
    ? Math.max(0, Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  if (isExpired) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Clock className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Trial ended</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Subscribe to continue running audits. Your past reports are still available.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate("/dashboard/subscription")}
            className="flex-shrink-0"
          >
            Subscribe Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Flame className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">
              Free Trial &mdash; {daysLeft} {daysLeft === 1 ? "day" : "days"} left
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {creditsRemaining.toLocaleString()} credits remaining &middot; Full Inferno-tier access
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate("/dashboard/subscription")}
          className="flex-shrink-0"
        >
          Subscribe
        </Button>
      </div>
    </div>
  );
}
