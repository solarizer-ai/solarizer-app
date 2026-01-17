import { useMemo } from "react";
import { Shield, ShieldCheck, ShieldX, CheckCircle2, XCircle, ArrowRight, FileCode, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

interface ContractGroup {
  contractName: string;
  tests: CoverageTestDetail[];
  passedCount: number;
  failedCount: number;
}

const SecurityCoverageTab = ({ coverageData, onViewIssue }: SecurityCoverageTabProps) => {
  // Group tests by contract file
  const contractGroups = useMemo(() => {
    if (!coverageData?.details?.length) return [];

    const groupMap = new Map<string, ContractGroup>();

    coverageData.details.forEach((test) => {
      const contractName = test.file || "Unknown";
      
      if (!groupMap.has(contractName)) {
        groupMap.set(contractName, {
          contractName,
          tests: [],
          passedCount: 0,
          failedCount: 0,
        });
      }

      const group = groupMap.get(contractName)!;
      group.tests.push(test);
      if (test.status === "PASSED") {
        group.passedCount++;
      } else {
        group.failedCount++;
      }
    });

    // Sort by failed count descending (contracts with most failures first)
    return Array.from(groupMap.values()).sort((a, b) => b.failedCount - a.failedCount);
  }, [coverageData]);

  if (!coverageData || !coverageData.total_tests) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Shield className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">No coverage data available for this audit.</p>
      </div>
    );
  }

  const { total_tests, passed, failed } = coverageData;
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

  const renderTestItem = (test: CoverageTestDetail, index: number, isFailed: boolean) => {
    const baseClass = isFailed 
      ? "border-destructive/20 bg-destructive/5" 
      : "border-success/20 bg-success/5";
    const hoverClass = isFailed 
      ? "hover:bg-destructive/10" 
      : "hover:bg-success/10";
    const IconComponent = isFailed ? XCircle : CheckCircle2;
    const iconColor = isFailed ? "text-destructive" : "text-success";

    return (
      <AccordionItem 
        key={`${isFailed ? 'failed' : 'passed'}-${index}`} 
        value={`${isFailed ? 'failed' : 'passed'}-${index}`}
        className={cn("border rounded-lg overflow-hidden", baseClass)}
      >
        <AccordionTrigger className={cn("px-4 py-3 hover:no-underline", hoverClass)}>
          <div className="flex items-center gap-3 text-left flex-1">
            <IconComponent className={cn("w-5 h-5 shrink-0", iconColor)} />
            <p className="text-sm font-medium text-foreground line-clamp-2 sm:truncate flex-1">
              {test.test_name}
            </p>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          {isFailed ? (
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
          ) : (
            test.proof && (
              <p className="text-sm text-success/80 pt-2">
                ✓ {test.proof}
              </p>
            )
          )}
        </AccordionContent>
      </AccordionItem>
    );
  };

  // If only one contract, show the original flat view
  if (contractGroups.length <= 1) {
    const passedTests = coverageData.details.filter(t => t.status === "PASSED");
    const failedTests = coverageData.details.filter(t => t.status === "FAILED");

    return (
      <div className="space-y-6">
        {/* Summary Card */}
        <div className={cn(
          "p-6 rounded-lg border",
          shieldConfig.bgColor,
          shieldConfig.borderColor
        )}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className={cn(
                "flex items-center justify-center w-16 h-16 rounded-full",
                shieldConfig.bgColor
              )}>
                <ShieldIcon className={cn("w-8 h-8", shieldConfig.color)} />
              </div>
              <span className={cn("text-3xl font-bold", shieldConfig.color)}>
                {passPercentage.toFixed(0)}%
              </span>
            </div>
            
            <div className="flex-1 space-y-3">
              <h3 className="text-xl font-semibold text-foreground">
                {passed}/{total_tests} Tests Passed
              </h3>
              
              <Progress value={passPercentage} className="h-3" />
              
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
            {failedTests.map((test, index) => renderTestItem(test, index, true))}
            {passedTests.map((test, index) => renderTestItem(test, index, false))}
          </Accordion>
        </div>
      </div>
    );
  }

  // Multiple contracts - show grouped view
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className={cn(
        "p-6 rounded-lg border",
        shieldConfig.bgColor,
        shieldConfig.borderColor
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className={cn(
              "flex items-center justify-center w-16 h-16 rounded-full",
              shieldConfig.bgColor
            )}>
              <ShieldIcon className={cn("w-8 h-8", shieldConfig.color)} />
            </div>
            <span className={cn("text-3xl font-bold", shieldConfig.color)}>
              {passPercentage.toFixed(0)}%
            </span>
          </div>
          
          <div className="flex-1 space-y-3">
            <h3 className="text-xl font-semibold text-foreground">
              {passed}/{total_tests} Tests Passed
            </h3>
            
            <Progress value={passPercentage} className="h-3" />
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-success" />
                {passed} passed
              </span>
              <span className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-destructive" />
                {failed} failed
              </span>
              <span className="flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-muted-foreground" />
                {contractGroups.length} contracts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Accordions */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Results by Contract
        </h4>
        
        <Accordion type="multiple" defaultValue={contractGroups.filter(g => g.failedCount > 0).map(g => g.contractName)} className="space-y-3">
          {contractGroups.map((group) => {
            const groupPassPercentage = group.tests.length > 0 
              ? (group.passedCount / group.tests.length) * 100 
              : 0;
            const hasFailures = group.failedCount > 0;
            const failedTests = group.tests.filter(t => t.status === "FAILED");
            const passedTests = group.tests.filter(t => t.status === "PASSED");

            return (
              <AccordionItem 
                key={group.contractName} 
                value={group.contractName}
                className={cn(
                  "border rounded-lg overflow-hidden",
                  hasFailures 
                    ? "border-destructive/30 bg-destructive/5" 
                    : "border-success/30 bg-success/5"
                )}
              >
                <AccordionTrigger className={cn(
                  "px-4 py-4 hover:no-underline",
                  hasFailures ? "hover:bg-destructive/10" : "hover:bg-success/10"
                )}>
                  <div className="flex items-center gap-3 text-left flex-1">
                    <FileCode className={cn(
                      "w-5 h-5 shrink-0",
                      hasFailures ? "text-destructive" : "text-success"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground font-mono text-sm truncate">
                        {group.contractName}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className={cn(
                          "font-medium",
                          groupPassPercentage === 100 ? "text-success" : hasFailures ? "text-destructive" : "text-foreground"
                        )}>
                          {group.passedCount}/{group.tests.length} passed
                        </span>
                        {hasFailures && (
                          <span className="text-destructive">
                            {group.failedCount} {group.failedCount === 1 ? "issue" : "issues"}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      "text-lg font-bold px-3",
                      groupPassPercentage === 100 ? "text-success" : hasFailures ? "text-destructive" : "text-foreground"
                    )}>
                      {groupPassPercentage.toFixed(0)}%
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3 pt-2">
                    {/* Failed Tests */}
                    {failedTests.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-destructive uppercase tracking-wider">
                          Failed Tests ({failedTests.length})
                        </p>
                        <Accordion type="multiple" className="space-y-1.5">
                          {failedTests.map((test, idx) => renderTestItem(test, idx, true))}
                        </Accordion>
                      </div>
                    )}

                    {/* Passed Tests - Collapsible */}
                    {passedTests.length > 0 && (
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-success uppercase tracking-wider hover:underline">
                          <ChevronDown className="w-3 h-3" />
                          Passed Tests ({passedTests.length})
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2">
                          <Accordion type="multiple" className="space-y-1.5">
                            {passedTests.map((test, idx) => renderTestItem(test, idx, false))}
                          </Accordion>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
};

export default SecurityCoverageTab;