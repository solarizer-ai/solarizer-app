import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, User, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useBillingProfile } from "@/hooks/useBillingProfile";
import type { BillingData } from "@/types/billing";

const billingSchema = z.object({
  phone: z.string().min(5, "Phone number is required").max(20),
  address_line1: z.string().min(1, "Address is required").max(200),
  address_line2: z.string().max(200).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  postal_code: z.string().min(1, "Postal code is required").max(20),
  country: z.string().min(2, "Country is required").max(2),
  use_different_billing_address: z.boolean().default(false),
  billing_address_line1: z.string().max(200).optional(),
  billing_address_line2: z.string().max(200).optional(),
  billing_city: z.string().max(100).optional(),
  billing_state: z.string().max(100).optional(),
  billing_postal_code: z.string().max(20).optional(),
  billing_country: z.string().max(2).optional(),
  tax_id: z.string().max(50).optional(),
  company_name: z.string().max(200).optional(),
}).refine((data) => {
  if (data.use_different_billing_address) {
    return data.billing_address_line1 && data.billing_city && 
           data.billing_state && data.billing_postal_code;
  }
  return true;
}, {
  message: "Billing address fields are required when using different billing address",
  path: ["billing_address_line1"],
});

type BillingFormData = z.infer<typeof billingSchema>;

interface BillingInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: BillingData) => void;
  isLoading?: boolean;
}

