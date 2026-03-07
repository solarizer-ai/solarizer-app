import { ArrowLeft, ArrowRight, Code2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LANGUAGE_CONFIGS, type FrontendLanguageConfig } from "@/lib/languageConfig";

interface LanguageSelectionStepProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

const LANGUAGE_CARDS: Array<{
  id: string;
  config: FrontendLanguageConfig;
  description: string;
  tags: string[];
}> = [
  {
    id: 'solidity',
    config: LANGUAGE_CONFIGS.solidity,
    description: 'Ethereum, Polygon, Arbitrum, and other EVM-compatible smart contracts',
    tags: ['ERC-20', 'ERC-721', 'DeFi', 'EVM'],
  },
  {
    id: 'rust-solana',
    config: LANGUAGE_CONFIGS['rust-solana'],
    description: 'Solana programs built with Anchor or native Solana SDK',
    tags: ['Anchor', 'SPL', 'CPI', 'PDA'],
  },
];

const LanguageSelectionStep = ({ selectedLanguage, onLanguageChange, onBack, onContinue }: LanguageSelectionStepProps) => {
  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Code2 className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Select language</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose the language of the source code you want to audit</p>
        </div>
      </div>

      <div className="grid gap-4">
        {LANGUAGE_CARDS.map((card) => (
          <button
            key={card.id}
            onClick={() => onLanguageChange(card.id)}
            className={cn(
              "w-full text-left p-5 rounded-xl border-2 transition-all",
              "hover:border-primary/50 hover:bg-accent/50",
              selectedLanguage === card.id
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-card"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl flex-shrink-0 mt-0.5">{card.config.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">{card.config.displayName}</h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    ({card.config.extensions.join(', ')})
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {card.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {selectedLanguage === card.id && (
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />Back
        </Button>
        <Button onClick={onContinue} disabled={!selectedLanguage} className="gap-2">
          Continue<ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default LanguageSelectionStep;
