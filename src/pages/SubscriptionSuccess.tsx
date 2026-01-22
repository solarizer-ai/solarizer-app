import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import MinimalFooter from "@/components/MinimalFooter";
import { useSubscription, useCredits } from "@/hooks/useSubscription";

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [attempts, setAttempts] = useState(0);
  const metaTagRef = useRef<HTMLMetaElement | null>(null);
  
  const subId = searchParams.get("sub_id");
  const plan = searchParams.get("plan");
  const period = searchParams.get("period");
  const isUpgrade = searchParams.get("upgrade") === "true";
  const isReactivation = searchParams.get("reactivate") === "true";
  
  const { data: subscription, refetch: refetchSubscription } = useSubscription();
  const { data: credits, refetch: refetchCredits } = useCredits();

  // Add noindex meta tag to prevent search engine indexing
  useEffect(() => {
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    document.head.appendChild(metaRobots);
    metaTagRef.current = metaRobots;
    
    return () => {
      if (metaTagRef.current) {
        document.head.removeChild(metaTagRef.current);
      }
    };
  }, []);

  // Poll for subscription activation
  useEffect(() => {
    if (!subId) {
      setStatus("error");
      return;
    }

    const checkSubscription = async () => {
      await refetchSubscription();
      await refetchCredits();
      
      // Check if subscription is now active with cf_subscription_id
      if (subscription?.status === "active" && subscription?.cf_subscription_id) {
        setStatus("success");
        return;
      }

      // If plan matches what we subscribed to, consider it successful
      if (subscription?.plan === plan) {
        setStatus("success");
        return;
      }

      // Continue polling up to 30 attempts (60 seconds)
      if (attempts < 30) {
        setAttempts(prev => prev + 1);
      } else {
        // After timeout, show success anyway - webhook might be delayed
        setStatus("success");
      }
    };

    const timer = setTimeout(checkSubscription, 2000);
    return () => clearTimeout(timer);
  }, [subId, subscription, attempts, refetchSubscription, refetchCredits, plan]);

  const getPlanName = () => {
    if (plan === "business") return "Business";
    if (plan === "pro") return "Pro";
    return "Launch";
  };

  const getTitle = () => {
    if (isUpgrade) return "Upgrade Successful!";
    if (isReactivation) return "Welcome Back!";
    return "Subscription Activated!";
  };

  const getDescription = () => {
    if (isUpgrade) return `You've successfully upgraded to the ${getPlanName()} plan.`;
    if (isReactivation) return `Your ${getPlanName()} subscription has been reactivated.`;
    return `Welcome to Solarizer ${getPlanName()}! Your subscription is now active.`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            {status === "loading" && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <CardTitle>Activating Your Subscription</CardTitle>
                <CardDescription>
                  Please wait while we confirm your payment...
                </CardDescription>
              </>
            )}
            
            {status === "success" && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {getTitle()}
                </CardTitle>
                <CardDescription className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "100ms" }}>
                  {getDescription()}
                </CardDescription>
              </>
            )}
            
            {status === "error" && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <CardTitle>Something Went Wrong</CardTitle>
                <CardDescription>
                  We couldn't confirm your subscription. Please contact support if payment was made.
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent className="space-y-4">
            {status === "success" && (
              <>
                {/* Summary */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "200ms" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <span className="font-medium">{getPlanName()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Billing</span>
                    <span className="font-medium capitalize">{period || "Monthly"}</span>
                  </div>
                  {credits && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Credits</span>
                      <span className="font-medium flex items-center gap-1">
                        <Zap className="w-3 h-3 text-primary" />
                        {credits.credits_remaining?.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "300ms" }}>
                  <Button onClick={() => navigate("/dashboard")} className="w-full">
                    Go to Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/settings?tab=subscription")} className="w-full">
                    View Subscription
                  </Button>
                </div>
              </>
            )}
            
            {status === "error" && (
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate("/pricing")} className="w-full">
                  Back to Pricing
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                  Retry
                </Button>
              </div>
            )}
            
            {status === "loading" && (
              <div className="text-center text-sm text-muted-foreground">
                This usually takes a few seconds...
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      <MinimalFooter />
    </div>
  );
};

export default SubscriptionSuccess;
