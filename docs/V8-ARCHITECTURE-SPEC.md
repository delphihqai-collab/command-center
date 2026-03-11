# V8 Architecture Spec — Mission Control Redesign

> **Complete specification for restructuring Mission Control around the core business mission: find valuable leads, contact them, qualify them, and book meetings with Delphi.**

---

## Part 1: The Business — What We're Actually Doing

### The Core Mission

Delphi runs an AI/automation services company. The product is helping businesses integrate AI agents and automation into their operations. The Hermes fleet is the commercial team — 8 AI agents whose job is to:

1. **Find** companies that need AI/automation services
2. **Research** and qualify those companies
3. **Contact** them via cold outreach (email + LinkedIn)
4. **Handle** responses and objections
5. **Schedule** discovery calls with Delphi (the human)
6. **Prepare** briefing docs so Delphi walks into calls ready

**Everything else in Mission Control exists to support this core loop.** The UI should reflect that.

### What Changes from V7

V7 treated Mission Control as a generic orchestration dashboard. V8 makes it a **commercial operations center** — the pipeline is not just a feature, it IS the product. The War Room becomes the command interface where Delphi gives orders. The sidebar reflects operational priority, not software categories.

---

## Part 2: The Agent Fleet — Who Does What

### Current Team (8 agents)

| Agent | Role | Model | Core Responsibility |
|-------|------|-------|-------------------|
| **Hermes** | Director | Sonnet | Orchestrates everything. Only agent that talks to Delphi. Routes work, escalates issues, synthesizes reports. |
| **SDR** | Worker | Sonnet | Lead outreach engine. Writes & sends emails, LinkedIn messages. Manages cadences. Handles simple replies. |
| **Account Executive (AE)** | Worker | Sonnet | Prepares discovery call materials. Writes proposals. Handles complex qualification conversations. |
| **Account Manager (AM)** | Worker | Sonnet | Post-deal relationship management. Onboarding support. Upsell identification. |
| **Market Intelligence (MI)** | Specialist | Haiku | Lead discovery engine. Scrapes signals, researches companies, builds prospect lists, enriches data. |
| **Finance** | Specialist | Haiku | Deal economics. Pricing models, ROI calculations, budget estimates for prospects. |
| **Legal** | Specialist | Sonnet | Contract templates, compliance checks, terms review. |
| **Knowledge Curator (KC)** | Specialist | Sonnet | Maintains case studies, email templates, ICP definitions, objection handling playbooks, competitive intelligence. |

### Condensed Team Assessment

**Active daily participants in the core pipeline:** MI, SDR, AE, KC, Hermes (5 agents)

**On-demand specialists (triggered by pipeline stage):** Finance (when pricing/ROI needed), Legal (when contracts involved), AM (post-close only)

**Recommendation:** Do NOT remove any agents. But the UI should make the 5 daily-active agents prominent and the 3 on-demand agents secondary. The War Room should default to assigning the full team unless the task is clearly domain-specific.

### Communication Architecture

```
Delphi (human)
    ↕ (Discord / Mission Control War Room)
Hermes (director)
    ↕ orchestrates all
    ├── MI ←→ SDR (MI feeds leads to SDR for outreach)
    ├── SDR ←→ AE (SDR hands qualified leads to AE for call prep)
    ├── SDR ←→ KC (SDR pulls email templates and playbooks from KC)
    ├── AE ←→ Finance (AE requests pricing/ROI for proposals)
    ├── AE ←→ Legal (AE requests contract review)
    ├── AE ←→ KC (AE pulls case studies for proposals)
    └── AM (activated post-close)
```

**Key rule:** Only Hermes speaks to Delphi. All escalations, daily reports, and questions route through Hermes. Delphi never directly messages sub-agents.

---

## Part 3: The Pipeline — Stage by Stage

### Redesigned Pipeline Stages (7 active + 3 terminal)

Replace the current 9 stages with a pipeline that matches the actual business flow:

| # | Stage | What Happens | Owner Agent | Human Required? | Duration |
|---|-------|-------------|-------------|-----------------|----------|
| 1 | **Discovery** | MI identifies company matching ICP. Scrapes signals (job posts, funding, tech stack, growth indicators). Creates lead with basic info. | MI | No | Continuous |
| 2 | **Enrichment** | MI/SDR enriches with firmographics, finds decision-maker contacts, scores fit. KC provides ICP criteria. | MI + SDR | No | 1-2 hours |
| 3 | **Human Review** | Delphi reviews enriched lead. Approves for outreach, rejects, or requests more info. This is the quality gate. | Hermes (presents to Delphi) | **YES — mandatory** | < 24 hours |
| 4 | **Outreach** | SDR enrolls approved lead in multi-channel sequence. Sends emails + LinkedIn over 21-day cadence. Tracks opens/clicks/replies. | SDR | No (sends autonomously) | 21-28 days |
| 5 | **Engaged** | Lead has responded positively. SDR drafts reply, Hermes escalates to Delphi for review before sending. Qualifying conversation underway. | SDR + Hermes | **YES — reviews replies** | 1-7 days |
| 6 | **Meeting Booked** | Discovery call scheduled. AE prepares pre-meeting brief. Calendar invite sent. Reminders queued. | SDR (scheduling) + AE (prep) | No | 1-5 days until meeting |
| 7 | **Meeting Completed** | Call happened. AE writes summary. Delphi decides: proposal, follow-up, or pass. | AE | **YES — Delphi runs the call** | Post-meeting |
| — | **Proposal Sent** | *(Optional)* AE drafts proposal with Finance input. Legal reviews terms. Delphi approves and sends. | AE + Finance + Legal | **YES — approves proposal** | 3-10 days |
| ✓ | **Won** | Deal closed. AM takes over for onboarding. | AM | YES | — |
| ✗ | **Lost** | Rejected or went silent. Reason logged. Lead archived for potential re-engagement in 90 days. | SDR/Hermes | No | — |
| ✗ | **Disqualified** | Not a fit. Bad data, too small, wrong market, hostile response. | Any agent | No | — |

