# Solarizer — AI-Powered Smart Contract Security Auditing

> Democratizing smart contract security for open-source blockchain projects and enterprise DeFi teams alike.

Solarizer is a full-stack SaaS platform that automates security auditing of Solidity smart contracts using a **multi-phase agentic AI pipeline**. It detects vulnerabilities, generates structured audit reports, tracks remediation, and produces publicly shareable results — making professional-grade smart contract security accessible without a six-figure traditional audit.

---

## Why This Matters

Smart contract exploits drained **over $1.8 billion** from DeFi protocols in 2023 alone. Traditional audits cost $50,000–$200,000 and take weeks. Most open-source blockchain projects — the protocols that secure billions in user funds — cannot afford them.

Solarizer changes that equation. Open-source maintainers can point it at a GitHub repository and receive a structured, severity-graded security report in minutes, not months.

---

## Features

### AI-Powered Multi-Phase Analysis
- **Agentic orchestration** runs multiple analysis phases in sequence, each building on prior findings
- Detects vulnerability classes including reentrancy, integer overflow/underflow, access control failures, unchecked return values, front-running, and more
- Assigns severity grades: `critical` · `high` · `medium` · `low` · `info` · `gas`
- Generates remediation guidance per finding with code-level location references (file + line range)

### Security Scoring & Reports
- Numeric security score with letter grade (A–F)
- Vulnerability matrix breaking down findings by severity
- Architecture insights: weak points, improvement recommendations
- Invariants documentation (contract-level and cross-contract)
- Test coverage integration with pass/fail proof
- One-click **public shareable reports** — open-source communities can link audit results directly in their READMEs

### GitHub-Native Workflow
- Import any public or private repository by URL
- Branch and path selection for monorepos
- No copy-pasting: point Solarizer at the repo, get an audit

### Remediation Tracking
- Mark findings as resolved, downgraded, or false positive
- Team comments on individual findings
- Remediation progress dashboard
- Resolution history for audit trails

### Collaboration & Transparency
- Share audits via email invitation with expiration dates
- Public audit slugs for community transparency
- Export full reports to Markdown for documentation

### Credit-Based, Open Access
- Credit system tied to Non-Comment Lines of Code (NLOC) — pay for what you actually analyze
- Trial tier gives new projects 300 credits free to run their first audit
- Subscription plans from $0 to $99/month scaling with project size

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| UI | shadcn/ui, Tailwind CSS, Radix UI |
| Backend | Supabase (PostgreSQL + Edge Functions + Realtime) |
| Auth | Supabase Auth (Google, Apple, Email) |
| AI Orchestration | Multi-phase agentic pipeline via Edge Functions |
| Payments | Razorpay / Cashfree |
| File Handling | JSZip, React Dropzone |
| State | TanStack Query, React Context |
| Charts | Recharts |

---

## Architecture

```
User submits contract (GitHub URL or file upload)
         │
         ▼
  Supabase Edge Function — github-fetch-repo
         │
         ▼
  Audit orchestrator — multi-phase AI pipeline
  ┌──────────────────────────────────────────┐
  │  Phase 1: Code parsing + NLOC counting   │
  │  Phase 2: Vulnerability detection        │
  │  Phase 3: Severity classification        │
  │  Phase 4: Remediation generation         │
  │  Phase 5: Architecture insights          │
  │  Phase 6: Invariant extraction           │
  └──────────────────────────────────────────┘
         │
         ▼
  Findings stored in PostgreSQL
  Real-time updates pushed to client via Supabase Channels
         │
         ▼
  Security score computed → Report generated → Shareable link created
```

---

## Data Model (Core Tables)

| Table | Purpose |
|---|---|
| `audits` | Audit records with status, NLOC, security score, phase tracking |
| `findings` | Individual vulnerabilities with severity, location, code snippet, remediation |
| `profiles` | Users with subscription tier and trial status |
| `subscriptions` | Active plan, credit allowance, billing cycle |
| `nloc_credits` | Per-user credit balance and transaction history |
| `audit_shares` | Shareable audit links with expiration |
| `finding_comments` | Team discussion threads on findings |
| `github_connections` | OAuth-linked GitHub accounts |

---

## Vulnerability Coverage

Solarizer's AI pipeline is trained to detect:

- **Reentrancy** — single and cross-function
- **Integer overflow/underflow** — pre- and post-SafeMath patterns
- **Access control failures** — missing `onlyOwner`, role checks
- **Unchecked external calls** — return value handling
- **Front-running / MEV** — transaction ordering vulnerabilities
- **Denial of Service** — gas limit attacks, unbounded loops
- **Timestamp dependence** — block timestamp manipulation
- **Delegatecall risks** — storage collision in proxy patterns
- **Flash loan attack vectors**
- **Oracle manipulation**
- **Gas optimization** — inefficient patterns (flagged as `gas` severity)

---

## Severity Classification

| Severity | Description |
|---|---|
| 🔴 Critical | Direct loss of funds or protocol compromise |
| 🟠 High | Significant risk, likely exploitable |
| 🟡 Medium | Conditional risk, requires specific circumstances |
| 🔵 Low | Best-practice violations, minor risk |
| ⚪ Info | Informational, no direct risk |
| ⛽ Gas | Optimization opportunities |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project
- A Razorpay or Cashfree account (for payments)

### Local Development

```sh
# Clone the repository
git clone https://github.com/your-org/solarizer-app
cd solarizer-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

# Start the development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Roadmap

- [ ] **CLI tool** — run `solarizer audit ./contracts` from any terminal
- [ ] **GitHub Action** — automated security check on every pull request
- [ ] **Vyper support** — expand beyond Solidity
- [ ] **Multi-chain context** — chain-specific vulnerability patterns (Arbitrum, Base, Polygon)
- [ ] **Diff auditing** — re-audit only changed code between versions
- [ ] **Webhook integrations** — post findings to Slack, Linear, Jira
- [ ] **On-chain report anchoring** — publish audit hashes to a public chain for immutability

---

## Why Codex Credits Would Accelerate This

Solarizer's AI pipeline is the core of the product. With Codex API credits, we would:

1. **Expand vulnerability coverage** — train and evaluate new detection patterns against a larger corpus of known exploits (Rekt.news, Immunefi disclosures, audit repositories)
2. **Power the CLI tool** — bring the audit pipeline to the terminal so any open-source maintainer can run `npx solarizer` in CI without a web UI
3. **Build the GitHub Action** — integrate Solarizer as a native PR check, giving open-source Solidity projects automated security review on every merge
4. **Reduce cost for open-source projects** — free or heavily subsidized audits for qualifying open-source DeFi protocols

The open-source DeFi ecosystem desperately needs accessible, automated security tooling. Solarizer is positioned to be that infrastructure layer — and Codex credits would let us reach the maintainers who need it most.

---

## Contributing

We welcome contributions from security researchers, Solidity developers, and anyone passionate about making Web3 safer.

- **Vulnerability patterns**: Submit new detection heuristics
- **Integrations**: Build connectors for new chains or tools
- **Documentation**: Improve guides and API docs
- **Bug reports**: Open an issue with a reproducible case

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built to make smart contract security accessible to every developer, not just the ones who can afford a $100K audit.
</p>
