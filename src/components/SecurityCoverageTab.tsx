import { useMemo, useState } from "react";
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
import { TerminalPanel } from "@/components/ui/TerminalPanel";
import { TerminalDivider } from "@/components/ui/TerminalDivider";

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
        <Shield className="w-10 h-10 md:w-12 md:h-12 mb-4 opacity-50" />
        <p className="text-xs md:text-sm">No coverage data available for this audit.</p>
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
        label: "Excellent Coverage",
      };
    } else if (passPercentage > 70) {
      return {
        icon: Shield,
        color: "text-warning",
        label: "Moderate Coverage",
      };
    } else {
      return {
        icon: ShieldX,
        color: "text-destructive",
        label: "Low Coverage",
      };
    }
  };

  const shieldConfig = getShieldConfig();
  const ShieldIcon = shieldConfig.icon;

  const renderTestItem = (test: CoverageTestDetail, index: number, isFailed: boolean) => {
    const baseClass = isFailed
      ? "bg-[#050505] ring-1 ring-white/[0.03] border-l-2 border-l-destructive"
      : "bg-[#050505] ring-1 ring-white/[0.03] border-l-2 border-l-success";
    const hoverClass = isFailed
      ? "hover:bg-white/[0.02]"
      : "hover:bg-white/[0.02]";
    const IconComponent = isFailed ? XCircle : CheckCircle2;
    const iconColor = isFailed ? "text-destructive" : "text-success";

    return (
      <AccordionItem
        key={`${isFailed ? 'failed' : 'passed'}-${index}`}
        value={`${isFailed ? 'failed' : 'passed'}-${index}`}
        className={cn("rounded-lg overflow-hidden border-0", baseClass)}
      >
        <AccordionTrigger className={cn("px-3 md:px-4 py-2 md:py-3 hover:no-underline", hoverClass)}>
          <div className="flex items-center gap-2 md:gap-3 text-left flex-1 min-w-0">
            <IconComponent className={cn("w-4 h-4 md:w-5 md:h-5 shrink-0", iconColor)} />
            <p className="font-mono text-[12px] font-medium text-foreground line-clamp-2 md:truncate flex-1 min-w-0">
              {test.test_name}
            </p>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 md:px-4 pb-3 md:pb-4">
          {isFailed ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3 pt-2">
              <p className="text-xs md:text-sm text-muted-foreground">
                Vulnerability detected during hypothesis testing.
              </p>
              {test.related_finding_title ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewIssue(test.related_finding_title!)}
                  className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 text-xs md:text-sm h-7 md:h-8"
                >
                  View Issue
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1.5" />
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  Issue Detected
                </span>
              )}
            </div>
          ) : (
            test.proof && (
              <p className="text-xs md:text-sm text-success/80 pt-2">
                {test.proof}
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
      <div className="space-y-4 md:space-y-6">
        {/* Terminal Divider */}
        <TerminalDivider
          label="Security Coverage"
          right={
            <span className={cn("font-mono text-[11px]", shieldConfig.color)}>
              {passPercentage.toFixed(0)}% pass
            </span>
          }
        />

        {/* Summary Card */}
        <TerminalPanel variant="data">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              <ShieldIcon className={cn("w-6 h-6 md:w-8 md:h-8", shieldConfig.color)} />
              <span className={cn("font-mono text-2xl md:text-3xl font-bold", shieldConfig.color)}>
                {passPercentage.toFixed(0)}%
              </span>
            </div>

            <div className="flex-1 space-y-2 md:space-y-3">
              <h3 className="text-lg md:text-xl font-semibold text-foreground">
                {passed}/{total_tests} Tests Passed
              </h3>

              <Progress value={passPercentage} className="h-2 md:h-3" />

              <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                <span className="flex items-center gap-1 md:gap-1.5">
                  <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-success" />
                  {passed} passed
                </span>
                <span className="flex items-center gap-1 md:gap-1.5">
                  <XCircle className="w-3 h-3 md:w-4 md:h-4 text-destructive" />
                  {failed} failed
                </span>
              </div>
            </div>
          </div>
        </TerminalPanel>

        {/* Test Details */}
        <div className="space-y-3 md:space-y-4">
          <h4 className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Hypothesis Test Results
          </h4>

          {/* Failed Tests - Collapsible */}
          {failedTests.length > 0 && (
            <Collapsible defaultOpen={true}>
              <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-destructive uppercase tracking-wider hover:underline mb-2">
                <ChevronDown className="w-3 h-3 transition-transform duration-200 [[data-state=closed]_&]:-rotate-90" />
                Failed Tests ({failedTests.length})
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Accordion type="multiple" className="space-y-1.5 md:space-y-2">
                  {failedTests.map((test, index) => renderTestItem(test, index, true))}
                </Accordion>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Passed Tests - Collapsible */}
          {passedTests.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-success uppercase tracking-wider hover:underline mb-2">
                <ChevronDown className="w-3 h-3 transition-transform duration-200 [[data-state=closed]_&]:-rotate-90" />
                Passed Tests ({passedTests.length})
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Accordion type="multiple" className="space-y-1.5 md:space-y-2">
                  {passedTests.map((test, index) => renderTestItem(test, index, false))}
                </Accordion>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    );
  }

  // Multiple contracts - show grouped view
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Terminal Divider */}
      <TerminalDivider
        label="Security Coverage"
        right={
          <span className={cn("font-mono text-[11px]", shieldConfig.color)}>
            {passPercentage.toFixed(0)}% pass
          </span>
        }
      />

      {/* Summary Card */}
      <TerminalPanel variant="data">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <ShieldIcon className={cn("w-6 h-6 md:w-8 md:h-8", shieldConfig.color)} />
            <span className={cn("font-mono text-2xl md:text-3xl font-bold", shieldConfig.color)}>
              {passPercentage.toFixed(0)}%
            </span>
          </div>

          <div className="flex-1 space-y-2 md:space-y-3">
            <h3 className="text-lg md:text-xl font-semibold text-foreground">
              {passed}/{total_tests} Tests Passed
            </h3>

            <Progress value={passPercentage} className="h-2 md:h-3" />

            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
              <span className="flex items-center gap-1 md:gap-1.5">
                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-success" />
                {passed} passed
              </span>
              <span className="flex items-center gap-1 md:gap-1.5">
                <XCircle className="w-3 h-3 md:w-4 md:h-4 text-destructive" />
                {failed} failed
              </span>
              <span className="flex items-center gap-1 md:gap-1.5">
                <FileCode className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                {contractGroups.length} contracts
              </span>
            </div>
          </div>
        </div>
      </TerminalPanel>

      {/* Contract Accordions */}
      <div className="space-y-3 md:space-y-4">
        <h4 className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Results by Contract
        </h4>

        <Accordion type="multiple" defaultValue={contractGroups.filter(g => g.failedCount > 0).map(g => g.contractName)} className="space-y-2 md:space-y-3">
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
                  "rounded-lg ring-1 ring-white/[0.05] bg-[#050505] overflow-hidden border-0",
                  hasFailures
                    ? "border-l-2 border-l-destructive"
                    : "border-l-2 border-l-success"
                )}
              >
                <AccordionTrigger className={cn(
                  "px-3 md:px-4 py-3 md:py-4 hover:no-underline",
                  "hover:bg-white/[0.02]"
                )}>
                  <div className="flex items-center gap-2 md:gap-3 text-left flex-1 min-w-0">
                    <FileCode className={cn(
                      "w-4 h-4 md:w-5 md:h-5 shrink-0",
                      hasFailures ? "text-destructive" : "text-success"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground font-mono text-xs md:text-sm truncate max-w-[calc(100%-60px)] md:max-w-none">
                        {group.contractName}
                      </p>
                      <div className="flex items-center gap-2 md:gap-3 mt-0.5 md:mt-1 text-[10px] md:text-xs text-muted-foreground">
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
                      "text-sm md:text-lg font-bold font-mono px-2 md:px-3 shrink-0",
                      groupPassPercentage === 100 ? "text-success" : hasFailures ? "text-destructive" : "text-foreground"
                    )}>
                      {groupPassPercentage.toFixed(0)}%
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 md:px-4 pb-3 md:pb-4">
                  <div className="space-y-2 md:space-y-3 pt-2">
                    {/* Failed Tests - Collapsible */}
                    {failedTests.length > 0 && (
                      <Collapsible defaultOpen={true}>
                        <CollapsibleTrigger className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-destructive uppercase tracking-wider hover:underline mb-1.5 md:mb-2">
                          <ChevronDown className="w-2.5 h-2.5 md:w-3 md:h-3 transition-transform duration-200 [[data-state=closed]_&]:-rotate-90" />
                          Failed Tests ({failedTests.length})
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <Accordion type="multiple" className="space-y-1 md:space-y-1.5">
                            {failedTests.map((test, idx) => renderTestItem(test, idx, true))}
                          </Accordion>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Passed Tests - Collapsible */}
                    {passedTests.length > 0 && (
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-success uppercase tracking-wider hover:underline mb-1.5 md:mb-2">
                          <ChevronDown className="w-2.5 h-2.5 md:w-3 md:h-3 transition-transform duration-200 [[data-state=closed]_&]:-rotate-90" />
                          Passed Tests ({passedTests.length})
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <Accordion type="multiple" className="space-y-1 md:space-y-1.5">
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