### Why "Human Review" Is Stage 3 (Not Later)

**This is critical.** AI agents will find hundreds of leads. Not all are worth the outreach effort and domain reputation cost. Delphi reviews every lead before emails go out because:

1. **Domain reputation** — bad leads → bounces → spam folder for everyone
2. **Brand risk** — contacting the wrong company with the wrong message reflects on the business
3. **Focus** — better to contact 20 perfect leads than 200 mediocre ones
4. **Learning** — Delphi's approvals/rejections train the ICP definition over time

The human review stage should be fast — a simple approve/reject/need-more-info UI with the enrichment data presented cleanly.

### Pipeline Data Model Changes

**Current `pipeline_leads` table needs these additions:**

```sql
-- New columns for V8 pipeline
ALTER TABLE pipeline_leads ADD COLUMN icp_score integer DEFAULT 0;              -- 0-100 fit score
ALTER TABLE pipeline_leads ADD COLUMN intent_score integer DEFAULT 0;            -- 0-100 behavior score
ALTER TABLE pipeline_leads ADD COLUMN outreach_status text DEFAULT 'not_started'; -- not_started, in_sequence, paused, completed
ALTER TABLE pipeline_leads ADD COLUMN sequence_step integer DEFAULT 0;           -- current step in cadence (0-8)
ALTER TABLE pipeline_leads ADD COLUMN sequence_started_at timestamptz;           -- when outreach began
ALTER TABLE pipeline_leads ADD COLUMN last_touch_at timestamptz;                 -- last outreach attempt
ALTER TABLE pipeline_leads ADD COLUMN next_touch_at timestamptz;                 -- next scheduled touch
ALTER TABLE pipeline_leads ADD COLUMN touch_count integer DEFAULT 0;             -- total touches sent
ALTER TABLE pipeline_leads ADD COLUMN channel text DEFAULT 'email';              -- email, linkedin, multi
ALTER TABLE pipeline_leads ADD COLUMN email_opens integer DEFAULT 0;             -- tracked opens
ALTER TABLE pipeline_leads ADD COLUMN email_clicks integer DEFAULT 0;            -- tracked clicks
ALTER TABLE pipeline_leads ADD COLUMN reply_sentiment text;                      -- positive, neutral, negative, null
ALTER TABLE pipeline_leads ADD COLUMN meeting_scheduled_at timestamptz;          -- when the call is
ALTER TABLE pipeline_leads ADD COLUMN meeting_notes text;                        -- post-meeting notes
ALTER TABLE pipeline_leads ADD COLUMN review_decision text;                      -- approved, rejected, needs_info (human review)
ALTER TABLE pipeline_leads ADD COLUMN reviewed_at timestamptz;                   -- when Delphi reviewed
ALTER TABLE pipeline_leads ADD COLUMN disqualify_reason text;                    -- more specific than lost_reason
ALTER TABLE pipeline_leads ADD COLUMN company_size text;                         -- employee range
ALTER TABLE pipeline_leads ADD COLUMN company_industry text;                     -- sector
ALTER TABLE pipeline_leads ADD COLUMN company_revenue text;                      -- revenue range
ALTER TABLE pipeline_leads ADD COLUMN company_location text;                     -- HQ location
ALTER TABLE pipeline_leads ADD COLUMN company_tech_stack text[];                 -- known technologies
ALTER TABLE pipeline_leads ADD COLUMN company_website text;                      -- website URL
ALTER TABLE pipeline_leads ADD COLUMN linkedin_url text;                         -- contact LinkedIn
ALTER TABLE pipeline_leads ADD COLUMN trigger_event text;                        -- what triggered discovery
ALTER TABLE pipeline_leads ADD COLUMN re_engage_after timestamptz;               -- for lost leads: when to retry

-- Updated stage enum
-- Old: new_lead, sdr_qualification, qualified, discovery, proposal, negotiation, closed_won, closed_lost, disqualified
-- New: discovery, enrichment, human_review, outreach, engaged, meeting_booked, meeting_completed, proposal_sent, won, lost, disqualified
```

**New table: `outreach_sequences`** — tracks the multi-touch cadence per lead

```sql
CREATE TABLE outreach_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES pipeline_leads(id) ON DELETE CASCADE,
  step_number integer NOT NULL,           -- 1-8
  channel text NOT NULL,                  -- email, linkedin
  action text NOT NULL,                   -- send_email, send_connection, send_dm, engage_content
  subject text,                           -- email subject
  body text NOT NULL,                     -- message content
  status text DEFAULT 'pending',          -- pending, sent, opened, clicked, replied, bounced, skipped
  scheduled_for timestamptz NOT NULL,     -- when to send
  sent_at timestamptz,                    -- when actually sent
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  reply_content text,                     -- what they said
  reply_sentiment text,                   -- positive, neutral, negative
  created_at timestamptz DEFAULT now()
);
```

**New table: `outreach_templates`** — reusable email/message templates

