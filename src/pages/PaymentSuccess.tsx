import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, CreditCard, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { invokeWithRefresh } from "@/lib/sessionRefresh";

interface PaymentStatus {
  success: boolean;
  status: string;
  orderType: string;
  plan?: string;
  billingPeriod?: string;
  creditsAmount?: number;
  amountCents: number;
  creditsRemaining: number;
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const metaTagRef = useRef<HTMLMetaElement | null>(null);

  const orderId = searchParams.get("order_id");

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

  useEffect(() => {
    if (!orderId) {
      navigate("/pricing");
      return;
    }

    const verifyPayment = async () => {
      try {
        // Use invokeWithRefresh with order_id in body
        const { data: result, error } = await invokeWithRefresh<PaymentStatus>(
          "cashfree-verify-payment",
          { body: { order_id: orderId } }
        );

        if (error) {
          console.error("Verification error:", error);
          setIsLoading(false);
          return;
        }

        if (result) {
          setPaymentStatus(result);

          // If still pending and we haven't polled too many times, poll again
          if (result.status === "pending" && pollCount < 10) {
            setTimeout(() => {
              setPollCount((c) => c + 1);
            }, 2000);
          } else {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Verification error:", error);
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [orderId, navigate, pollCount]);

  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getPlanDisplayName = (plan?: string) => {
    if (!plan) return "";
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  if (isLoading && !paymentStatus) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Verifying your payment...</p>
              <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const isSuccess = paymentStatus?.success || paymentStatus?.status === "paid";
  const isPending = paymentStatus?.status === "pending" || paymentStatus?.status === "processing";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {isPending ? (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                <CardTitle className="text-2xl">Processing Payment</CardTitle>
                <CardDescription>
                  Your payment is being processed. This page will update automatically.
                </CardDescription>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                <CardTitle className="text-2xl">Payment Successful!</CardTitle>
                <CardDescription>
                  Thank you for your purchase. Your account has been updated.
                </CardDescription>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <CardTitle className="text-2xl text-destructive">Payment Failed</CardTitle>
                <CardDescription>
                  Something went wrong with your payment. Please try again.
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {paymentStatus && isSuccess && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  {paymentStatus.orderType === "subscription" ? (
                    <CreditCard className="h-4 w-4" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {paymentStatus.orderType === "subscription" ? "Subscription" : "Power-up Credits"}
                </div>

                {paymentStatus.orderType === "subscription" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium">
                        {getPlanDisplayName(paymentStatus.plan)} ({paymentStatus.billingPeriod})
                      </span>
                    </div>
                  </>
                )}

                {paymentStatus.orderType === "power_up" && paymentStatus.creditsAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credits Added</span>
                    <span className="font-medium">{paymentStatus.creditsAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium">{formatAmount(paymentStatus.amountCents)}</span>
                </div>

                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="text-muted-foreground">Current Credit Balance</span>
                  <span className="font-bold text-primary">
                    {paymentStatus.creditsRemaining.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate("/audits")} className="w-full">
                Go to Dashboard
              </Button>
              {!isSuccess && !isPending && (
                <Button variant="outline" onClick={() => navigate("/pricing")} className="w-full">
                  Back to Pricing
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
