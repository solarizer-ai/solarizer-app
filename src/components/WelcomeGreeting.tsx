import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import solarizerLogo from "@/assets/solarizer-logo.png";
import { Rocket } from "lucide-react";

interface WelcomeGreetingProps {
  displayName: string | null;
  userId: string;
  onComplete: () => void;
}

const WelcomeGreeting = ({ displayName, userId, onComplete }: WelcomeGreetingProps) => {
  const [dismissing, setDismissing] = useState(false);
  const [saving, setSaving] = useState(false);

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
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You just upgraded your security stack. Solarizer runs five AI models
            against your contracts simultaneously — the kind of coverage that
            used to require an entire audit firm.
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
      </div>
    </div>
  );
};

export default WelcomeGreeting;