```sql
CREATE TABLE outreach_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                     -- "First Touch - Tech Trigger"
  category text NOT NULL,                 -- first_touch, follow_up_1, follow_up_2, breakup, linkedin_connect, linkedin_dm
  channel text NOT NULL,                  -- email, linkedin
  subject_template text,                  -- with {variable} placeholders
  body_template text NOT NULL,            -- with {variable} placeholders
  variables text[] NOT NULL DEFAULT '{}', -- required variables list
  performance_stats jsonb DEFAULT '{}',   -- { sent: 0, opens: 0, replies: 0, meetings: 0 }
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**New table: `daily_targets`** — daily pipeline targets and actuals

```sql
CREATE TABLE daily_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  target_new_leads integer DEFAULT 50,
  target_emails_sent integer DEFAULT 100,
  target_linkedin_touches integer DEFAULT 20,
  actual_new_leads integer DEFAULT 0,
  actual_emails_sent integer DEFAULT 0,
  actual_linkedin_touches integer DEFAULT 0,
  actual_replies_received integer DEFAULT 0,
  actual_meetings_booked integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date)
);
```

---

## Part 4: The Outreach System — How Agents Contact Leads

### The 21-Day Multi-Channel Cadence

Every approved lead enters this sequence. SDR personalizes each touch using KC's templates + MI's enrichment data.

| Day | Channel | Action | Template Category |
|-----|---------|--------|------------------|
| 1 | LinkedIn | Connection request with personalized note (no pitch) | `linkedin_connect` |
| 2 | Email | First touch — value-led, trigger-based, problem-aware | `first_touch` |
| 4 | LinkedIn | Engage with their content (like/comment) if connected | `linkedin_engage` |
| 6 | Email | Follow-up #1 — different angle, case study | `follow_up_1` |
| 9 | LinkedIn | Direct message — short, conversational | `linkedin_dm` |
| 12 | Email | Follow-up #2 — social proof, results from similar company | `follow_up_2` |
| 16 | Email | Follow-up #3 — breakup/last chance | `breakup` |
| 21 | LinkedIn | Final touch — share relevant resource, no pitch | `linkedin_final` |

**After 21 days with no engagement:** Mark as `lost`, set `re_engage_after` to 90 days from now.

**If lead engages at any step:** Pause sequence, move to `engaged` stage, Hermes escalates to Delphi.

### Email Templates (Stored in `outreach_templates`)

**First Touch (Day 2):**
```
Subject: {trigger_event_short} + AI automation

Hi {first_name},

I noticed {company} recently {trigger_event_detail}.

When companies hit that stage, {role_type} teams usually end up handling
{pain_point} manually — which eats 15-20 hours/week that could go to
higher-value work.

We build AI agents that handle {solution_outcome} end-to-end. One recent
client in {industry} cut their {metric} by {result}.

Worth a 15-minute call to see if something similar applies to {company}?

Best,
{sender_name}
{sender_title}
```

**Follow-Up 1 (Day 6):**
```
Subject: re: {previous_subject}

Hi {first_name},

Quick follow-up — wanted to share a specific example.

We helped a {similar_company_type} automate their {process}. They went
from {old_state} to {new_state} in {timeframe}.

The part that surprised them: the AI agents handled {unexpected_benefit}.

Here's the 2-minute case study: {link}

Would {day_of_week} or {day_of_week} work for a quick call?

{sender_name}
```

**Follow-Up 2 (Day 12):**
```
Subject: {peer_company} is doing this

Hi {first_name},

One thing I keep hearing from {role_type} at {industry} companies:
"{common_pain_quote}"

That's exactly what {reference_company} solved with AI agents handling
their {process}. Result: {specific_metric}.

If this is on your radar, I'd love 15 minutes to show you what it looks
like. If not, no worries — happy to reconnect later.

{sender_name}
```

**Breakup (Day 16):**
```
Subject: closing the loop

Hi {first_name},

I've reached out a few times and know you're busy. I'll keep this short.

If automating {process} isn't a priority right now, totally understand.
I'll close out my follow-ups.

If anything changes: {calendar_link}

All the best,
{sender_name}
```

**LinkedIn Connection Request (Day 1):**
```
Hi {first_name} — I work with {industry} companies on AI automation
for {process_area}. Would love to connect and share insights from the
space.
```

**LinkedIn DM (Day 9):**
```
Thanks for connecting, {first_name}. Quick question: is your team
currently handling {process} manually, or have you started looking
at automation?

Happy to share what's working for similar companies either way.
```

### Response Handling Decision Tree

```
Lead replies →
├── POSITIVE ("tell me more", "sounds interesting", "sure let's talk")
│   → SDR drafts personalized response with case study + meeting CTA
│   → Hermes sends draft to Delphi for review via War Room
│   → Delphi approves/edits → SDR sends
│   → Lead moves to "engaged"
│
├── QUESTION ("how does it work?", "what's the cost?", "what results?")
│   → SDR drafts answer using KC's FAQ/playbook content
│   → Hermes sends draft to Delphi for review
│   → Lead stays in "outreach" or moves to "engaged" if substantive
│
├── OBJECTION ("we already have something", "not the right time")
│   → SDR drafts objection-handling response from KC's playbook
│   → Hermes sends draft to Delphi for review
│   → If Delphi says "drop it" → mark lost with reason
│
├── MEETING REQUEST ("sure, let's talk", "send me times")
│   → SDR sends calendar link AUTOMATICALLY (no human needed)
│   → Lead moves to "meeting_booked"
│   → AE begins pre-meeting brief preparation
│
├── NOT INTERESTED / UNSUBSCRIBE
│   → SDR sends polite close AUTOMATICALLY
│   → Lead moves to "lost", reason: "not_interested"
│   → Set re_engage_after = 90 days
│
├── OUT OF OFFICE
│   → SDR pauses sequence, reschedules next touch for return date
│   → No human needed
│
├── BOUNCE / INVALID
│   → Lead moves to "disqualified", reason: "invalid_contact"
│
└── HOSTILE / THREATENING
    → SDR archives immediately, no response
    → Hermes flags to Delphi for awareness
