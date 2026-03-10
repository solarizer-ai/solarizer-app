import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import solarizerLogo from "@/assets/solarizer-logo.png";
import { Rocket, KeyRound } from "lucide-react";
import { TrialActivationModal } from "@/components/TrialActivationModal";
import { TRIAL_SIGNUP_ENABLED } from "@/config/features";

interface WelcomeGreetingProps {
  displayName: string | null;
  userId: string;
  onComplete: () => void;
}

const WelcomeGreeting = ({ displayName, userId, onComplete }: WelcomeGreetingProps) => {
  const [dismissing, setDismissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);

  const handleGetStarted = async () => {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", userId);

    setDismissing(true);
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  const name = displayName || "there";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-lg transition-opacity duration-400 ${
        dismissing ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`relative mx-4 flex max-w-md flex-col items-center gap-6 rounded-2xl border border-border bg-card p-8 text-center shadow-2xl transition-all duration-400 ${
          dismissing ? "scale-95 opacity-0" : "animate-in fade-in zoom-in-95 duration-500"
        }`}
      >
        <img
          src={solarizerLogo}
          alt="Solarizer"
          className="h-14 w-auto"
          decoding="async"
        />

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {name !== "there" ? (
              <><span className="text-primary">{name}</span>, welcome.</>
            ) : (
              <>Welcome.</>
            )}
            {" "}Your security team just got an upgrade.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Seven AI-driven audit phases work your contracts simultaneously
            — delivering line-accurate findings with fix suggestions in minutes.
          </p>
        </div>

        <Button
          onClick={handleGetStarted}
          disabled={saving}
          size="lg"
          className="gap-2 w-full"
        >
          <Rocket className="w-4 h-4" />
          {saving ? "Setting up…" : "Get Started"}
        </Button>

        {TRIAL_SIGNUP_ENABLED && (
          <button
            type="button"
            onClick={() => setShowTrialModal(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <KeyRound className="w-3 h-3" />
            Have a trial code?
          </button>
        )}

        <TrialActivationModal open={showTrialModal} onOpenChange={setShowTrialModal} />
      </div>
    </div>
  );
};

export default WelcomeGreeting;
