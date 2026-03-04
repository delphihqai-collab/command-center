import type { Lead } from "./types";

const HIGH_VALUE_SECTORS = [
  "technology",
  "finance",
  "healthcare",
  "energy",
  "logistics",
];

export function calculateLeadScore(lead: Lead): number {
  let score = 0;

  // Sector match: +30
  if (lead.sector && HIGH_VALUE_SECTORS.includes(lead.sector.toLowerCase())) {
    score += 30;
  }

  // Company size match: +25 (has company name and contact role suggests org size)
  if (lead.company_name && lead.contact_role) {
    score += 25;
  }

  // Has phone contact: +15
  if (lead.contact_name && lead.contact_name.trim().length > 0) {
    score += 15;
  }

  // Has proposal (qualified): +20
  if (lead.qualified) {
    score += 20;
  }

  // Active within last 7 days: +10
  if (lead.last_activity_at) {
    const daysSinceActivity =
      (Date.now() - new Date(lead.last_activity_at).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysSinceActivity <= 7) {
      score += 10;
    }
  }

  return Math.min(score, 100);
}

export function getScoreColor(score: number): string {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

export function getScoreBgColor(score: number): string {
  if (score >= 75) return "bg-emerald-500/15";
  if (score >= 50) return "bg-amber-500/15";
  return "bg-red-500/15";
}