```

### When Hermes Escalates to Delphi

Hermes presents these to Delphi through the War Room (not random messages):

1. **New leads for review** — batch of enriched leads needing approve/reject (daily)
2. **Reply drafts needing approval** — when a lead responds positively or with questions
3. **Daily pipeline report** — leads found, emails sent, replies received, meetings booked
4. **Anomalies** — unusual bounce rate, deliverability issues, hostile responses
5. **Meeting prep** — pre-meeting brief 24h before scheduled calls
6. **Weekly summary** — pipeline health, conversion rates, template performance

---

## Part 5: The War Room — Redesigned

### What War Room Becomes

The War Room is NOT a generic multi-agent collaboration space. It's **Delphi's command interface** — where Delphi tells Hermes what the team should do.

### War Room Has Two Modes

#### Mode 1: The Core Pipeline (Always Running)

This is the default, permanent "war room" — the daily lead generation pipeline. It's not something you create and destroy. It's always there. Configuration:

- **Daily target:** Find X new leads (default: 50)
- **Outreach target:** Send X touches per day (default: 100)
- **ICP definition:** What makes a good lead (industry, size, tech stack, geography)
- **Active sequences:** Which outreach cadence is running
- **Template set:** Which email/LinkedIn templates are active
- **Human review queue:** Leads waiting for Delphi's approve/reject
- **Reply review queue:** Drafts waiting for Delphi's approve/edit/reject

This is the main screen when you open the War Room. It shows:
- Today's targets vs actuals (leads found, emails sent, replies, meetings)
- Review queue (leads to approve + reply drafts to approve)
- Pipeline funnel visualization (how many leads at each stage)
- Active cadences and their performance
- This week's scheduled meetings

#### Mode 2: Custom Operations (On-Demand Tasks)

Below the core pipeline dashboard, there's a section for ad-hoc tasks:

- "Research 20 companies in the fintech space in Germany"
- "Draft a new outreach sequence for healthcare companies"
- "Prepare a competitive analysis against {competitor}"
- "Update all email templates to mention our new case study"

These are one-off or time-bound tasks. Delphi creates them, Hermes allocates agents. By default, Hermes decides who to assign. Delphi can override.

### War Room Data Model Changes

**Modify `war_rooms` table:**

```sql
ALTER TABLE war_rooms ADD COLUMN type text DEFAULT 'operation'; -- 'core_pipeline' or 'operation'
ALTER TABLE war_rooms ADD COLUMN config jsonb DEFAULT '{}';     -- for core_pipeline: targets, ICP, etc.

-- The core pipeline war room is a singleton — created once, never deleted
-- Operations are created/completed/archived as needed
```

**New table: `review_queue`** — items waiting for Delphi's decision

```sql
CREATE TABLE review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,                      -- 'lead_review' or 'reply_review'
  lead_id uuid REFERENCES pipeline_leads(id),
  sequence_id uuid REFERENCES outreach_sequences(id), -- for reply reviews
  agent_id uuid REFERENCES agents(id),     -- who prepared this
  summary text NOT NULL,                   -- AI-generated summary for quick review
  detail jsonb NOT NULL,                   -- full context (enrichment data or draft reply)
  status text DEFAULT 'pending',           -- pending, approved, rejected, needs_info
  decision_notes text,                     -- Delphi's notes
  created_at timestamptz DEFAULT now(),
  decided_at timestamptz
);
```

### War Room UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  WAR ROOM                                           [+ New] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TODAY'S PIPELINE          (core pipeline KPIs)             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│  │ 47/50│ │89/100│ │12/20 │ │  3   │ │  1   │            │
│  │Leads │ │Emails│ │LI    │ │Reply │ │Meet  │            │
│  │Found │ │Sent  │ │Touch │ │Recvd │ │Booked│            │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘            │
│                                                             │
│  ━━━ REVIEW QUEUE (5 items) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  🟡 LEAD REVIEW — TechCorp GmbH                           │
│     AI/ML Engineer hiring · Berlin · 120 employees          │
│     ICP Score: 78/100 · Trigger: AI job posting             │
│     [✓ Approve] [✗ Reject] [? Need Info]                   │
│                                                             │
│  🟡 LEAD REVIEW — DataFlow Inc                             │
│     Series B · San Francisco · 85 employees                 │
│     ICP Score: 82/100 · Trigger: Manual process complaints  │
│     [✓ Approve] [✗ Reject] [? Need Info]                   │
│                                                             │
│  🔵 REPLY DRAFT — Sarah Chen @ AutomateIO                  │
│     She said: "Interesting, tell me more about pricing"     │
│     SDR drafted: "Hi Sarah, great question. For a team..."  │
│     [✓ Send] [✎ Edit] [✗ Don't Send]                      │
│                                                             │
│  ━━━ PIPELINE FUNNEL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  Discovery:  ████████████████████ 342                       │
│  Enrichment: ██████████ 156                                 │
│  Review:     ███ 47                                         │
│  Outreach:   ████████████████ 289                           │
│  Engaged:    ██ 12                                          │
│  Meeting:    █ 3                                            │
│  Won:        █ 1                                            │
│                                                             │
│  ━━━ UPCOMING MEETINGS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  📅 Thu Mar 13, 14:00 — TechCorp GmbH                      │
│     Contact: Jan Mueller, Head of Ops                       │
│     Prep brief ready ✓                                      │
│                                                             │
│  ━━━ ACTIVE OPERATIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  🔶 Research fintech companies in DACH region               │
│     Status: In Progress · 23/50 found · MI + SDR            │
│                                                             │
│  ✅ Update outreach templates for Q1 case study             │
│     Completed 2 days ago · KC                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 6: Sidebar Redesign

### Current Sidebar (V7)

```
Core:     Overview · Agents · Pipeline · Sessions · Office · Team Analysis · War Room
Observe:  Logs · Tokens · Memory
Automate: Cron · Webhooks · Alerts
Admin:    Audit · Gateways · Integrations · Settings
```

### Problems
1. Too many items in Core — 7 items with no clear hierarchy
2. Sessions is vague and not operational
3. Pipeline and War Room are separate but should be integrated
4. Office and Team Analysis overlap conceptually
5. Top section mixes operational (Pipeline, War Room) with config/monitoring (Sessions, Office)

### New Sidebar (V8)

```
OPERATE
  War Room        ← Command center. THE main page. Daily pipeline + review queue + operations
  Pipeline        ← Full pipeline board. Visual kanban of all leads across stages
  Agents          ← Fleet overview. Agent cards with status

