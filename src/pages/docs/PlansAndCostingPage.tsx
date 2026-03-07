import {
  Coins,
  Layers,
  FileStack,
  Calculator,
  Zap,
  AlertTriangle,
  ListChecks,
  User,
  Users,
} from "lucide-react";
import { Code, DocTable, Yes } from "@/components/docs/DocHelpers";

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function PlansAndCostingPage() {
  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------- */}
      {/*  Page header                                                */}
      {/* ---------------------------------------------------------- */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Plans &amp; Costing
        </h1>
        <p className="text-muted-foreground mt-1">
          Understand credits, plan features, analysis depth, and real-world
          examples.
        </p>
      </div>

      {/* ---------------------------------------------------------- */}
      {/*  1. The Credit System                                       */}
      {/* ---------------------------------------------------------- */}
      <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">The Credit System</h2>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground/60">
          <p>
            Credits are the currency of Solarizer audits. Your Inferno plan
            includes <strong className="text-foreground">500 credits monthly</strong>, and unused
            credits carry forward indefinitely — they never expire and never
            reset.
          </p>
          <p>
            The base rate is straightforward:{" "}
            <strong className="text-foreground">1 credit = 1 nLOC</strong> (normalized lines of
            code). But the final cost depends on two factors:{" "}
            <strong className="text-foreground">contract complexity</strong> and{" "}
            <strong className="text-foreground">file role</strong>.
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/*  2. Complexity Multipliers                                  */}
      {/* ---------------------------------------------------------- */}
      <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Complexity Multipliers</h2>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground/60">
          <DocTable
            headers={["Complexity", "Label", "Multiplier", "What it means"]}
            rows={[
              [
                <strong className="text-foreground">L1</strong>,
                "Standard",
                "0.8x",
                "ERC-20 tokens, basic vaults, simple access control. Well-understood patterns with established security guarantees.",
              ],
              [
                <strong className="text-foreground">L2</strong>,
                "Complex",
                "1.0x",
                "AMM pools, lending protocols, staking mechanisms. Multiple interacting state variables and external calls.",
              ],
              [
                <strong className="text-foreground">L3</strong>,
                "Novel",
                "1.2x",
                "Custom bonding curves, novel oracle designs, experimental governance. Patterns without established audit precedent.",
              ],
            ]}
          />
          <p>
            Solarizer classifies each file automatically during the audit
            wizard. You can see the classification and its reasoning before
            confirming costs.
          </p>
          <p>
            <strong className="text-foreground">Why complexity matters:</strong> L1 contracts cost{" "}
            <em>less</em> than baseline because the engine can verify them
            faster. L3 contracts cost <em>more</em> because the engine runs
            extended analysis passes to cover novel attack surfaces.
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/*  3. Context Files                                           */}
      {/* ---------------------------------------------------------- */}
      <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileStack className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Context Files: 85% Discount</h2>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground/60">
          <p>When you select files during an audit, you choose two categories:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-foreground">Scope files</strong> — the contracts being
              audited. Full credit rate applies.
            </li>
            <li>
              <strong className="text-foreground">Context files</strong> — interfaces, libraries,
              and dependencies that help the engine understand your codebase.
              Charged at{" "}
              <strong className="text-foreground">15% of nLOC</strong> (0.15x rate).
            </li>
          </ul>
          <p>
            A 1,000 nLOC OpenZeppelin import used as context costs only{" "}
            <strong className="text-foreground">150 credits</strong> instead of 1,000. We
            encourage including context files — they dramatically improve
            finding accuracy without draining your balance.
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/*  4. Cost Formula                                            */}
      {/* ---------------------------------------------------------- */}
      <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">How Your Audit Cost Is Calculated</h2>
        </div>
        <div className="space-y-4 text-sm text-muted-foreground/60">
          <pre className="bg-[hsl(0_0%_4%)] border border-border/10 rounded-lg p-4 text-xs font-mono overflow-x-auto">
{`Audit Cost =
  Sum of (Scope File nLOC x Complexity Multiplier)
  + Sum of (Context File nLOC x 0.15)`}
          </pre>

          <p className="font-medium text-foreground">
            Worked example — "DeFi Lending Protocol" audit:
          </p>
          <DocTable
            headers={["File", "Role", "nLOC", "Complexity", "Rate", "Credits"]}
            rows={[
              ["LendingPool.sol", "Scope", "420", "L2", "1.0x", "420"],
              ["InterestModel.sol", "Scope", "180", "L3", "1.2x", "216"],
              ["PriceOracle.sol", "Scope", "95", "L1", "0.8x", "76"],
              ["IERC20.sol", "Context", "45", "\u2014", "0.15x", "7"],
              ["SafeMath.sol", "Context", "120", "\u2014", "0.15x", "18"],
              [
                <strong className="text-foreground">Total</strong>,
                "",
                <strong className="text-foreground">860</strong>,
                "",
                "",
                <strong className="text-foreground">737</strong>,
              ],
            ]}
          />
          <p>
            With your plan's included credits, this audit costs credits from your balance —
            or zero extra if you've accumulated credits over multiple months.
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/*  5. Inferno Plan                                            */}
      {/* ---------------------------------------------------------- */}
      <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Inferno Plan</h2>
          <p className="text-sm text-muted-foreground/60 mt-1">
            One plan with full access to every feature
          </p>
        </div>
        <DocTable
          headers={["Feature", "Inferno ($99/mo)"]}
          rows={[
            [<strong className="text-foreground">Monthly credits</strong>, "500"],
            [<strong className="text-foreground">nLOC limit per audit</strong>, "9,999 nLOC"],
            [<strong className="text-foreground">Complexity levels</strong>, "L1, L2, L3"],
            [
              <span className="font-semibold text-foreground text-xs uppercase tracking-wider">Analysis depth</span>,
              "",
            ],
            ["Initial vulnerability scan (Hunter P1)", <Yes />],
            ["Deep scan on L2+ contracts (Hunter P2)", <Yes />],
            ["Cross-contract interaction analysis", <Yes />],
            ["AI false-positive validation", <Yes />],
            ["QA scan (Low, Info, Gas findings)", <Yes />],
            [
              <span className="font-semibold text-foreground text-xs uppercase tracking-wider">Findings</span>,
              "",
            ],
            ["Critical, High, Medium severity", <Yes />],
            ["Low, Info, Gas severity", <Yes />],
            ["Remediation guidance", <Yes />],
            [
              <span className="font-semibold text-foreground text-xs uppercase tracking-wider">Reports</span>,
              "",
            ],
            ["Local markdown report", <Yes />],
            ["Dashboard report", "Free"],
            ["Share reports with team", <Yes />],
            ["Public report link", <Yes />],
            [
              <span className="font-semibold text-foreground text-xs uppercase tracking-wider">Collaboration</span>,
              "",
            ],
            ["Invite collaborators (up to 5)", <Yes />],
            ["Comment and track remediation", <Yes />],
            [<strong className="text-foreground">Credit rate</strong>, "$0.10/credit"],
          ]}
        />
      </div>

      {/* ---------------------------------------------------------- */}
      {/*  6. Analysis Phases                                         */}
      {/* ---------------------------------------------------------- */}
      <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Analysis Phases</h2>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground/60">
          <DocTable
            headers={["Phase", "What it does", "Included"]}
            rows={[
              [
                <strong className="text-foreground">1. Complexity estimation</strong>,
                "Classifies each contract as L1, L2, or L3 based on code patterns",
                <Yes />,
              ],
              [
                <strong className="text-foreground">2. Hunting (P1)</strong>,
                "Broad vulnerability sweep across all contracts",
                <Yes />,
              ],
              [
                <strong className="text-foreground">3. Hunting (P2)</strong>,
                "Second pass on L2+ contracts with deeper pattern matching",
                <Yes />,
              ],
              [
                <strong className="text-foreground">4. Cross-contract</strong>,
                "Examines contract interactions — reentrancy chains, trust boundaries, shared state",
                <Yes />,
              ],
              [
                <strong className="text-foreground">5. AI validation</strong>,
                "Re-examines each finding, rejecting false positives and adjusting severity",
                <Yes />,
              ],
              [
                <strong className="text-foreground">6. QA scan</strong>,
                "Gas optimizations, informational issues, and low-severity findings",
                <Yes />,
              ],
              [
                <strong className="text-foreground">7. Formatting</strong>,
                "Maps findings to exact source lines, generates your markdown report",
                <Yes />,
              ],
            ]}
          />
          <p>
            All 7 analysis phases run automatically on every audit. The engine
            seamlessly proceeds to the next phase without interruption.
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/*  7. Scope Limits                                            */}
      {/* ---------------------------------------------------------- */}
      <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Scope Limits</h2>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground/60">
          <p>
            The Inferno plan supports audits up to <strong className="text-foreground">9,999 nLOC</strong> per audit.
          </p>
          <p>
            If your selected scope exceeds the limit, the cost
            confirmation screen removes the "Start audit" option and shows:
          </p>
          <pre className="bg-[hsl(0_0%_4%)] border border-border/10 rounded-lg p-4 text-xs font-mono overflow-x-auto">
{`Warning: Scope (10,200 nLOC) exceeds the 9,999 nLOC limit.
  Reduce scope to continue.`}
          </pre>
          <p>
            Both scope files and context files count toward the nLOC limit.
            Plan your file selection accordingly.
          </p>
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs">
            <strong className="text-foreground">Note:</strong> You'll also see a yellow warning
            when your scope reaches 80% of the limit, so you can
            plan ahead.
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/*  8. Additional Credits                                      */}
      {/* ---------------------------------------------------------- */}
      <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Additional Credits</h2>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground/60">
          <p>
            Your Inferno plan includes 500 credits monthly. Need more? Purchase
            additional credits at a flat rate of <strong className="text-foreground">$0.10 per credit</strong>.
          </p>
          <p>
            Additional credits stack with your monthly allocation and never
            expire as long as you maintain an active subscription.
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/*  9. Worked Examples                                         */}
      {/* ---------------------------------------------------------- */}

      {/* Example 1 — Solo developer on Inferno */}
      <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">
            Solo Developer Auditing an ERC-20 Token
          </h2>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground/60">
          <p>
            <strong className="text-foreground">Scenario:</strong> You've written a custom ERC-20
            token with a fee-on-transfer mechanism. One file, 280 nLOC,
            classified as L1 (standard).
          </p>
          <DocTable
            headers={["File", "nLOC", "Complexity", "Rate", "Credits"]}
            rows={[
              ["FeeToken.sol", "280", "L1", "0.8x", "224"],
            ]}
          />
          <p>
            <strong className="text-foreground">Total: 224 credits.</strong> Well within your 500
            monthly credits — this audit is covered by your subscription with
            276 credits to spare. Need more? Buy additional credits at $0.10 each.
          </p>
          <p className="font-medium text-foreground">What happens during the audit:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Complexity estimation classifies FeeToken.sol as L1</li>
            <li>Hunter P1 scans for vulnerabilities (Critical, High, Medium)</li>
            <li>Hunter P2 deep-scans for additional patterns</li>
            <li>Cross-contract analysis (single contract — not applicable)</li>
            <li>AI validation re-examines findings, rejecting false positives</li>
            <li>QA scan finds gas optimizations and informational issues</li>
            <li>Formatting maps findings to source lines</li>
            <li>Report generated: <Code>solarizer-report.md</Code></li>
          </ol>
          <p>
            <strong className="text-foreground">Result:</strong> Complete security audit with all
            severity levels, remediation guidance, and gas optimizations included.
          </p>
        </div>
      </div>

      {/* Example 2 — DeFi team on Inferno */}
      <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">
            DeFi Protocol Audit — 3 Contracts + Context
          </h2>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground/60">
          <p>
            <strong className="text-foreground">Scenario:</strong> Your lending protocol has 3
            core contracts and 2 interface dependencies. You want the full
            analysis. 1,800 nLOC scope — well within the 9,999 nLOC limit.
          </p>
          <DocTable
            headers={["File", "Role", "nLOC", "Complexity", "Rate", "Credits"]}
            rows={[
              ["LendingPool.sol", "Scope", "920", "L2", "1.0x", "920"],
              ["LiquidationEngine.sol", "Scope", "640", "L3", "1.2x", "768"],
              ["InterestRateModel.sol", "Scope", "240", "L1", "0.8x", "192"],
              ["ILendingPool.sol", "Context", "85", "\u2014", "0.15x", "13"],
              ["IERC20.sol", "Context", "45", "\u2014", "0.15x", "7"],
              [
                <strong className="text-foreground">Total</strong>,
                "",
                <strong className="text-foreground">1,930</strong>,
                "",
                "",
                <strong className="text-foreground">1,900</strong>,
              ],
            ]}
          />
          <p>
            <strong className="text-foreground">Total: 1,900 credits.</strong> You'll need to
            purchase 1,400 additional credits at $0.10 each ($140) to supplement
            your 500 monthly credits, or accumulate credits over multiple months.
          </p>
          <p className="font-medium text-foreground">What happens during the audit:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Complexity estimation: L2, L3, L1 respectively</li>
            <li>Hunter P1 scans all 3 contracts for vulnerabilities</li>
            <li>Hunter P2 deep-scans LendingPool.sol (L2) and LiquidationEngine.sol (L3)</li>
            <li>Cross-contract analysis examines interactions between all 3 contracts</li>
            <li>AI validation re-examines each finding, rejecting false positives</li>
            <li>QA scan finds gas optimizations and informational issues</li>
            <li>Formatting maps all findings to exact source lines</li>
            <li>Full report with remediation guidance: <Code>solarizer-report.md</Code></li>
          </ol>
          <p>
            <strong className="text-foreground">Result:</strong> Complete security audit with all
            7 phases. Dashboard report saved for free.
          </p>
        </div>
      </div>

      {/* Example 3 — Hitting the scope limit */}
      <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">
            When Your Scope Exceeds the Limit
          </h2>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground/60">
          <p>
            <strong className="text-foreground">Scenario:</strong> You select contracts totaling
            10,200 nLOC, exceeding the 9,999 nLOC limit.
          </p>
          <p>The "Start audit" option disappears. You see:</p>
          <pre className="bg-[hsl(0_0%_4%)] border border-border/10 rounded-lg p-4 text-xs font-mono overflow-x-auto">
{`Warning: Scope (10,200 nLOC) exceeds the 9,999 nLOC limit.
Reduce scope to continue.`}
          </pre>
          <p className="font-medium text-foreground">Your options:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              <strong className="text-foreground">Reduce scope</strong> — deselect files until
              you're under 9,999 nLOC. Audit the most critical contracts first.
            </li>
            <li>
              <strong className="text-foreground">Split into batches</strong> — audit each
              contract individually. You lose cross-contract analysis, but
              each contract still gets a full vulnerability scan.
            </li>
          </ol>
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs">
            <strong className="text-foreground">Note:</strong> Context files count toward the
            nLOC limit, but at the discounted 0.15x credit rate. Factor them
            into your scope planning.
          </div>
        </div>
      </div>
    </div>
  );
}
