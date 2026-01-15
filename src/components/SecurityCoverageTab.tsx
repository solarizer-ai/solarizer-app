import { Shield, ShieldCheck, ShieldX, CheckCircle2, XCircle, ArrowRight, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export interface CoverageTestDetail {
  test_name: string;
  status: "PASSED" | "FAILED";
  proof: string | null;
  file: string;
  related_finding_title: string | null;
}

export interface CoverageData {
  total_tests: number;
  passed: number;
  failed: number;
  details: CoverageTestDetail[];
}

interface SecurityCoverageTabProps {
  coverageData: CoverageData | null;
  onViewIssue: (findingTitle: string) => void;
}

const SecurityCoverageTab = ({ coverageData, onViewIssue }: SecurityCoverageTabProps) => {
  if (!coverageData || !coverageData.total_tests) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Shield className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">No coverage data available for this audit.</p>
      </div>
    );
  }

  const { total_tests, passed, failed, details } = coverageData;
  const passPercentage = total_tests > 0 ? (passed / total_tests) * 100 : 0;
  
  // Determine shield color based on pass rate
  const getShieldConfig = () => {
    if (passPercentage > 90) {
      return {
        icon: ShieldCheck,
        color: "text-success",
        bgColor: "bg-success/10",
        borderColor: "border-success/20",
        label: "Excellent Coverage",
      };
    } else if (passPercentage > 70) {
      return {
        icon: Shield,
        color: "text-warning",
        bgColor: "bg-warning/10",
        borderColor: "border-warning/20",
        label: "Moderate Coverage",
      };
    } else {
      return {
        icon: ShieldX,
        color: "text-destructive",
        bgColor: "bg-destructive/10",
        borderColor: "border-destructive/20",
        label: "Low Coverage",
      };
    }
  };

  const shieldConfig = getShieldConfig();
  const ShieldIcon = shieldConfig.icon;

  // Separate passed and failed tests
  const passedTests = details.filter(t => t.status === "PASSED");
  const failedTests = details.filter(t => t.status === "FAILED");

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className={cn(
        "p-6 rounded-lg border",
        shieldConfig.bgColor,
        shieldConfig.borderColor
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Shield Icon */}
          <div className={cn(
            "flex items-center justify-center w-16 h-16 rounded-full shrink-0",
            shieldConfig.bgColor
          )}>
            <ShieldIcon className={cn("w-8 h-8", shieldConfig.color)} />
          </div>
          
          {/* Score and Progress */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
              <div>
                <h3 className="text-2xl font-semibold text-foreground">
                  {passed}/{total_tests} Tests Passed
                </h3>
                <p className={cn("text-sm", shieldConfig.color)}>
                  {shieldConfig.label}
                </p>
              </div>
              <span className="text-3xl font-bold text-foreground">
                {passPercentage.toFixed(1)}%
              </span>
            </div>
            
            <Progress 
              value={passPercentage} 
              className="h-3"
            />
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-success" />
                {passed} passed
              </span>
              <span className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-destructive" />
                {failed} failed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Details */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Hypothesis Test Results
        </h4>
        
        <Accordion type="multiple" className="space-y-2">
          {/* Failed Tests First */}
          {failedTests.map((test, index) => (
            <AccordionItem 
              key={`failed-${index}`} 
              value={`failed-${index}`}
              className="border border-destructive/20 rounded-lg bg-destructive/5 overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-destructive/10">
                <div className="flex items-center gap-3 text-left flex-1">
                  <XCircle className="w-5 h-5 text-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {test.test_name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <FileCode className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-mono">
                        {test.file}
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Vulnerability detected during hypothesis testing.
                  </p>
                  {test.related_finding_title ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewIssue(test.related_finding_title!)}
                      className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      View Issue
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Issue Detected
                    </span>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}

          {/* Passed Tests */}
          {passedTests.map((test, index) => (
            <AccordionItem 
              key={`passed-${index}`} 
              value={`passed-${index}`}
              className="border border-success/20 rounded-lg bg-success/5 overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-success/10">
                <div className="flex items-center gap-3 text-left flex-1">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {test.test_name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <FileCode className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-mono">
                        {test.file}
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {test.proof && (
                  <p className="text-sm text-success/80 pt-2">
                    ✓ {test.proof}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default SecurityCoverageTab;