MONITOR
  Office          ← Nerve center visualization (hub-and-spoke, replaces Team Analysis topology)
  Sessions        ← Live OpenClaw sessions
  Tokens          ← Cost tracking
  Logs            ← System + agent logs

CONFIGURE
  Cron            ← Scheduled tasks
  Templates       ← Outreach templates + sequences (NEW)
  Memory          ← Agent memory files
  Webhooks        ← Webhook management
  Alerts          ← Alert rules

ADMIN
  Audit           ← Audit log
  Gateway         ← Gateway config
  Integrations    ← Third-party connections
  Settings        ← App settings
```

### Key Changes
- **War Room is #1** — it's the daily ops dashboard, the first thing Delphi sees
- **Pipeline is #2** — the visual board of all leads
- **Agents is #3** — fleet status at a glance
- **Team Analysis removed** — topology visualization folded into Office; the org optimization stuff was premature
- **Templates is NEW** — outreach templates need their own management page
- **Sessions moved to Monitor** — it's monitoring, not operations
- **Groups renamed** — Operate / Monitor / Configure / Admin (clearer intent)

### Pages to Remove
- **Team Analysis** (`/team-analysis`) — topology viz moves to Office, pools/experiments were speculative
- **Dashboard** (`/dashboard`) → War Room replaces it as the home page

### Pages to Add
- **Templates** (`/templates`) — outreach template CRUD, performance stats, A/B test results

### Pages to Significantly Redesign
- **War Room** (`/war-room`) — from generic collab rooms to the command center described in Part 5
- **Pipeline** (`/pipeline`) — new stages, outreach tracking, enrichment data display
- **Office** (`/office`) — absorb the topology viz, add fleet health summary

---

## Part 7: The Daily Pipeline Loop — How It Actually Runs

### Cron-Driven Daily Cycle

These cron jobs power the automated pipeline:

| Time | Job | Agent | What Happens |
|------|-----|-------|-------------|
| 06:00 | `morning-discovery` | MI | Find 50 new leads matching ICP. Enrich basic data. Create as `discovery` stage. |
| 07:00 | `enrichment-run` | MI + SDR | Full enrichment on yesterday's discovery leads. Score them. Move to `enrichment` → `human_review`. |
| 08:00 | `review-digest` | Hermes | Compile all leads in `human_review` into a digest. Notify Delphi via Discord. Show count in War Room badge. |
| *Delphi reviews* | — | — | *Delphi opens War Room, approves/rejects leads. Approved leads move to `outreach`.* |
| 09:00 | `outreach-execute` | SDR | Send today's scheduled touches across all active sequences. Respect daily sending limits. |
| 12:00 | `reply-check` | SDR | Check for new replies. Draft responses. Queue positive/question replies for Delphi review. Auto-handle negatives and OOO. |
| 14:00 | `reply-check-2` | SDR | Second reply check. |
| 17:00 | `daily-report` | Hermes | Compile daily stats: leads found, approved, emails sent, replies, meetings booked. Send to Delphi. |
| 20:00 | `sequence-management` | SDR | Archive leads with completed sequences and no engagement. Set re-engage dates. Clean up. |

### Weekend Behavior

- Discovery and enrichment continue (MI runs 7 days)
- Outreach pauses on weekends (emails sent Mon-Fri only)
- Reply checks run 7 days (people reply on weekends)
- Delphi can review queue whenever convenient

### Daily Targets (Configurable in War Room)

| Metric | Default Target | Ramp Month 1 | Ramp Month 2 | Full Speed |
|--------|---------------|-------------|-------------|-----------|
| New leads discovered | 50/day | 15/day | 30/day | 50/day |
| Leads enriched | Same | Same | Same | Same |
| Emails sent | 100/day | 25/day | 60/day | 100/day |
| LinkedIn touches | 20/day | 5/day | 12/day | 20/day |
| Total touches | 120/day | 30/day | 72/day | 120/day |

### Expected Monthly Metrics (At Full Speed)

| Metric | Conservative | Target | Stretch |
|--------|-------------|--------|---------|
| Leads discovered | 1,000 | 1,500 | 2,000 |
| Leads approved (after human review) | 300 | 500 | 700 |
| Emails sent | 2,000 | 3,000 | 4,000 |
| Reply rate | 2% | 5% | 8% |
| Positive replies | 15 | 50 | 100 |
| Meetings booked | 3 | 8 | 15 |

---

## Part 8: Lead Scoring — The ICP Model

### ICP (Ideal Customer Profile)

Stored in `system_config` as `icp_definition`, editable via War Room config:

```json
{
  "target_industries": ["technology", "fintech", "saas", "e-commerce", "logistics", "healthcare_tech"],
  "company_size": { "min": 30, "max": 500 },
  "revenue_range": { "min": 2000000, "max": 100000000 },
  "geographies": ["DACH", "Western Europe", "US", "UK"],
  "tech_signals": ["uses CRM", "has automation tools", "cloud-native stack"],
  "negative_signals": ["government", "non-profit", "pre-revenue startup", "< 10 employees"],
  "trigger_events": [
    "AI/ML job postings",
    "Manual process complaints (social/glassdoor)",
    "Recent funding round",
    "Growth hiring (ops/data roles)",
    "Tech stack migration",
    "New leadership (CTO/COO/VP Ops)"
  ]
}
```

### Scoring Model (0-100)

**Fit Score (0-50):**

| Signal | Points |
|--------|--------|
| Industry match | 10 |
| Company size in range | 10 |
| Revenue in range | 10 |
| Geography match | 5 |
| Tech stack signals present | 10 |
| No negative signals | 5 |

**Intent Score (0-50):**

| Signal | Points |
|--------|--------|
| Trigger event detected | 15 |
| AI/automation job posting | 10 |
| Recent funding | 10 |
| Growth indicators | 10 |
| Referral/inbound | 20 |

**Total = Fit + Intent. Threshold: 60+ recommended for outreach.**

---

## Part 9: Meeting Flow — From Booking to Close

### Pre-Meeting (AE Prepares)

When a lead moves to `meeting_booked`:

1. AE generates a **Pre-Meeting Brief** (stored in `pipeline_leads.metadata`):
   - Company overview (size, industry, funding, tech stack)
   - Contact bio (LinkedIn summary, role, tenure)
   - How they entered the pipeline (trigger event)
   - Outreach history (which emails, what they replied to)
   - Likely pain points (extracted from correspondence)
   - Recommended talking points
   - Potential deal size estimate
   - Competitors they might be evaluating

2. SDR sends:
   - Calendar invite with meeting link
   - 24-hour reminder email
   - 1-hour reminder email

3. Hermes sends brief to Delphi 24h before the call.

### Post-Meeting (Delphi Decides)

After the call, Delphi has 4 options in the pipeline detail page:

1. **Send Proposal** → Lead moves to `proposal_sent`. AE drafts proposal, Finance adds pricing, Legal reviews terms. Delphi approves and sends.
2. **Schedule Follow-Up** → Another meeting scheduled. Lead stays in `meeting_completed`.
3. **Mark Won** → Lead moves to `won`. AM activated for onboarding.
4. **Mark Lost** → Lead moves to `lost` with reason. 90-day re-engage timer set.

---

## Part 10: Frontend Implementation Changes

### New Components Needed

| Component | Location | Purpose |
|-----------|----------|---------|
| `review-queue.tsx` | `/war-room/_components/` | Approve/reject lead reviews and reply drafts |
| `pipeline-targets.tsx` | `/war-room/_components/` | Today's KPIs vs targets (progress bars) |
| `pipeline-funnel.tsx` | `/war-room/_components/` | Horizontal funnel chart of leads per stage |
| `upcoming-meetings.tsx` | `/war-room/_components/` | Calendar-style meeting list with brief links |
| `operations-list.tsx` | `/war-room/_components/` | Active + completed custom operations |
| `create-operation.tsx` | `/war-room/_components/` | Dialog to create custom task for the team |
| `icp-config.tsx` | `/war-room/_components/` | ICP definition editor (in War Room settings) |
| `sequence-timeline.tsx` | `/pipeline/_components/` | Outreach sequence progress for a lead |
| `enrichment-card.tsx` | `/pipeline/_components/` | Company enrichment data display |
| `lead-review-card.tsx` | `/pipeline/_components/` | Quick-review card for lead approval |
| `template-editor.tsx` | `/templates/_components/` | Template CRUD with variable highlighting |
| `template-stats.tsx` | `/templates/_components/` | Template performance metrics |

### Pipeline Board Changes

The 6-column kanban board needs to update to new stages:

**Visible columns:** Discovery → Enrichment → Review → Outreach → Engaged → Meeting Booked

**Cards show different data per stage:**
- Discovery/Enrichment: company name, industry, size, trigger event
- Review: + ICP score, enrichment summary, approve/reject buttons inline
- Outreach: + sequence progress (step 3/8), last touch, opens/clicks
- Engaged: + reply preview, sentiment badge
- Meeting Booked: + meeting date/time, brief status (ready/pending)

### Pipeline Detail Page Redesign

The lead detail page needs these new sections:

1. **Company Profile** — enrichment data (industry, size, revenue, tech stack, website, location)
2. **Contact Info** — name, email, role, LinkedIn
3. **Score Card** — ICP score breakdown (fit + intent) with explanation
4. **Trigger Event** — what caused MI to find this lead
5. **Outreach Timeline** — visual timeline of all touches (sent, opened, clicked, replied)
6. **Correspondence** — actual email/message content and replies
7. **Meeting Prep** — pre-meeting brief (if stage >= meeting_booked)
8. **Stage Actions** — contextual actions based on current stage

### War Room Page — Complete Rewrite

The War Room page has two tabs:

**Tab 1: Pipeline Command (default)**
- KPI row: targets vs actuals (leads, emails, LinkedIn, replies, meetings)
- Review queue section with approve/reject interface
- Pipeline funnel chart
- Upcoming meetings
- Weekly trend mini-charts (leads in, meetings booked)

**Tab 2: Operations**
- Create new operation (name, objective, optional agent assignment — defaults to "Hermes decides")
- Active operations with status, progress, assigned agents
- Completed/archived operations

### Templates Page — New

`/templates` — outreach template management:

- Grid of templates organized by category (first_touch, follow_ups, breakup, linkedin)
- Each card shows: name, category, channel, preview snippet, performance (sent/opens/replies)
- Click to edit: full template editor with {variable} syntax highlighting
- Performance dashboard: which templates generate the most replies and meetings
- Ability to A/B test by running multiple templates for the same sequence step

---

## Part 11: API Route Changes

### New Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `GET /api/pipeline/review-queue` | GET | Pending lead reviews + reply drafts for Delphi |
| `POST /api/pipeline/review` | POST | Submit review decision (approve/reject/needs_info) |
| `GET /api/pipeline/targets` | GET | Today's pipeline targets vs actuals |
| `PUT /api/pipeline/targets` | PUT | Update daily targets |
| `GET /api/pipeline/funnel` | GET | Lead counts per stage |
| `GET /api/templates` | GET | List outreach templates |
| `POST /api/templates` | POST | Create template |
| `PUT /api/templates/[id]` | PUT | Update template |
| `DELETE /api/templates/[id]` | DELETE | Delete template |
| `GET /api/sequences/[leadId]` | GET | Outreach sequence for a lead |
| `GET /api/icp` | GET | Current ICP definition |
| `PUT /api/icp` | PUT | Update ICP definition |

### Modified Routes

| Route | Change |
|-------|--------|
| `POST /api/agent/pipeline` | Support new stages, accept enrichment fields |
| `PATCH /api/agent/pipeline` | Allow updating outreach tracking fields (opens, clicks, etc.) |

---

## Part 12: Database Migration Summary

### New Tables (4)

1. `outreach_sequences` — per-lead, per-step outreach tracking
2. `outreach_templates` — reusable message templates
3. `daily_targets` — daily pipeline targets and actuals
4. `review_queue` — items pending Delphi's decision

### Modified Tables (2)

1. `pipeline_leads` — 20+ new columns for enrichment, scoring, outreach tracking
2. `war_rooms` — add `type` and `config` columns

### Tables to Potentially Remove (3)

These were speculative V7 additions that don't serve the core pipeline:

1. `agent_pools` — elastic scaling is premature (we have 8 fixed agents)
2. `fleet_experiments` — A/B testing should be on templates, not fleet structure
3. `team_topology` — direct channels are configured in agent workspace files, not a DB table

**Decision:** Keep them for now (no harm), but remove from the UI. They can be re-surfaced later if needed.

### Pipeline Stage Migration

The `pipeline_leads.stage` column needs to accept new values:

```sql
-- Old stages: new_lead, sdr_qualification, qualified, discovery, proposal, negotiation, closed_won, closed_lost, disqualified
-- New stages: discovery, enrichment, human_review, outreach, engaged, meeting_booked, meeting_completed, proposal_sent, won, lost, disqualified

