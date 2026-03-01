import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, CreditCard, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { invokeWithRefresh } from "@/lib/sessionRefresh";
import { formatPlanName } from "@/lib/planNames";

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
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const metaTagRef = useRef<HTMLMetaElement | null>(null);
  const verificationAttempted = useRef(false);

  // Extract Payment Link callback parameters
  const razorpayPaymentId = searchParams.get("razorpay_payment_id");
  const razorpayPaymentLinkId = searchParams.get("razorpay_payment_link_id");
  const razorpayPaymentLinkReferenceId = searchParams.get("razorpay_payment_link_reference_id");
  const razorpayPaymentLinkStatus = searchParams.get("razorpay_payment_link_status");
  const razorpaySignature = searchParams.get("razorpay_signature");

  // Fallback for legacy order_id parameter
  const legacyOrderId = searchParams.get("order_id");

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

  // L2: Clear signature parameters from URL after extraction
  useEffect(() => {
    if (razorpaySignature) {
      window.history.replaceState({}, "", "/payment-success");
    }
  }, [razorpaySignature]);

  useEffect(() => {
    // Prevent double verification
    if (verificationAttempted.current) return;

    // Check if we have Payment Link callback parameters
    const hasPaymentLinkParams = razorpayPaymentId && razorpayPaymentLinkId && 
                                  razorpayPaymentLinkReferenceId && razorpaySignature;

    if (!hasPaymentLinkParams && !legacyOrderId) {
      navigate("/pricing");
      return;
    }

    verificationAttempted.current = true;

    const verifyPayment = async () => {
      try {
        if (hasPaymentLinkParams) {
          // Payment Links verification
          const { data: result, error } = await invokeWithRefresh<PaymentStatus>(
            "razorpay-verify-payment",
            { 
              body: { 
                razorpay_payment_id: razorpayPaymentId,
                razorpay_payment_link_id: razorpayPaymentLinkId,
                razorpay_payment_link_reference_id: razorpayPaymentLinkReferenceId,
                razorpay_payment_link_status: razorpayPaymentLinkStatus || "paid",
                razorpay_signature: razorpaySignature,
              } 
            }
          );

          if (error) {
            console.error("Verification error:", error);
            setError("Payment verification failed. Please contact support if you were charged.");
            setIsLoading(false);
            return;
          }

          if (result) {
            setPaymentStatus(result);
            setIsLoading(false);
          }
        } else if (legacyOrderId) {
          // Legacy order_id based polling (fallback)
          const { data: result, error } = await invokeWithRefresh<PaymentStatus>(
            "razorpay-verify-payment",
            { body: { order_id: legacyOrderId } }
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
              verificationAttempted.current = false;
              setTimeout(() => {
                setPollCount((c) => c + 1);
              }, 2000);
            } else {
              setIsLoading(false);
            }
          } else {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Verification error:", error);
        setError("An unexpected error occurred during verification.");
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [
    razorpayPaymentId, 
    razorpayPaymentLinkId, 
    razorpayPaymentLinkReferenceId, 
    razorpayPaymentLinkStatus,
    razorpaySignature,
    legacyOrderId,
    navigate, 
    pollCount
  ]);

  const formatAmount = (cents?: number | null) => {
    if (cents == null || isNaN(cents)) return null;
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getTitle = () => {
    if (paymentStatus?.orderType === "upgrade") return "Upgrade Successful!";
    if (paymentStatus?.orderType === "subscription") return "Subscription Activated!";
    return "Payment Successful!";
  };

  const getDescription = () => {
    if (paymentStatus?.orderType === "upgrade") {
      return `You've been upgraded to the ${getPlanDisplayName(paymentStatus.plan)} plan.`;
    }
    if (paymentStatus?.orderType === "subscription") {
      return `Your ${getPlanDisplayName(paymentStatus.plan)} plan is now active.`;
    }
    return "Thank you for your purchase. Your account has been updated.";
  };

  const getPlanDisplayName = (plan?: string) => {
    return formatPlanName(plan || null);
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
  const hasError = error || (!isSuccess && !isPending);

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
                <CardTitle className="text-2xl">{getTitle()}</CardTitle>
                <CardDescription>
                  {getDescription()}
                </CardDescription>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <CardTitle className="text-2xl text-destructive">Payment Failed</CardTitle>
                <CardDescription>
                  {error || "Something went wrong with your payment. Please try again."}
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {paymentStatus && isSuccess && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  {paymentStatus.orderType === "subscription" || paymentStatus.orderType === "upgrade" ? (
                    <CreditCard className="h-4 w-4" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {paymentStatus.orderType === "subscription" ? "Subscription" : 
                   paymentStatus.orderType === "upgrade" ? "Plan Upgrade" : "Credits"}
                </div>

                {(paymentStatus.orderType === "subscription" || paymentStatus.orderType === "upgrade") && paymentStatus.plan && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">
                      {getPlanDisplayName(paymentStatus.plan)}
                      {paymentStatus.billingPeriod ? ` (${paymentStatus.billingPeriod})` : ""}
                    </span>
                  </div>
                )}

                {paymentStatus.orderType === "power_up" && paymentStatus.creditsAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credits Added</span>
                    <span className="font-medium">{paymentStatus.creditsAmount.toLocaleString()}</span>
                  </div>
                )}

                {(() => {
                  const formatted = formatAmount(paymentStatus.amountCents);
                  return formatted ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Paid</span>
                      <span className="font-medium">{formatted}</span>
                    </div>
                  ) : null;
                })()}

                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="text-muted-foreground">Current Credit Balance</span>
                  <span className="font-bold text-primary">
                    {paymentStatus.creditsRemaining.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate("/dashboard")} className="w-full">
                Go to Dashboard
              </Button>
              {hasError && (
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