export function BillingInfoModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading: externalLoading = false,
}: BillingInfoModalProps) {
  const { user } = useAuth();
  const { billingProfile, isLoading: profileLoading, saveBillingProfile, isSaving } = useBillingProfile();
  const [showBillingAddress, setShowBillingAddress] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BillingFormData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      country: "US",
      billing_country: "US",
      use_different_billing_address: false,
    },
  });

  const useDifferentBilling = watch("use_different_billing_address");

  // Pre-fill form when profile loads
  useEffect(() => {
    if (billingProfile) {
      reset({
        phone: billingProfile.phone || "",
        address_line1: billingProfile.address_line1 || "",
        address_line2: billingProfile.address_line2 || "",
        city: billingProfile.city || "",
        state: billingProfile.state || "",
        postal_code: billingProfile.postal_code || "",
        country: billingProfile.country || "US",
        use_different_billing_address: billingProfile.use_different_billing_address || false,
        billing_address_line1: billingProfile.billing_address_line1 || "",
        billing_address_line2: billingProfile.billing_address_line2 || "",
        billing_city: billingProfile.billing_city || "",
        billing_state: billingProfile.billing_state || "",
        billing_postal_code: billingProfile.billing_postal_code || "",
        billing_country: billingProfile.billing_country || "US",
        tax_id: billingProfile.tax_id || "",
        company_name: billingProfile.company_name || "",
      });
      setShowBillingAddress(billingProfile.use_different_billing_address || false);
    }
  }, [billingProfile, reset]);

  useEffect(() => {
    setShowBillingAddress(useDifferentBilling);
  }, [useDifferentBilling]);

  const onSubmit = async (data: BillingFormData) => {
    try {
      // Save to database
      await saveBillingProfile(data as BillingData);
      // Pass to parent
      onConfirm(data as BillingData);
    } catch (error) {
      console.error("Error saving billing profile:", error);
    }
  };

  const isFormLoading = profileLoading || isSaving || externalLoading;
  const hasExistingProfile = !!billingProfile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {hasExistingProfile ? "Confirm Billing Details" : "Enter Billing Details"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {hasExistingProfile 
              ? "Confirm or update your billing information."
              : "Provide your billing information to continue."
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)] px-4 sm:px-6">
          {profileLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-4">
              {/* Account Information (read-only) */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account</h4>
                <div className="grid gap-1.5 p-3 rounded-lg bg-muted/50">
                  <div className="flex justify-between items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground shrink-0">Name</span>
                    <span className="text-xs font-medium truncate">{user?.user_metadata?.display_name || user?.email?.split('@')[0] || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground shrink-0">Email</span>
                    <span className="text-xs font-medium truncate">{user?.email || "—"}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contact</h4>
                <div>
                  <Label htmlFor="phone" className="text-sm">Phone *</Label>
                  <Input
                    id="phone"
                    placeholder="+1 555-123-4567"
                    {...register("phone")}
                    className={`w-full ${errors.phone ? "border-destructive" : ""}`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Primary Address */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Address</h4>
                <div className="grid gap-2">
                  <div>
                    <Label htmlFor="address_line1" className="text-sm">Address Line 1 *</Label>
                    <Input
                      id="address_line1"
                      placeholder="123 Main Street"
                      {...register("address_line1")}
                      className={`w-full ${errors.address_line1 ? "border-destructive" : ""}`}
                    />
                    {errors.address_line1 && (
                      <p className="text-xs text-destructive mt-1">{errors.address_line1.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address_line2" className="text-sm">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      placeholder="Suite 100 (optional)"
                      {...register("address_line2")}
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="min-w-0">
                      <Label htmlFor="city" className="text-sm">City *</Label>
                      <Input
                        id="city"
                        placeholder="New York"
                        {...register("city")}
                        className={`w-full ${errors.city ? "border-destructive" : ""}`}
                      />
                      {errors.city && (
                        <p className="text-xs text-destructive mt-1">{errors.city.message}</p>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Label htmlFor="state" className="text-sm">State *</Label>
                      <Input
                        id="state"
                        placeholder="NY"
                        {...register("state")}
                        className={`w-full ${errors.state ? "border-destructive" : ""}`}
                      />
                      {errors.state && (
                        <p className="text-xs text-destructive mt-1">{errors.state.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="min-w-0">
                      <Label htmlFor="postal_code" className="text-sm">Postal Code *</Label>
                      <Input
                        id="postal_code"
                        placeholder="10001"
                        {...register("postal_code")}
                        className={`w-full ${errors.postal_code ? "border-destructive" : ""}`}
                      />
                      {errors.postal_code && (
                        <p className="text-xs text-destructive mt-1">{errors.postal_code.message}</p>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Label htmlFor="country" className="text-sm">Country *</Label>
                      <Input
                        id="country"
                        placeholder="US"
                        maxLength={2}
                        {...register("country")}
                        className={`w-full ${errors.country ? "border-destructive" : ""}`}
                      />
                      {errors.country && (
                        <p className="text-xs text-destructive mt-1">{errors.country.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Different Billing Address Toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use_different_billing_address"
                  checked={showBillingAddress}
                  onCheckedChange={(checked) => {
                    setShowBillingAddress(!!checked);
                    setValue("use_different_billing_address", !!checked);
                  }}
                />
                <Label htmlFor="use_different_billing_address" className="cursor-pointer text-sm">
                  Use different billing address
                </Label>
              </div>

              {/* Billing Address (conditional) */}
              {showBillingAddress && (
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Billing Address</h4>
                  <div className="grid gap-2">
                    <div>
                      <Label htmlFor="billing_address_line1" className="text-sm">Address Line 1 *</Label>
                      <Input
                        id="billing_address_line1"
                        placeholder="456 Corporate Blvd"
                        {...register("billing_address_line1")}
                        className={`w-full ${errors.billing_address_line1 ? "border-destructive" : ""}`}
                      />
                      {errors.billing_address_line1 && (
                        <p className="text-xs text-destructive mt-1">{errors.billing_address_line1.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="billing_address_line2" className="text-sm">Address Line 2</Label>
                      <Input
                        id="billing_address_line2"
                        placeholder="Floor 10 (optional)"
                        {...register("billing_address_line2")}
                        className="w-full"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="min-w-0">
                        <Label htmlFor="billing_city" className="text-sm">City *</Label>
                        <Input
                          id="billing_city"
                          placeholder="Chicago"
                          {...register("billing_city")}
                          className="w-full"
                        />
                      </div>
                      <div className="min-w-0">
                        <Label htmlFor="billing_state" className="text-sm">State *</Label>
                        <Input
                          id="billing_state"
                          placeholder="IL"
                          {...register("billing_state")}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="min-w-0">
                        <Label htmlFor="billing_postal_code" className="text-sm">Postal Code *</Label>
                        <Input
                          id="billing_postal_code"
                          placeholder="60601"
                          {...register("billing_postal_code")}
                          className="w-full"
                        />
                      </div>
                      <div className="min-w-0">
                        <Label htmlFor="billing_country" className="text-sm">Country *</Label>
                        <Input
                          id="billing_country"
                          placeholder="US"
                          maxLength={2}
                          {...register("billing_country")}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Business Details (Optional) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business (Optional)</h4>
                </div>
                <div className="grid gap-2">
                  <div>
                    <Label htmlFor="company_name" className="text-sm">Company Name</Label>
                    <Input
                      id="company_name"
                      placeholder="Acme Corporation"
                      {...register("company_name")}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax_id" className="text-sm">Tax ID (GST/VAT)</Label>
                    <Input
                      id="tax_id"
                      placeholder="12-3456789"
                      {...register("tax_id")}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}
        </ScrollArea>

        {/* Actions - Fixed at bottom */}
        <div className="flex gap-3 p-4 sm:p-6 pt-0 border-t border-border mt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isFormLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="billing-form"
            className="flex-1"
            disabled={isFormLoading}
            onClick={handleSubmit(onSubmit)}
          >
            {isFormLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm & Pay"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
