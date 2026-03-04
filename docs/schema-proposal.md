# Supabase Schema Proposal — Delphi Command Center

**Version:** 0.1 — Proposal for review
**Author:** HERMES
**Date:** 2026-03-04
**Status:** DRAFT — awaiting Filipe + Pedro approval before implementation

---

## Design Principles

1. **One database, multiple frontends.** Every future product — backoffice, client portal, billing dashboard — reads from this single Supabase instance.
2. **Agent-native.** Every agent action is logged. Every pipeline event is structured. No important state lives only in markdown files.
3. **Extensible over complete.** Start with what we need now. Design foreign keys and enums to support what comes next without breaking changes.
4. **Auditable.** Every record has created_at. Every status change is logged. Nothing disappears — soft deletes only.

---

## Schema Overview

### Domain 1 — Agents

**`agents`** — Registry of all agents in the Delphi system
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| slug | text UNIQUE | e.g. hermes, sdr, account-executive |
| name | text | Display name |
| type | text | director, sales, finance, legal, intelligence, knowledge |
| status | text | active, idle, built_not_calibrated, offline |
| model | text | e.g. anthropic/claude-sonnet-4-6 |
| workspace_path | text | Filesystem path to agent workspace |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**`agent_reports`** — Structured reports from agents to HERMES
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| agent_id | uuid FK → agents | |
| report_type | text | heartbeat, qualification, discovery, proposal, health_score, invoice_review, legal_review, intel_scan, deal_index |
| content | jsonb | Structured report payload |
| flagged | boolean | HERMES flagged for Boss attention |
| flag_level | text | CRITICAL, HIGH, MEDIUM, null |
| created_at | timestamptz | |

**`agent_logs`** — Low-level activity log for every agent action
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| agent_id | uuid FK → agents | |
| action | text | What the agent did |
| detail | text | Free text |
| related_entity | text | lead, client, proposal, invoice, etc. |
| related_id | uuid | FK to relevant entity |
| created_at | timestamptz | |

---

### Domain 2 — Pipeline

**`leads`** — Every prospect from first signal to qualified or closed
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_name | text | |
| contact_name | text | |
| contact_role | text | |
| source | text | How the lead was identified |
| sector | text | dental, health, other |
| country | text | |
| stage | text | prospecting, qualification, initial_contact, demo, needs_analysis, proposal_sent, negotiation, closed_won, closed_lost |
| qualified | boolean | SDR qualification decision |
| disqualified_reason | text | If qualified = false |
| assigned_agent | uuid FK → agents | |
| last_activity_at | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| archived_at | timestamptz | Soft delete |

**`lead_stage_history`** — Full audit trail of stage changes
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| lead_id | uuid FK → leads | |
| from_stage | text | |
| to_stage | text | |
| changed_by | uuid FK → agents | |
| note | text | |
| created_at | timestamptz | |

**`proposals`** — Every proposal drafted or sent
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| lead_id | uuid FK → leads | |
| status | text | drafting, gate_atlas, gate_legal, gate_finance, pending_approval, approved, sent, accepted, rejected |
| value | numeric | Total contract value |
| monthly_value | numeric | If recurring |
| payment_terms | text | e.g. net_30 |
| scope_summary | text | |
| gate_atlas_cleared | boolean | |
| gate_legal_cleared | boolean | |
| gate_finance_cleared | boolean | |
| boss_approved | boolean | |
| boss_approved_at | timestamptz | |
| sent_at | timestamptz | |
| outcome | text | accepted, rejected, ghosted, null |
| outcome_at | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### Domain 3 — Clients

**`clients`** — Every active client post-signature
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| lead_id | uuid FK → leads | Origin lead |
| company_name | text | |
| contact_name | text | |
| contact_email | text | Work domain only |
| sector | text | |
| country | text | |
| contract_start | date | |
| contract_end | date | |
| monthly_value | numeric | |
| health_status | text | healthy, at_risk, critical |
| onboarding_complete | boolean | |
| onboarding_completed_at | timestamptz | |
| assigned_am | uuid FK → agents | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| archived_at | timestamptz | Churned / soft delete |

**`client_health_history`** — Health score over time
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| client_id | uuid FK → clients | |
| health_status | text | healthy, at_risk, critical |
| product_activity | text | |
| invoice_status | text | |
| communication_status | text | |
| sentiment | text | |
| note | text | |
| recorded_by | uuid FK → agents | |
| created_at | timestamptz | |

---

### Domain 4 — Finance

**`invoices`** — Every invoice issued
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| client_id | uuid FK → clients | |
| amount | numeric | |
| due_date | date | |
| paid_at | timestamptz | |
| status | text | pending, overdue, paid, disputed |
| overdue_days | int | Updated at heartbeat |
| flagged | boolean | |
| flag_level | text | MEDIUM, HIGH, CRITICAL, null |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### Domain 5 — Approvals

**`approvals`** — Every approval request sent to Boss
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| urgency | text | CRITICAL, IMPORTANT, INFORMATIONAL |
| action_summary | text | One line — what happens if approved |
| recipient | text | |
| context | text | Two sentences max |
| draft_content | text | Exact content ready to action |
| risks_if_approved | text | |
| risks_if_rejected | text | |
| alternatives | text | |
| risk_if_delayed | text | |
| status | text | pending, approved, rejected, expired |
| approved_by | text | pedro, filipe |
| approved_at | timestamptz | |
| created_by | uuid FK → agents | |
| created_at | timestamptz | |

---

### Domain 6 — Knowledge Base

**`deal_learnings`** — Indexed by Knowledge Curator after every closed deal
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| lead_id | uuid FK → leads | |
| outcome | text | won, lost |
| icp_match_score | text | |
| stage_lost_at | text | If lost |
| deal_velocity_days | int | SQL to close |
| loss_reason_primary | text | |
| loss_reason_secondary | text | |
| loss_type | text | good_fit_loss, winnable_loss |
| key_learning | text | One-sentence distillation |
| created_at | timestamptz | |

**`onboarding_patterns`** — Indexed after every Day 30 onboarding
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| client_id | uuid FK → clients | |
| health_at_day30 | text | healthy, at_risk, critical |
| time_to_value_days | int | |
| friction_points | jsonb | |
| day7_signals | text | |
| key_learning | text | |
| created_at | timestamptz | |

---

### Domain 7 — System

**`heartbeats`** — Every scheduled cron execution
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| job_name | text | e.g. hermes-midday-update |
| fired_at | timestamptz | |
| status | text | ok, late, failed |
| summary | text | |
| created_at | timestamptz | |

---

## What This Enables

**Now:** All pipeline state queryable. Every agent action logged. Invoice and proposal status in one place.

**Next 3 months:** Backoffice dashboard. Agent control panel. Pipeline metrics computed from structured data.

**Future:** Client portal. Billing integration. Multi-product — new domain tables added without touching core schema.

---

## Implementation Order

1. **Phase 1 — Core:** agents, agent_logs, leads, lead_stage_history
2. **Phase 2 — Commercial:** proposals, clients, client_health_history, invoices, approvals
3. **Phase 3 — Intelligence:** agent_reports, deal_learnings, onboarding_patterns, heartbeats

Each phase gets a migration file in supabase/migrations/.

---

## Open Questions Before We Build

1. **RLS:** Row-level security now, or add it when the client portal is scoped?
2. **Auth:** Supabase Auth for Pedro + Filipe backoffice access, or internal-only for now?
3. **ATLAS review:** Should ATLAS review this schema before Phase 1 migrations run?

---

*Nothing has been created in Supabase yet. Approve this document before migrations run.*