-- Migration: map existing leads
UPDATE pipeline_leads SET stage = 'discovery' WHERE stage = 'new_lead';
UPDATE pipeline_leads SET stage = 'outreach' WHERE stage = 'sdr_qualification';
UPDATE pipeline_leads SET stage = 'outreach' WHERE stage = 'qualified';
-- 'discovery' stays as 'discovery'
-- 'proposal' stays as 'proposal_sent'
UPDATE pipeline_leads SET stage = 'proposal_sent' WHERE stage = 'proposal';
-- 'negotiation' → 'engaged' (closest match)
UPDATE pipeline_leads SET stage = 'engaged' WHERE stage = 'negotiation';
UPDATE pipeline_leads SET stage = 'won' WHERE stage = 'closed_won';
UPDATE pipeline_leads SET stage = 'lost' WHERE stage = 'closed_lost';
-- 'disqualified' stays as 'disqualified'
```

---

## Part 13: Agent Workspace File Updates

Each agent's workspace files need to be updated to reflect the V8 pipeline and their specific responsibilities within it.

### Hermes — AGENTS.md Update

The sub-agent roster should specify the pipeline flow:

```markdown
## Pipeline Flow

1. MI discovers leads → creates at "discovery" stage
2. MI + SDR enriches → moves to "enrichment"
3. Hermes batches for review → moves to "human_review", notifies Delphi
4. Delphi approves → SDR enrolls in sequence → "outreach"
5. Lead replies positively → SDR drafts response → "engaged"
6. Hermes escalates draft to Delphi → Delphi approves
7. Meeting scheduled → AE prepares brief → "meeting_booked"
8. Delphi takes the call → decides outcome → won/lost/follow-up

