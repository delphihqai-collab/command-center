# Delphi AI — Master Strategy & Implementation Document

> Complete record of everything discussed, decided, and implemented across our planning and implementation sessions. This is the definitive reference for the company's commercial strategy, technical architecture, and product-led outreach system.

---

## Table of Contents

1. [Company Overview](#1-company-overview)
2. [Go-to-Market Strategy](#2-go-to-market-strategy)
3. [Product-Led Outreach Workflow](#3-product-led-outreach-workflow)
4. [Technical Architecture](#4-technical-architecture)
5. [Agent Fleet & Roles](#5-agent-fleet--roles)
6. [Implementation Summary](#6-implementation-summary)
7. [Database Changes](#7-database-changes)
8. [API Routes Created](#8-api-routes-created)
9. [UI Changes](#9-ui-changes)
10. [Agent File Updates](#10-agent-file-updates)
11. [OpenClaw Templates Created](#11-openclaw-templates-created)
12. [Current State](#12-current-state)
13. [Remaining Work](#13-remaining-work)

---

## 1. Company Overview

### Delphi AI

A company run by Pedro ("Delphi" / "Boss"), operating a commercial AI agent fleet on self-hosted infrastructure. The company sells **websites and chatbots** to European businesses, starting with Portugal and expanding through Spain, DACH, and wider EU.

### Three-Machine Architecture

| Machine | Codename | Role | Key Services |
|---------|----------|------|--------------|
| PC1 | **ATLAS** | Development & Delivery | Builds demo websites and chatbots for prospects. Has its own team and dashboard ("Forge") |
| PC2 | **HERMES** | Commercial Operations | Runs the 8-agent commercial fleet via OpenClaw. Hosts Command Center (this project) on port 9069 |
| PC3 | **NEXUS** | Operations (inactive) | Reserved for future use |

### Two Departments

**Hermes Team (Commercial)** — 8 AI agents managed by OpenClaw on HERMES/PC2:
- 1 Director (Hermes) — orchestrates all commercial activity
- 3 Workers (SDR, Account Executive, Account Manager) — frontline sales roles
- 4 Specialists (Finance, Legal, Market Intelligence, Knowledge Curator) — domain experts

**Atlas Team (Development)** — Operates on ATLAS/PC1 with its own dashboard "Forge" (private repo `delphihqai-collab/forge`). Atlas builds the demo products (websites + chatbots) that the commercial team uses in outreach.

### Cross-Team Communication

Atlas and Hermes coordinate via Discord channels:
- `#briefings` — Atlas receives build requests from Hermes
- `#atlas-hermes` — Direct bilateral communication
- `#approvals` — Boss approval gate for major decisions

---

## 2. Go-to-Market Strategy

### What We Sell

**Websites and chatbots** — both products, not one or the other. The strategy is **product-led**: instead of cold-emailing prospects with a pitch, we build a demo of what we'd deliver *before* making contact.

### The Insight

Traditional outreach is "Let me tell you what we can do." Our approach is "We already built this for you — here it is." This dramatically increases engagement because:
1. The prospect sees immediate, tangible value
2. It demonstrates competence without a single meeting
3. It creates reciprocity — we invested effort before asking for anything
4. The demo is personalised to their business, not generic

### Target Market

**European SMBs** with weak or outdated web presence, starting with:
1. **Portugal** (home market, local knowledge)
2. **Spain** (geographic + linguistic proximity)
3. **DACH** (Germany, Austria, Switzerland — high purchasing power)
4. **Wider EU** (expansion after establishing the first three)

### Ideal Customer Profile (ICP)

Companies with:
- Outdated or no website (visually, technically, or mobile-wise)
- No chatbot or live chat functionality
- Between 10-500 employees
- B2B or B2C service businesses (dental clinics, consulting firms, agencies, etc.)
- Active online — have social media but weak website
- Decision-maker identifiable via LinkedIn

### 8-Point ICP Scoring (Used by SDR)

| Criterion | Weight |
|-----------|--------|
| Website quality (outdated = high score) | High |
| Online presence gaps | High |
| Industry fit | Medium |
| Company size (10-500) | Medium |
| Geographic match | Medium |
| Decision-maker accessibility | Medium |
| Competition density | Low |
| Trigger events (funding, expansion, new management) | Low |

Score ≥6/8 = qualified for Atlas build. Score 4-5 = needs more research. Score ≤3 = disqualify.

### Commercial Partner Confirmation

Strategy was confirmed with Pedro's partner: sell **both** websites and chatbots using the product-led approach. Build the demo first, include it in the outreach email. The partner agreed this differentiator is strong enough to drive initial traction.

---

## 3. Product-Led Outreach Workflow

The complete workflow from prospect discovery to deal close:

```
┌──────────────┐
│  DISCOVERY    │  SDR identifies European companies matching ICP
│  (SDR)        │  Web research, LinkedIn, industry databases
└──────┬───────┘
       ▼
┌──────────────┐
│  ENRICHMENT   │  SDR deep-dives: website analysis, decision-maker ID,
│  (SDR + MI)   │  pain point mapping, ICP scoring (8-point system)
└──────┬───────┘
       ▼
┌──────────────┐
│  ATLAS BUILD  │  Hermes sends build request to Atlas team via #briefings
│  (Atlas Team) │  Atlas builds personalised demo website + chatbot
│               │  Expected turnaround: 3-7 days
└──────┬───────┘
       ▼
┌──────────────┐
│ PRODUCT READY │  Atlas delivers URLs via webhook → Command Center
│  (System)     │  Demo website + chatbot ready for outreach
└──────┬───────┘
       ▼
┌──────────────┐
│ HUMAN REVIEW  │  Delphi reviews lead quality, demo quality,
│  (Boss)       │  outreach email draft. Approves or rejects.
└──────┬───────┘
       ▼
┌──────────────┐
│  OUTREACH     │  AE sends personalised email with demo links
│  (AE)         │  "We built this for you — check it out"
└──────┬───────┘
       ▼
┌──────────────┐
│  ENGAGED      │  Prospect opens email, clicks demo links, replies
│  (Tracked)    │  Engagement scored: opens +5, clicks +15, replies +30
│               │  Temperature: cold → warm → hot → on_fire
└──────┬───────┘
       ▼
┌──────────────────────────────────────┐
│  MEETING → PROPOSAL → WON/LOST      │
│  Standard sales process from here    │
└──────────────────────────────────────┘
```

### Key Differentiators

1. **Demo-first, pitch-second** — The product sells itself before the salesperson speaks
2. **Fully automated pipeline tracking** — From discovery through engagement, every stage is tracked
3. **Engagement intelligence** — Email opens/clicks/replies auto-score leads and classify temperature
4. **Cross-team coordination** — Hermes commercial fleet + Atlas development team, coordinated via Discord
5. **Human-in-the-loop gates** — Boss reviews and approves before any outreach is sent

---

## 4. Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────┐
│                    HERMES (PC2)                       │
│                                                       │
│  ┌──────────────┐    ┌──────────────┐                │
│  │ Command       │    │ OpenClaw      │                │
│  │ Center        │◄──►│ Gateway       │                │
│  │ (Next.js)     │    │ (ws://18789)  │                │
│  │ Port 9069     │    │               │                │
│  └──────┬───────┘    └──────┬───────┘                │
│         │                    │                         │
│         ▼                    ▼                         │
│  ┌──────────────┐    ┌──────────────┐                │
│  │ Supabase     │    │ 8 AI Agents  │                │
│  │ (PostgreSQL)  │    │ (Claude)     │                │
│  └──────────────┘    └──────────────┘                │
│                              │                         │
│                              ▼                         │
│                      ┌──────────────┐                 │
│                      │ Discord       │                 │
│                      │ (26 channels) │                 │
│                      └──────────────┘                 │
└─────────────────────────────────────────────────────┘
          │
          │ Discord #briefings / #atlas-hermes
          ▼
┌─────────────────────┐
│     ATLAS (PC1)      │
│  Forge Dashboard     │
│  Builds demos        │
└─────────────────────┘
```

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + shadcn/ui (Radix primitives) |
| Styling | Tailwind CSS v4 — dark theme, zinc palette |
| Database | Supabase (PostgreSQL + Auth + SSR + Realtime) |
| Agent Runtime | OpenClaw (self-hosted, gateway on port 18789) |
| Models | Claude Sonnet 4.6 (director + workers), Claude Haiku 4.5 (specialists) |
| Communication | Discord (26 channels across 6 categories) |
| Drag & Drop | @dnd-kit (Pipeline kanban board) |
| Charts | Recharts |
| Icons | Lucide React |
| Shell Execution | `execFile` (never `exec` — injection-safe) |

### Dual Data Source Architecture

| Data | Source | Method |
|------|--------|--------|
| Pipeline, Agents, Operations | Supabase | Server Component queries |
| Sessions | OpenClaw CLI | `openclaw sessions --all-agents --json` |
| Cron Jobs | OpenClaw CLI | `openclaw cron list --json` |
| Agent Memory | Filesystem | `/api/memory` → `~/.openclaw/workspace/*/memory/` |
| Agent Workspace | Filesystem | `/api/agents/[id]/workspace` → reads .md files |
| Costs | Filesystem + CLI | `~/.openclaw/cron/runs/*.jsonl` + live sessions |
| Gateway Config | Gateway HTTP | `localhost:18789` (read-only) |
| System Logs | journalctl + Supabase | `agent_logs` table + journald |

---

## 5. Agent Fleet & Roles

### Hermes — Commercial Director

- **Model:** Claude Sonnet 4.6
- **Role:** AI Commercial Director — strategist, operator, closer
- **Owns:** Full commercial results (pipeline, revenue, team coordination)
- **Commands:** 7 sub-agents
- **Workspace:** `~/.openclaw/workspace/`
- **Key Responsibility (new):** Atlas Coordination — packages build requests, sends to #briefings, tracks delivery, escalates delays >7 days

### SDR (Sales Development Representative)

- **Model:** Claude Sonnet 4.6
- **Role:** Prospector and qualifier
- **Stages Owned:** Discovery → Enrichment
- **Key Responsibility (new):** European prospecting with geographic expansion (PT → ES → DACH → EU), 8-point ICP scoring, research brief creation using `sdr-research-brief.md` template, Atlas build request packaging using `sdr-atlas-build-request.md` template
- **Workspace:** `~/.openclaw/workspace/teams/commercial/sdr/`

### Account Executive (AE)

- **Model:** Claude Sonnet 4.6
- **Role:** Outreach and deal progression
- **Stages Owned:** Outreach → Engaged → Meeting Booked → Meeting Completed → Proposal Sent → Negotiation
- **Key Responsibility (new):** Product-led outreach composition — emails that include personalised demo website and chatbot links, engagement temperature classification
- **Workspace:** `~/.openclaw/workspace/teams/commercial/account-executive/`

### Account Manager (AM)

- **Model:** Claude Sonnet 4.6
- **Role:** Post-sale relationship management
- **Workspace:** `~/.openclaw/workspace/teams/commercial/account-manager/`

### Finance

- **Model:** Claude Haiku 4.5
- **Role:** Financial analysis, pricing, invoicing
- **Workspace:** `~/.openclaw/workspace/teams/commercial/finance/`

### Legal

- **Model:** Claude Sonnet 4.6
- **Role:** Contract review, compliance, terms
- **Workspace:** `~/.openclaw/workspace/teams/commercial/legal/`

### Market Intelligence (MI)

- **Model:** Claude Haiku 4.5
- **Role:** Market research and competitive analysis
- **Key Responsibility (new):** European market mapping, per-country market entry briefs, pricing benchmarks per geography, geographic expansion support
- **Workspace:** `~/.openclaw/workspace/teams/commercial/market-intelligence/`

### Knowledge Curator (KC)

- **Model:** Claude Sonnet 4.6
- **Role:** Documentation and knowledge management
- **Key Responsibility (new):** Outreach learning tracking, email engagement pattern documentation, template effectiveness analysis (open rates, click rates, reply rates by region/industry/product type)
- **Workspace:** `~/.openclaw/workspace/teams/commercial/knowledge-curator/`

---

## 6. Implementation Summary

Seven phases were planned and fully executed:

### Phase 1: Pipeline Types & Database Migration ✅

**Files modified:**
- `src/lib/types.ts` — Added `atlas_build` and `product_ready` to pipeline stages (now 13 total), added `LeadTemperature` type with labels and color maps
- `src/app/(app)/pipeline/_components/stage-actions.tsx` — Updated `stageOrder` array to include new stages
- `src/app/(app)/pipeline/_components/pipeline-card.tsx` — Temperature badges, Atlas build status indicator, product link badges (Site/Bot)

**Database migration (applied):**
- `supabase/migrations/20260320000001_product_led_pipeline.sql`

### Phase 2: OpenClaw Templates ✅

**Files created:**
- `~/.openclaw/workspace/templates/commercial/sdr-research-brief.md`
- `~/.openclaw/workspace/templates/commercial/sdr-atlas-build-request.md`

### Phase 3: Agent File Updates ✅

**Files modified (all `AGENTS.md`):**
- SDR — European prospecting, new stage ownership, ICP scoring, new templates
- AE — Product-led outreach, engagement temperature, new stage ownership
- MI — European market mapping, geographic expansion support
- KC — Outreach learning, template effectiveness analysis
- Hermes — Atlas Coordination Protocol, updated pipeline stages, new templates in registry

### Phase 4: Command Center UI ✅

**Files modified:**
- `src/app/(app)/command/_components/quick-actions.tsx` — Redesigned from 5 generic buttons to 9 workflow-aligned buttons in 4 groups

### Phase 5: API Routes & Server Actions ✅

**Files created:**
- `src/app/api/pipeline/atlas-delivery/route.ts`
- `src/app/api/webhooks/email-tracking/route.ts`

**Files modified:**
- `src/app/(app)/pipeline/actions.ts` — 3 new server actions
- `src/app/(app)/pipeline/[id]/page.tsx` — Atlas Delivery card, Engagement card

### Phase 6: Database Applied ✅

- Migration executed against Supabase via Node.js pg script
- `src/lib/database.types.ts` regenerated (1638 lines)

### Phase 7: Deploy ✅

- `npm run build` — zero errors (Next.js 16.1.6 Turbopack, 27 static pages, 53 routes)
- `docs/HERMES.md` — updated with all changes
- Git commit `65f3546` — "feat: product-led pipeline with Atlas build tracking and engagement scoring" (29 files changed, 2584 insertions, 260 deletions)
- Git pushed to remote
- `systemctl --user restart command-center` — service active

---

## 7. Database Changes

### New Columns on `pipeline_leads`

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `atlas_brief_sent_at` | timestamptz | null | When the build brief was sent to Atlas |
| `atlas_website_url` | text | null | URL of the demo website Atlas built |
| `atlas_chatbot_url` | text | null | URL of the demo chatbot Atlas built |
| `atlas_delivered_at` | timestamptz | null | When Atlas delivered the finished demos |
| `product_type` | text | `'both'` | `'website'`, `'chatbot'`, or `'both'` |
| `lead_temperature` | text | `'cold'` | `'cold'`, `'warm'`, `'hot'`, `'on_fire'` |
| `engagement_score` | integer | `0` | Cumulative engagement score (open:+5, click:+15, reply:+30) |

### Constraints

- `pipeline_leads_product_type_check` — product_type in ('website', 'chatbot', 'both')
- `pipeline_leads_lead_temperature_check` — lead_temperature in ('cold', 'warm', 'hot', 'on_fire')

### Indexes

- `idx_pipeline_leads_lead_temperature` — for filtering/sorting by engagement temperature
- `idx_pipeline_leads_product_type` — for filtering by product type

### Pipeline Stages (13 total)

```
discovery → enrichment → atlas_build → product_ready →
human_review → outreach → engaged → meeting_booked →
meeting_completed → proposal_sent → won / lost / disqualified
```

**New stages:** `atlas_build` (lead sent to Atlas for demo build) and `product_ready` (demo delivered, ready for human review).

---

## 8. API Routes Created

### POST `/api/pipeline/atlas-delivery`

Webhook for Atlas team to report demo build completion.

**Request body:**
```json
{
  "lead_id": "uuid",
  "website_url": "https://demo.example.com",
  "chatbot_url": "https://chatbot.example.com"
}
```

**Behavior:**
- Requires at least one of `website_url` or `chatbot_url`
- Updates lead: `stage → product_ready`, sets URLs and `atlas_delivered_at`
- Returns `{ success: true, lead_id, stage: "product_ready" }`

### POST `/api/webhooks/email-tracking`

Webhook for email engagement tracking (opens, clicks, replies).

**Request body:**
```json
{
  "lead_id": "uuid",
  "event": "open" | "click" | "reply",
  "reply_sentiment": "positive" // optional, only for reply events
}
```

**Engagement scoring:**
| Event | Points |
|-------|--------|
| open | +5 |
| click | +15 |
| reply | +30 |

**Temperature derivation:**
| Score Range | Temperature |
|-------------|-------------|
| 0-9 | cold |
| 10-29 | warm |
| 30-49 | hot |
| 50+ | on_fire |

**Special behavior:** Reply events also set `stage → engaged`.

---

## 9. UI Changes

### Quick Actions (Command Page)

Redesigned from 5 generic buttons to **9 workflow-aligned buttons in 4 groups**:

| Group | Actions |
|-------|---------|
| **Prospecting** | Find Companies, Research Company |
| **Build** | Request Atlas Build, Atlas Status |
| **Outreach** | Compose Outreach, Launch Outreach |
| **Monitor** | Pipeline Report, Team Status, Engagement Report |

Each action sends a structured command to Hermes via OpenClaw CLI. Actions that need input (Find Companies, Research Company, Request Atlas Build, Compose Outreach) open a dialog with a text field.

### Pipeline Board

- Now shows **8 visible stage columns**: Discovery → Enrichment → Atlas Build → Product Ready → Human Review → Outreach → Engaged → Meeting Booked
- Terminal stage summary row below the board
- **Pipeline cards** now show:
  - Temperature badges (cold=zinc, warm=amber, hot=red, on_fire=emerald)
  - Atlas build status ("⏳ Building website + chatbot" when in atlas_build stage)
  - Product links (Site/Bot badges with external link icons when in product_ready stage)

### Pipeline Detail Page

Two new cards added:

**Atlas Delivery Card:**
- Product type (website/chatbot/both)
- Brief sent date
- Delivery date
- Demo website link (Globe icon, external link)
- Demo chatbot link (Bot icon, external link)

**Engagement Card:**
- Temperature badge with colour coding
- Engagement score (numerical)

### Server Actions (Pipeline)

Three new server actions in `src/app/(app)/pipeline/actions.ts`:

1. **`requestAtlasBuild(leadId, productType)`** — Moves lead to `atlas_build`, sets `product_type` and `atlas_brief_sent_at`
2. **`recordAtlasDelivery(leadId, websiteUrl, chatbotUrl)`** — Moves lead to `product_ready`, sets URLs and `atlas_delivered_at`
3. **`updateLeadTemperature(leadId, temperature, engagementScore?)`** — Updates temperature and optionally engagement score

---

## 10. Agent File Updates

All updates were made to `AGENTS.md` files in each agent's workspace directory.

### SDR (`~/.openclaw/workspace/teams/commercial/sdr/AGENTS.md`)

- **European prospecting focus:** Portugal → Spain → DACH → EU expansion path
- **New stage ownership:** Discovery + Enrichment (was previously undefined)
- **New templates:** `sdr-research-brief.md` (8-section research format), `sdr-atlas-build-request.md` (build request packaging)
- **8-point ICP scoring system:** Defined scoring criteria and qualification thresholds
- **Web research pre-approved:** SDR can autonomously research companies online
- **Deprecated:** Airtable references removed (Supabase is the single source of truth)

### Account Executive (`~/.openclaw/workspace/teams/commercial/account-executive/AGENTS.md`)

- **Product-led outreach:** Emails must include personalised demo links (website + chatbot)
- **Engagement temperature classification:** Table defining cold/warm/hot/on_fire thresholds and corresponding actions
- **New stage ownership:** Outreach → Engaged → Meeting Booked → Meeting Completed → Proposal Sent → Negotiation
- **Outreach composition guidelines:** Emphasise the demo, not the pitch

### Market Intelligence (`~/.openclaw/workspace/teams/commercial/market-intelligence/AGENTS.md`)

- **European market mapping:** Per-country market entry briefs
- **Geographic expansion:** Research support for PT → ES → DACH → EU progression
- **Pricing benchmarks:** Per-geography pricing intelligence
- **Competitive landscape:** Local competitor analysis for each target market

### Knowledge Curator (`~/.openclaw/workspace/teams/commercial/knowledge-curator/AGENTS.md`)

- **Outreach learning:** Track which outreach approaches work and which don't
- **Email engagement patterns:** Document open/click/reply patterns by region, industry, product type
- **Template effectiveness:** Analyse template performance metrics to continuously refine the outreach playbook

### Hermes (`~/.openclaw/workspace/AGENTS.md`)

- **Updated pipeline stages:** 12 active stages + terminal (was 9)
- **Atlas Coordination Protocol:** Full build request flow — SDR packages brief → Hermes sends to #briefings → Atlas builds → webhook reports delivery → lead moves to product_ready
- **Communication channels:** #briefings for build requests, #atlas-hermes for direct coord, escalation path for delays >7 days
- **Updated metrics table:** New KPIs for Atlas build throughput, engagement rates
- **Template registry:** Added `sdr-research-brief.md` and `sdr-atlas-build-request.md`

---

## 11. OpenClaw Templates Created

### SDR Research Brief (`sdr-research-brief.md`)

Located at `~/.openclaw/workspace/templates/commercial/sdr-research-brief.md`

8-section structured research template:
1. **Company Identity** — Name, website, location, sector, size
2. **Online Presence** — Website quality score, mobile responsiveness, social media presence
3. **Business Profile** — Revenue range, employee count, B2B vs B2C, key services
4. **Decision Maker** — Name, title, LinkedIn, email (if public)
5. **ICP Fit Assessment** — 8-point scoring with detailed justification
6. **Pain Signals** — Identified pain points (outdated website, no chat, poor mobile, etc.)
7. **Qualification Decision** — Qualified / Needs More Research / Disqualified with reasoning
8. **Atlas Build Recommendation** — Product type (website/chatbot/both), priority level, key requirements

### SDR Atlas Build Request (`sdr-atlas-build-request.md`)

Located at `~/.openclaw/workspace/templates/commercial/sdr-atlas-build-request.md`

Build request packaging template for Atlas team:
1. **Client Info** — Company name, website, contact person, sector, location
2. **Product Type** — Website, chatbot, or both
3. **Website Analysis** — Current site assessment, key issues, improvement opportunities
4. **Online Presence** — Social profiles, review sites, directory listings
5. **Sector Info** — Industry context, competitors, typical customer expectations
6. **Additional Context** — Pain points, trigger events, special requirements
7. **Priority** — Standard (7 days) / High (3 days) / Urgent (1 day) with justification

---

## 12. Current State

### What's Live and Working

- **Command Center** running on port 9069 (`command-center.service` active)
- **OpenClaw Gateway** running on port 18789 (`openclaw-gateway.service` active)
- **Pipeline board** with 13 stages including Atlas Build and Product Ready
- **Quick Actions** with 9 product-led workflow buttons
- **Atlas delivery webhook** ready to receive demo completions
- **Email tracking webhook** ready to receive engagement events
- **Engagement scoring** auto-derives temperature from email interactions
- **All agent AGENTS.md files** updated with product-led workflow instructions
- **Templates** ready for SDR to use when researching and packaging leads

### Git Status

- Latest commit: `65f3546` on `main`
- Message: "feat: product-led pipeline with Atlas build tracking and engagement scoring"
- 29 files changed, 2,584 insertions, 260 deletions

### Database

- Migration `20260320000001_product_led_pipeline.sql` applied on Supabase
- Types regenerated in `src/lib/database.types.ts` (1,638 lines)
- New columns, constraints, and indexes all active

---

## 13. Remaining Work

These items were identified in the original plan but **not yet implemented**:

### External Tools (Phase 6 — Original Plan)

- **Email Service Integration (Resend or similar)**
  - Set up transactional email sending via API
  - Configure custom domain for email deliverability
  - Connect to email tracking webhook for opens/clicks/replies
  - Build email composition UI or integrate with AE's outreach workflow

- **Domain Setup**
  - Configure sending domain (SPF, DKIM, DMARC records)
  - Set up tracking domain for email engagement events

### Automation (Phase 7 — Original Plan)

- **Daily Prospecting Automation**
  - Cron job for SDR to autonomously prospect new companies
  - Auto-enrichment of discovered leads
  - Auto-qualification using ICP scoring

- **Follow-up Cadence**
  - Multi-step outreach sequences (day 1: initial, day 3: follow-up, day 7: final)
  - Auto-progression based on engagement signals
  - Sequence pause/resume based on temperature changes

- **Engagement Scoring Automation**
  - Real-time email webhook processing (currently endpoint exists, needs email service connection)
  - Auto-escalation of "on_fire" leads to AE for immediate follow-up
  - Daily engagement digest for Hermes

- **Weekly Report Automation**
  - Pipeline performance report generation
  - Cross-team coordination report
  - Atlas build throughput and backlog report

### Atlas Integration Enhancements

- **Automated Build Request Delivery** — When SDR qualifies a lead and packages a brief, automatically post to Atlas #briefings (currently Hermes manually coordinates)
- **Build Status Polling** — Periodic check on Atlas build status (currently relies on Atlas calling the webhook)
- **Build Quality Feedback Loop** — Track which demos convert best and feed back to Atlas

### Pipeline Intelligence

- **Conversion Rate Tracking** — Stage-to-stage conversion rates over time
- **Funnel Velocity** — Average time in each stage
- **Win/Loss Analysis** — Patterns in won vs lost deals
- **Geographic Performance** — Conversion rates by country/region

---

## Appendix A: File Inventory

### Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/20260320000001_product_led_pipeline.sql` | Database migration for product-led pipeline |
| `src/app/api/pipeline/atlas-delivery/route.ts` | Atlas demo delivery webhook |
| `src/app/api/webhooks/email-tracking/route.ts` | Email engagement tracking webhook |
| `~/.openclaw/workspace/templates/commercial/sdr-research-brief.md` | SDR research brief template |
| `~/.openclaw/workspace/templates/commercial/sdr-atlas-build-request.md` | Atlas build request template |

### Files Modified

| File | Changes |
|------|---------|
| `src/lib/types.ts` | Added atlas_build, product_ready stages; LeadTemperature type |
| `src/app/(app)/pipeline/_components/stage-actions.tsx` | Updated stageOrder |
| `src/app/(app)/pipeline/_components/pipeline-card.tsx` | Temperature badges, Atlas status, product links |
| `src/app/(app)/command/_components/quick-actions.tsx` | 9 buttons in 4 groups (was 5 generic buttons) |
| `src/app/(app)/pipeline/[id]/page.tsx` | Atlas Delivery card, Engagement card |
| `src/app/(app)/pipeline/actions.ts` | 3 new server actions |
| `src/lib/database.types.ts` | Regenerated with new columns |
| `docs/HERMES.md` | Updated with all changes |
| `~/.openclaw/workspace/AGENTS.md` | Atlas Coordination Protocol, updated stages |
| `~/.openclaw/workspace/teams/commercial/sdr/AGENTS.md` | European prospecting, ICP scoring, templates |
| `~/.openclaw/workspace/teams/commercial/account-executive/AGENTS.md` | Product-led outreach, engagement temperature |
| `~/.openclaw/workspace/teams/commercial/market-intelligence/AGENTS.md` | European market mapping |
| `~/.openclaw/workspace/teams/commercial/knowledge-curator/AGENTS.md` | Outreach learning tracking |

---

## Appendix B: Engagement Scoring Reference

### Score Accumulation

Scores are cumulative per lead, tracked via the email tracking webhook:

| Email Event | Points Added |
|-------------|-------------|
| Open | +5 |
| Click | +15 |
| Reply | +30 |

### Temperature Thresholds

| Score | Temperature | UI Badge | Recommended Action |
|-------|-------------|----------|-------------------|
| 0-9 | Cold | zinc-800/zinc-400 | Standard cadence |
| 10-29 | Warm | amber-950/amber-400 | Continue outreach, slightly increase frequency |
| 30-49 | Hot | red-950/red-400 | Prioritise follow-up, consider meeting request |
| 50+ | On Fire | emerald-950/emerald-400 | Immediate AE attention, book meeting ASAP |

### Example Scenarios

- Lead opens email once → score 5 (cold)
- Lead opens email, clicks demo link → score 20 (warm)
- Lead opens, clicks, then replies → score 50 (on_fire)
- Lead replies positively → auto-moved to "engaged" stage

---

## Appendix C: Pipeline Stage Reference

| # | Stage | Owner | Description | Board Column? |
|---|-------|-------|-------------|---------------|
| 1 | discovery | SDR | Initial identification of prospect | Yes |
| 2 | enrichment | SDR + MI | Deep research, ICP scoring, pain mapping | Yes |
| 3 | atlas_build | Atlas Team | Demo website/chatbot being built | Yes |
| 4 | product_ready | System | Demo delivered, awaiting review | Yes |
| 5 | human_review | Boss | Delphi reviews lead + demo + draft email | Yes |
| 6 | outreach | AE | Outreach email sent with demo links | Yes |
| 7 | engaged | AE (auto) | Prospect engaged (reply detected) | Yes |
| 8 | meeting_booked | AE | Meeting scheduled | Yes |
| 9 | meeting_completed | AE | Meeting held | No (below fold) |
| 10 | proposal_sent | AE | Proposal delivered | No (below fold) |
| 11 | won | Boss only | Deal closed — human decision only | Terminal |
| 12 | lost | Boss only | Deal lost — human decision only | Terminal |
| 13 | disqualified | Any agent | Lead doesn't qualify | Terminal |

**Key rule:** Agents cannot mark leads as `won` or `lost`. Only the human (Boss/Delphi) can close deals. Agents CAN disqualify leads.
