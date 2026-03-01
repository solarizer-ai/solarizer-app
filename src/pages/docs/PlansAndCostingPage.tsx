import {
  Coins,
  Layers,
  FileStack,
  Calculator,
  Zap,
  Shield,
  AlertTriangle,
  ListChecks,
  Cloud,
  User,
  Users,
  RefreshCw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

/* ------------------------------------------------------------------ */
/*  Inline helper: styled <code> span                                  */
/* ------------------------------------------------------------------ */
const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">
    {children}
  </code>
);

/* ------------------------------------------------------------------ */
/*  Reusable table wrapper                                             */
/* ------------------------------------------------------------------ */
const DocTable = ({
  headers,
  rows,
  className = "",
}: {
  headers: string[];
  rows: React.ReactNode[][];
  className?: string;
}) => (
  <div className={`overflow-x-auto ${className}`}>
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-border">
          {headers.map((h) => (
            <th
              key={h}
              className="py-2 px-3 text-left font-medium text-muted-foreground"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-border/50 last:border-0">
            {row.map((cell, j) => (
              <td key={j} className="py-2 px-3">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Yes = () => <span className="text-green-500 font-medium">✓</span>;
const No = () => <span className="text-muted-foreground">—</span>;

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function PlansAndCostingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Plans &amp; Costing
        </h1>
        <p className="text-muted-foreground mt-1">
          Understand credits, plan features, analysis depth, and real-world
          examples.
        </p>
      </div>

      <Tabs defaultValue="credits" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="credits">How Credits Work</TabsTrigger>
          <TabsTrigger value="plans">Plan Comparison</TabsTrigger>
          <TabsTrigger value="depth">Analysis Depth</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/*  TAB 1 — HOW CREDITS WORK                                    */}
        {/* ============================================================ */}
        <TabsContent value="credits" className="space-y-4">
          {/* Card 1 — The Credit System */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">The credit system</CardTitle>
              </div>
              <CardDescription>
                One credit, one line of code — with modifiers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Credits are the currency of Solarizer audits. Every plan
                includes <strong className="text-foreground">50 credits per month</strong>, and unused
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
            </CardContent>
          </Card>

          {/* Card 2 — Complexity Multipliers */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">
                  Complexity multipliers
                </CardTitle>
              </div>
              <CardDescription>
                Not all code carries the same risk
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <DocTable
                headers={["Complexity", "Label", "Multiplier", "What it means"]}
                rows={[
                  [
                    <strong className="text-foreground">L1</strong>,
                    "Standard",
                    "0.83×",
                    "ERC-20 tokens, basic vaults, simple access control. Well-understood patterns with established security guarantees.",
                  ],
                  [
                    <strong className="text-foreground">L2</strong>,
                    "Complex",
                    "1.0×",
                    "AMM pools, lending protocols, staking mechanisms. Multiple interacting state variables and external calls.",
                  ],
                  [
                    <strong className="text-foreground">L3</strong>,
                    "Novel",
                    "1.2×",
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
            </CardContent>
          </Card>

          {/* Card 3 — Context File Discount */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileStack className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">
                  Context files: 85% discount
                </CardTitle>
              </div>
              <CardDescription>
                Provide context without paying full price
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
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
                  <strong className="text-foreground">15% of nLOC</strong> (0.15× rate).
                </li>
              </ul>
              <p>
                A 1,000 nLOC OpenZeppelin import used as context costs only{" "}
                <strong className="text-foreground">150 credits</strong> instead of 1,000. We
                encourage including context files — they dramatically improve
                finding accuracy without draining your balance.
              </p>
            </CardContent>
          </Card>

          {/* Card 4 — Cost Formula */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">
                  How your audit cost is calculated
                </CardTitle>
              </div>
              <CardDescription>
                Transparent, predictable pricing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto">
{`Audit Cost =
  Sum of (Scope File nLOC × Complexity Multiplier)
  + Sum of (Context File nLOC × 0.15)`}
              </pre>

              <p className="font-medium text-foreground">
                Worked example — "DeFi Lending Protocol" audit:
              </p>
              <DocTable
                headers={["File", "Role", "nLOC", "Complexity", "Rate", "Credits"]}
                rows={[
                  ["LendingPool.sol", "Scope", "420", "L2", "1.0×", "420"],
                  ["InterestModel.sol", "Scope", "180", "L3", "1.2×", "216"],
                  ["PriceOracle.sol", "Scope", "95", "L1", "0.83×", "79"],
                  ["IERC20.sol", "Context", "45", "—", "0.15×", "7"],
                  ["SafeMath.sol", "Context", "120", "—", "0.15×", "18"],
                  [
                    <strong className="text-foreground">Total</strong>,
                    "",
                    <strong className="text-foreground">860</strong>,
                    "",
                    "",
                    <strong className="text-foreground">740</strong>,
                  ],
                ]}
              />
              <p>
                With 50 included credits, this audit costs{" "}
                <strong className="text-foreground">690 credits</strong> from your balance —
                or zero extra if you've accumulated credits over multiple months.
              </p>
            </CardContent>
          </Card>

          {/* Card 5 — Additional Credits */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Additional credits</CardTitle>
              </div>
              <CardDescription>
                Top up anytime, pay less on higher plans
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Every plan includes 50 credits per month. Need more? Purchase
                additional credits at a rate that improves with your plan:
              </p>
              <DocTable
                headers={["Plan", "Credit rate", "Savings"]}
                rows={[
                  [<strong className="text-foreground">Spark</strong>, "$2.80/credit", <No />],
                  [<strong className="text-foreground">Blaze</strong>, "$2.50/credit", "~11% off"],
                  [<strong className="text-foreground">Inferno</strong>, "$2.20/credit", "~21% off"],
                ]}
              />
              <p>
                Additional credits stack with your monthly allocation and never
                expire as long as you maintain an active subscription.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/*  TAB 2 — PLAN COMPARISON                                     */}
        {/* ============================================================ */}
        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What each plan unlocks</CardTitle>
              <CardDescription>
                Every plan runs the same core engine — higher tiers unlock deeper
                analysis phases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocTable
                headers={["Feature", "Spark ($149/mo)", "Blaze ($199/mo)", "Inferno ($499/mo)"]}
                rows={[
                  [<strong className="text-foreground">Monthly credits</strong>, "50", "50", "50"],
                  [<strong className="text-foreground">nLOC limit per audit</strong>, "500 nLOC", "3,000 nLOC", "9,999 nLOC"],
                  [<strong className="text-foreground">Complexity levels</strong>, "L1, L2, L3", "L1, L2, L3", "L1, L2, L3"],
                  [
                    <span className="font-semibold text-foreground text-xs uppercase tracking-wider">Analysis depth</span>,
                    "", "", "",
                  ],
                  ["Initial vulnerability scan (Hunter P1)", <Yes />, <Yes />, <Yes />],
                  ["Deep scan on L2+ contracts (Hunter P2)", <No />, <Yes />, <Yes />],
                  ["Cross-contract interaction analysis", <No />, <Yes />, <Yes />],
                  ["AI false-positive validation", <No />, <Yes />, <Yes />],
                  ["QA scan (Low, Info, Gas findings)", <No />, <Yes />, <Yes />],
                  [
                    <span className="font-semibold text-foreground text-xs uppercase tracking-wider">Findings</span>,
                    "", "", "",
                  ],
                  ["Critical, High, Medium severity", <Yes />, <Yes />, <Yes />],
                  ["Low, Info, Gas severity", <No />, <Yes />, <Yes />],
                  ["Remediation guidance", <No />, <Yes />, <Yes />],
                  [
                    <span className="font-semibold text-foreground text-xs uppercase tracking-wider">Reports</span>,
                    "", "", "",
                  ],
                  ["Local markdown report", <Yes />, <Yes />, <Yes />],
                  ["Dashboard report", "Free", "Free", "Free"],
                  ["Share reports with team", <No />, <No />, <Yes />],
                  [
                    <span className="font-semibold text-foreground text-xs uppercase tracking-wider">Collaboration</span>,
                    "", "", "",
                  ],
                  ["Invite collaborators (up to 5)", <No />, <No />, <Yes />],
                  ["Comment and track remediation", <No />, <No />, <Yes />],
                  [<strong className="text-foreground">Credit rate</strong>, "$2.80/credit", "$2.50/credit", "$2.20/credit"],
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/*  TAB 3 — ANALYSIS DEPTH                                      */}
        {/* ============================================================ */}
        <TabsContent value="depth" className="space-y-4">
          {/* Card 1 — Your audit never stops */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">
                  Your audit never stops
                </CardTitle>
              </div>
              <CardDescription>
                The engine adapts to your plan — every audit runs to completion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Solarizer never interrupts your audit. The engine automatically
                tailors its analysis pipeline to your plan, running every phase
                available to you and seamlessly moving past the rest. You'll see
                a subtle <Code>skipped</Code> indicator in the progress view — no
                errors, no pop-ups, no disruption.
              </p>
              <p>
                After the audit completes, you'll see a summary of additional
                analysis phases available on higher plans:
              </p>
              <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto">
{`+----------------------------------------------------+
| Unlock more with Blaze                             |
|                                                    |
| Your audit skipped:                                |
| · Deep scanning on L2+ contracts                   |
| · Cross-contract analysis                          |
| · AI-powered false positive validation             |
| · QA findings (Low, Info, Gas)                     |
|                                                    |
| solarizer.io/dashboard/billing                     |
+----------------------------------------------------+`}
              </pre>
              <p>
                Start with Spark, see real results immediately, and upgrade when
                you need deeper analysis — without re-running anything.
              </p>
            </CardContent>
          </Card>

          {/* Card 2 — Scope limits */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Scope limits</CardTitle>
              </div>
              <CardDescription>
                Each plan supports a maximum audit size
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <DocTable
                headers={["Plan", "nLOC limit per audit"]}
                rows={[
                  [<strong className="text-foreground">Spark</strong>, "500 nLOC"],
                  [<strong className="text-foreground">Blaze</strong>, "3,000 nLOC"],
                  [<strong className="text-foreground">Inferno</strong>, "9,999 nLOC"],
                ]}
              />
              <p>
                If your selected scope exceeds your plan's limit, the cost
                confirmation screen removes the "Start audit" option and shows:
              </p>
              <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto">
{`Warning: Scope (1,200 nLOC) exceeds your Spark plan limit (500 nLOC).
  Reduce scope or upgrade to Blaze.`}
              </pre>
              <p>
                Both scope files and context files count toward the nLOC limit.
                Plan your file selection accordingly.
              </p>
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs">
                <strong className="text-foreground">Note:</strong> You'll also see a yellow warning
                when your scope reaches 80% of your plan's limit, so you can
                plan ahead.
              </div>
            </CardContent>
          </Card>

          {/* Card 3 — Phase-by-phase breakdown */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">
                  What runs on each plan
                </CardTitle>
              </div>
              <CardDescription>
                A phase-by-phase breakdown of the 7-step analysis engine
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <DocTable
                headers={["Phase", "What it does", "Spark", "Blaze", "Inferno"]}
                rows={[
                  [
                    <strong className="text-foreground">1. Complexity estimation</strong>,
                    "Classifies each contract as L1, L2, or L3 based on code patterns",
                    <Yes />, <Yes />, <Yes />,
                  ],
                  [
                    <strong className="text-foreground">2. Hunting (P1)</strong>,
                    "Broad vulnerability sweep across all contracts",
                    <Yes />, <Yes />, <Yes />,
                  ],
                  [
                    <strong className="text-foreground">3. Hunting (P2)</strong>,
                    "Second pass on L2+ contracts with deeper pattern matching",
                    <No />, <Yes />, <Yes />,
                  ],
                  [
                    <strong className="text-foreground">4. Cross-contract</strong>,
                    "Examines contract interactions — reentrancy chains, trust boundaries, shared state",
                    <No />, <Yes />, <Yes />,
                  ],
                  [
                    <strong className="text-foreground">5. AI validation</strong>,
                    "Re-examines each finding, rejecting false positives and adjusting severity",
                    <No />, <Yes />, <Yes />,
                  ],
                  [
                    <strong className="text-foreground">6. QA scan</strong>,
                    "Gas optimizations, informational issues, and low-severity findings",
                    <No />, <Yes />, <Yes />,
                  ],
                  [
                    <strong className="text-foreground">7. Formatting</strong>,
                    "Maps findings to exact source lines, generates your markdown report",
                    <Yes />, <Yes />, <Yes />,
                  ],
                ]}
              />
              <p>
                Phases marked "—" are available on higher plans. The engine
                seamlessly proceeds to the next phase without interruption.
              </p>
            </CardContent>
          </Card>

          {/* Card 4 — Dashboard reports */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Dashboard reports</CardTitle>
              </div>
              <CardDescription>
                Save your audit to the cloud — or keep it local
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Every audit generates a local markdown report at no additional
                cost, regardless of your plan.
              </p>
              <DocTable
                headers={["Plan", "Dashboard report access"]}
                rows={[
                  [<strong className="text-foreground">Spark</strong>, "Free"],
                  [<strong className="text-foreground">Blaze</strong>, "Free"],
                  [<strong className="text-foreground">Inferno</strong>, "Free + shareable with collaborators"],
                ]}
              />
              <p>
                Dashboard reports are free on all plans.
                Your local markdown report is also always available.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/*  TAB 4 — EXAMPLES                                            */}
        {/* ============================================================ */}
        <TabsContent value="examples" className="space-y-4">
          {/* Example 1 — Solo developer on Spark */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">
                  Solo developer auditing an ERC-20 token
                </CardTitle>
              </div>
              <CardDescription>
                Spark plan, 280 nLOC, single contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Scenario:</strong> You've written a custom ERC-20
                token with a fee-on-transfer mechanism. One file, 280 nLOC,
                classified as L1 (standard).
              </p>
              <DocTable
                headers={["File", "nLOC", "Complexity", "Rate", "Credits"]}
                rows={[
                  ["FeeToken.sol", "280", "L1", "0.83×", "233"],
                ]}
              />
              <p>
                <strong className="text-foreground">Total: 233 credits.</strong> With 50 monthly
                credits, you need 183 Power-Up credits ($2.80 each = $512.40).
                Or wait 5 months to accumulate 250 credits and run it for free.
              </p>
              <p className="font-medium text-foreground">What happens during the audit:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Complexity estimation classifies FeeToken.sol as L1</li>
                <li>Hunter P1 scans for vulnerabilities (Critical, High, Medium)</li>
                <li className="text-muted-foreground/60 line-through">Deep scan — available on Blaze+</li>
                <li className="text-muted-foreground/60 line-through">Cross-contract — single contract, not applicable</li>
                <li className="text-muted-foreground/60 line-through">Validation — available on Blaze+</li>
                <li className="text-muted-foreground/60 line-through">QA scan — available on Blaze+</li>
                <li>Formatting maps findings to source lines</li>
                <li>Report generated: <Code>solarizer-report.md</Code></li>
              </ol>
              <p>
                <strong className="text-foreground">Result:</strong> Critical, High, and Medium
                findings with exact line numbers and code snippets. Remediation
                guidance and gas optimizations are included with Blaze and above.
              </p>
            </CardContent>
          </Card>

          {/* Example 2 — DeFi team on Blaze */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">
                  DeFi protocol audit — 3 contracts + context
                </CardTitle>
              </div>
              <CardDescription>
                Blaze plan, 1,800 nLOC scope, full engine
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Scenario:</strong> Your lending protocol has 3
                core contracts and 2 interface dependencies. You want the full
                analysis.
              </p>
              <DocTable
                headers={["File", "Role", "nLOC", "Complexity", "Rate", "Credits"]}
                rows={[
                  ["LendingPool.sol", "Scope", "920", "L2", "1.0×", "920"],
                  ["LiquidationEngine.sol", "Scope", "640", "L3", "1.2×", "768"],
                  ["InterestRateModel.sol", "Scope", "240", "L1", "0.83×", "200"],
                  ["ILendingPool.sol", "Context", "85", "—", "0.15×", "13"],
                  ["IERC20.sol", "Context", "45", "—", "0.15×", "7"],
                  [
                    <strong className="text-foreground">Total</strong>,
                    "",
                    <strong className="text-foreground">1,930</strong>,
                    "",
                    "",
                    <strong className="text-foreground">1,908</strong>,
                  ],
                ]}
              />
              <p>
                <strong className="text-foreground">Total: 1,908 credits</strong> (scope: 1,800 nLOC
                — well within Blaze's 3,000 limit).
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
            </CardContent>
          </Card>

          {/* Example 3 — Hitting the scope limit */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">
                  When your scope exceeds the plan limit
                </CardTitle>
              </div>
              <CardDescription>
                What you see and what to do about it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Scenario:</strong> You're on Spark (500 nLOC
                limit) and select 3 contracts totaling 720 nLOC.
              </p>
              <p>The "Start audit" option disappears. You see:</p>
              <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto">
{`Warning: Scope (720 nLOC) exceeds your Spark plan limit (500 nLOC).
Reduce scope or upgrade to Blaze.`}
              </pre>
              <p className="font-medium text-foreground">Your options:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>
                  <strong className="text-foreground">Reduce scope</strong> — deselect files until
                  you're under 500 nLOC. Audit the most critical contracts first.
                </li>
                <li>
                  <strong className="text-foreground">Upgrade to Blaze</strong> — your 3,000 nLOC
                  limit covers this audit comfortably.
                </li>
                <li>
                  <strong className="text-foreground">Split into batches</strong> — audit each
                  contract individually. You lose cross-contract analysis, but
                  each contract still gets a full vulnerability scan.
                </li>
              </ol>
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs">
                <strong className="text-foreground">Note:</strong> Context files count toward the
                nLOC limit, but at the discounted 0.15× credit rate. Factor them
                into your scope planning.
              </div>
            </CardContent>
          </Card>

          {/* Example 4 — Resuming after upgrade */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">
                  Resuming an audit after upgrading
                </CardTitle>
              </div>
              <CardDescription>
                Upgrade mid-audit and pick up where you left off
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Scenario:</strong> You started an audit on Spark.
                The engine completed Hunting (P1) and moved past cross-contract,
                validation, and QA (not included in Spark). You then upgraded to
                Blaze and resumed.
              </p>
              <p className="font-medium text-foreground">What happens:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Solarizer re-authenticates and detects your new Blaze plan</li>
                <li>Resume loads the checkpoint — Hunting is already complete</li>
                <li>Cross-contract analysis <strong className="text-foreground">now runs</strong> (included in Blaze)</li>
                <li>Validation <strong className="text-foreground">now runs</strong> (included in Blaze)</li>
                <li>QA scan <strong className="text-foreground">now runs</strong> (included in Blaze)</li>
                <li>Formatting and reporting complete as normal</li>
              </ol>
              <p>
                Your final report includes findings from all phases — including
                the deeper analysis unlocked by your upgrade. No need to re-run
                the entire audit.
              </p>
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs">
                <strong className="text-foreground">Note:</strong> The reverse also applies. If you
                change plans mid-audit, the resumed audit reflects your current
                plan. Phases already completed won't be undone, but additional
                phases not included in your current plan will be skipped.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
