import { format } from "date-fns";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowUpRight, CreditCard, Loader2, Receipt, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useBillingHistory, BillingEvent } from "@/hooks/useBillingHistory";
import { useSubscription } from "@/hooks/useSubscription";
import { formatPlanName } from "@/lib/planNames";

const BillingHistory = () => {
  const navigate = useNavigate();
  const { events, isLoading } = useBillingHistory();
  const { data: subscription } = useSubscription();

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatPlanNameLocal = (plan: string | null) => {
    return formatPlanName(plan);
  };

  const renderEvent = (event: BillingEvent, index: number) => {
    if (event.type === 'power_up') {
      return (
        <div
          key={`power-up-${event.data.id}`}
          className="flex items-center justify-between p-4 border-b border-border last:border-0"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Power-Up Purchase</p>
              <p className="text-sm text-muted-foreground">
                +{event.data.nloc_amount.toLocaleString()} nLOC credits
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-foreground">
              {formatCurrency(event.data.price_cents)}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(event.date), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      );
    }

    if (event.type === 'subscription_change') {
      return (
        <div
          key={`sub-change-${event.data.id}`}
          className="flex items-center justify-between p-4 border-b border-border last:border-0"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-accent/50">
              <ArrowUpRight className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Plan Change</p>
              <p className="text-sm text-muted-foreground">
                {formatPlanName(event.data.previous_plan)} → {formatPlanName(event.data.new_plan)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={event.data.new_plan === 'pro' ? 'default' : 'secondary'}>
              {formatPlanName(event.data.new_plan)}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(event.date), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/settings')}
            className="gap-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>

          {/* Page Header */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Billing History</h1>
              <p className="text-sm text-muted-foreground">
                View your past purchases and subscription changes
              </p>
            </div>
          </div>

          {/* Current Plan Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant={subscription?.plan === 'pro' ? 'default' : 'secondary'} className="text-sm">
                    {formatPlanName(subscription?.plan || 'starter')}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Status: {subscription?.status || 'active'}
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/pricing')}>
                  Manage Plan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                All your power-up purchases and plan changes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No billing history yet</p>
                  <p className="text-sm text-muted-foreground/70">
                    Your purchases and plan changes will appear here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {events.map((event, index) => renderEvent(event, index))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Stats */}
          {events.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {events.filter(e => e.type === 'power_up').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Power-Ups Purchased</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(
                        events
                          .filter(e => e.type === 'power_up')
                          .reduce((sum, e) => sum + (e.data as any).price_cents, 0)
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BillingHistory;