## Escalation Rules
- ANY positive reply from a lead → draft + escalate to Delphi
- ANY pricing/scope/legal question → escalate to Delphi
- Daily: batch all review-queue items for Delphi's morning review
- NEVER send a reply to an interested lead without Delphi's approval
- ALWAYS send calendar links automatically for explicit meeting requests
```

### SDR — SOUL.md Update

SDR needs clear outreach protocols:

```markdown
## Outreach Rules
- NEVER send emails on weekends
- NEVER exceed daily sending limits (configured in War Room)
- ALWAYS personalize using MI's enrichment data + KC's templates
- ALWAYS reference the trigger event in first touch
- For replies: draft response and hand to Hermes for Delphi review
- For "meeting requests": send calendar link immediately (no review needed)
- For "not interested": send polite close and archive
- Track all sends/opens/clicks/replies in outreach_sequences table
```

### MI — SOUL.md Update

```markdown
## Discovery Rules
- Run ICP scoring on every lead before submitting
- Only submit leads with ICP score >= 40 (lower threshold for discovery)
- Include trigger_event for every lead (what made you find them)
- Enrich with: industry, size, revenue, location, tech stack, website
- Find best contact: prioritize Head of Ops, CTO, VP Engineering, CEO (for small cos)
- Check for duplicates before creating (company_name + contact_email)
```

### KC — SOUL.md Update

```markdown
## Knowledge Responsibilities
- Maintain outreach template library (outreach_templates table)
- Track template performance and recommend updates
- Maintain objection handling playbook
- Maintain case study library for personalization
- Maintain ICP definition based on Delphi's approval patterns
- Maintain competitive intelligence briefs
```

---

## Part 14: Cron Job Changes

### Remove
- All "heartbeat" cron jobs for sub-agents (11 jobs) — these are noise. Replace with meaningful pipeline tasks.
- Generic Hermes orchestration crons (5 jobs) — replace with pipeline-specific crons.

### Add (9 pipeline cron jobs)

| ID | Agent | Schedule | Session | Prompt |
|----|-------|----------|---------|--------|
| `morning-discovery` | MI | `cron: 0 6 * * *` | isolated | "Run daily lead discovery. Find {target} companies matching current ICP. Enrich with basic data. Create as discovery stage leads." |
| `enrichment-run` | SDR | `cron: 0 7 * * *` | isolated | "Run enrichment pass on all discovery-stage leads from yesterday. Score with ICP model. Move enriched leads to human_review." |
| `review-digest` | Hermes | `cron: 0 8 * * *` | main | "Compile leads in human_review stage. Count pending. Notify Delphi via Discord with summary and link to War Room." |
| `outreach-execute` | SDR | `cron: 0 9 * * 1-5` | isolated | "Execute today's scheduled outreach touches. Send emails and LinkedIn messages per active sequences. Respect daily limits." |
| `reply-check-am` | SDR | `cron: 0 12 * * *` | isolated | "Check for new replies across all channels. Process per response handling rules. Queue positive replies for Delphi review." |
| `reply-check-pm` | SDR | `cron: 0 15 * * *` | isolated | "Afternoon reply check. Same as morning." |
| `daily-report` | Hermes | `cron: 0 17 * * *` | main | "Generate daily pipeline report. Leads found, approved, emailed, replied, meetings booked. Send to Delphi." |
| `sequence-cleanup` | SDR | `cron: 0 20 * * *` | isolated | "Archive leads with completed sequences and no engagement. Set re-engage dates. Update sequence statuses." |
| `weekly-summary` | Hermes | `cron: 0 10 * * 1` | main | "Generate weekly pipeline summary. Conversion rates, template performance, pipeline health, recommendations." |

---

## Part 15: What to Build in What Order

### Phase 1: Database + Pipeline Core (Must Do First)

1. Migration: new `pipeline_leads` columns + stage changes
2. Migration: `outreach_sequences` table
3. Migration: `outreach_templates` table
4. Migration: `daily_targets` table
5. Migration: `review_queue` table
6. Migration: `war_rooms` type/config columns
7. Update `src/lib/types.ts` with new stages and types
8. Regenerate `database.types.ts`

### Phase 2: War Room Redesign

9. Rewrite `/war-room/page.tsx` — two-tab layout (Pipeline Command + Operations)
10. Build `review-queue.tsx` component — approve/reject interface
11. Build `pipeline-targets.tsx` — daily KPIs
12. Build `pipeline-funnel.tsx` — stage distribution
13. Build `upcoming-meetings.tsx` — meeting list
14. Build `operations-list.tsx` + `create-operation.tsx` — custom tasks
15. New API routes: `/api/pipeline/review-queue`, `/api/pipeline/review`, `/api/pipeline/targets`, `/api/pipeline/funnel`

### Phase 3: Pipeline Board Redesign

16. Update pipeline board to new 6-column stages
17. Redesign pipeline cards per stage (different info at each stage)
18. Update pipeline detail page with enrichment, scoring, outreach timeline
19. Build `sequence-timeline.tsx` — visual outreach progress
20. Build `enrichment-card.tsx` — company data display

### Phase 4: Templates Page

21. Build `/templates/page.tsx` — template list
22. Build `template-editor.tsx` — create/edit with variable syntax
23. Build `template-stats.tsx` — performance metrics
24. API routes: `/api/templates` CRUD

### Phase 5: Sidebar + Navigation

25. Update sidebar to new 4-group structure
26. Set War Room as default/home route
27. Remove Team Analysis from sidebar
28. Add Templates to sidebar

### Phase 6: Agent Configuration

29. Update cron jobs (remove old, add 9 new pipeline crons)
30. Update agent workspace files (SOUL.md, AGENTS.md per agent)
31. Update Office page to absorb useful topology elements

### Phase 7: Polish

32. Update HERMES.md
33. Build passes
34. Service restart

---

## Part 16: What This Spec Does NOT Cover (Future)

These are important but not in V8 scope:

- **Actual email sending infrastructure** — need to set up SMTP relay, domain warmup, tracking pixels. This is a separate project.
- **LinkedIn automation** — requires LinkedIn API access or browser automation tool. Separate project.
- **Calendar integration** — need to connect Google Calendar / Cal.com. Separate project.
- **Email tracking** — open/click tracking requires dedicated email service (SendGrid, Resend, etc.)
- **CRM sync** — if Delphi uses an external CRM, need to sync pipeline data
- **Actual AI prompt engineering** — the agent workspace files need real, tested prompts. This spec defines what they should do, not the exact prompt text.

V8 builds the **command center and data model** that makes all of this possible. The actual agent behaviors (sending real emails, scraping real data) depend on external integrations that are wired up separately.

---

## Summary

V8 transforms Mission Control from a generic agent dashboard into a **commercial pipeline operations center**:

1. **War Room** is the daily command post — Delphi reviews leads, approves replies, monitors targets
2. **Pipeline** is redesigned around the actual sales flow — discovery through meeting
3. **Human-in-the-loop** at two critical points: lead approval and reply approval
4. **Agents have specific roles** in a concrete daily pipeline loop powered by cron
5. **Templates system** makes outreach scalable and measurable
6. **Sidebar reflects priorities** — Operate first, Monitor second, Configure third
7. **Only Hermes talks to Delphi** — all escalations route through the director

The goal: **reliably book 8-15 qualified discovery meetings per month** through AI-powered outbound prospecting, with Delphi as the quality gate and closer.
