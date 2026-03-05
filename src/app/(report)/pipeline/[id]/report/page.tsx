import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PIPELINE_STAGE_LABELS } from "@/lib/types";
import type { PipelineStage } from "@/lib/types";
import { format } from "date-fns";
import { PrintTrigger, PrintToolbar } from "./_components/print-trigger";

interface Props {
  params: Promise<{ id: string }>;
}

interface BriefSection {
  title: string;
  content: string;
}

interface BantItem {
  letter: string;
  label: string;
  verdict: string;
  confidence: string;
  details: string[];
}

/**
 * Parses the SDR brief's structured text into clean sections.
 * The brief uses ──── separator pairs with ALL-CAPS headers between them.
 */
function parseBrief(raw: string): {
  decision: string;
  bantScore: string;
  prospect: Record<string, string>;
  bantItems: BantItem[];
  sections: BriefSection[];
} {
  // Strip markdown envelope: # title, **bold** lines, ---, code fences
  let text = raw
    .replace(/^#[^\n]*\n/gm, "")
    .replace(/^\*\*[^*]+\*\*[^\n]*\n/gm, "")
    .replace(/^---\s*\n/gm, "")
    .replace(/^```[^\n]*\n/gm, "")
    .replace(/\n```\s*$/gm, "");
  // Also strip trailing code fences anywhere
  text = text.replace(/```/g, "").trim();

  // Split on separator lines (10+ ─ chars)
  const blocks = text.split(/─{10,}/);

  let decision = "";
  let bantScore = "";
  const prospect: Record<string, string> = {};
  const bantItems: BantItem[] = [];
  const sections: BriefSection[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;

    // The opening block contains DECISION, BANT SCORE
    if (block.includes("DECISION:") && block.includes("BANT SCORE:")) {
      for (const line of block.split("\n")) {
        const l = line.trim();
        if (l.startsWith("DECISION:")) {
          decision = l.replace("DECISION:", "").replace(/⚠️/g, "").trim();
        } else if (l.startsWith("BANT SCORE:")) {
          bantScore = l.replace("BANT SCORE:", "").trim();
        }
      }
      continue;
    }

    // Prospect block (has "Prospect:", "Sector:", etc.)
    if (block.includes("Prospect:") && block.includes("Sector:")) {
      for (const line of block.split("\n")) {
        const l = line.trim();
        const match = l.match(/^(\w[\w\s]*?):\s+(.+)/);
        if (match) {
          prospect[match[1].trim()] = match[2].trim();
        }
      }
      continue;
    }

    // ICP FIT SCORE header — skip
    if (/^ICP FIT SCORE/i.test(block)) continue;

    // BANT detail block — contains B (Budget), A (Authority), etc.
    if (/^\s*B \(Budget\)/m.test(block)) {
      const letterBlocks = block.split(/\n(?=\s*[BANT] \()/);
      for (const lb of letterBlocks) {
        const headerMatch = lb.match(/([BANT]) \((\w+)\):\s+(.*)/);
        if (!headerMatch) continue;
        const confMatch = headerMatch[3].match(
          /(PASS|FLAGGED)\s*—\s*(.*?)confidence/i
        );
        const lines = lb
          .split("\n")
          .slice(1)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        bantItems.push({
          letter: headerMatch[1],
          label: headerMatch[2],
          verdict: confMatch?.[1] ?? headerMatch[3].split("—")[0].trim(),
          confidence: confMatch?.[2]?.trim() ?? "",
          details: lines.map((l) => l.replace(/^\s+/, "")),
        });
      }
      continue;
    }

    // SDR HANDOFF BRIEF header — skip
    if (/^SDR HANDOFF BRIEF$/m.test(block.split("\n")[0].trim())) continue;

    // Named section — ALL CAPS header as first line
    const firstLine = block.split("\n")[0].trim();
    const isHeader =
      firstLine.length < 100 &&
      firstLine === firstLine.toUpperCase() &&
      /^[A-Z]/.test(firstLine);

    if (isHeader) {
      const rest = block.split("\n").slice(1).join("\n").trim();
      if (rest) {
        sections.push({
          title: titleCase(firstLine),
          content: rest,
        });
      }
      continue;
    }

    // Anything else — attach to last section or create new
    if (block.length > 10) {
      if (sections.length > 0) {
        sections[sections.length - 1].content += "\n\n" + block;
      } else {
        sections.push({ title: "Notes", content: block });
      }
    }
  }

  return { decision, bantScore, prospect, bantItems, sections };
}

function titleCase(s: string): string {
  const lower = new Set(["a", "an", "the", "of", "to", "in", "for", "on", "by", "at"]);
  return s
    .toLowerCase()
    .replace(/[/—–-]/g, " — ")
    .split(/\s+/)
    .map((w, i) => {
      if (w.length === 0) return w;
      if (i > 0 && lower.has(w)) return w;
      if (w === "ae") return "AE";
      if (w === "sdr") return "SDR";
      if (w === "gdpr") return "GDPR";
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

/** Remove markdown artifacts, emojis, and box-drawing characters */
function cleanText(s: string): string {
  return s
    .replace(/─+/g, "")
    .replace(/[`#]/g, "")
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Render a content block as clean paragraphs, lists, or tables */
function ContentBlock({ text }: { text: string }) {
  // Table detection
  if (text.includes("|---") || text.includes("| ---")) {
    const rows = text
      .split("\n")
      .filter((l) => l.trim().startsWith("|"))
      .map((l) =>
        l
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim())
      );
    const headerRow = rows[0];
    const body = rows.filter(
      (_, i) => i > 0 && !rows[i]?.every((c) => /^[-─]+$/.test(c))
    );

    if (headerRow && body.length > 0) {
      return (
        <table className="mt-3 w-full text-left text-[10.5px]">
          <thead>
            <tr className="border-b border-zinc-300">
              {headerRow.map((h, i) => (
                <th key={i} className="py-1.5 pr-4 font-semibold text-zinc-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} className="border-b border-zinc-100">
                {row.map((cell, ci) => (
                  <td key={ci} className="py-1.5 pr-4 text-zinc-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  }

  // Numbered list
  if (/^\d+\.\s/m.test(text)) {
    const items: string[] = [];
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (/^\d+\.\s/.test(trimmed)) {
        items.push(trimmed.replace(/^\d+\.\s+/, ""));
      } else if (trimmed.startsWith("⚠️")) {
        items.push(trimmed.replace(/^⚠️\s*/, ""));
      } else if (items.length > 0 && trimmed) {
        items[items.length - 1] += " " + trimmed;
      }
    }
    return (
      <ol className="mt-2 space-y-2 text-[10.5px] leading-[1.65] text-zinc-700">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="shrink-0 font-semibold text-zinc-400">
              {i + 1}.
            </span>
            <span>{cleanText(item)}</span>
          </li>
        ))}
      </ol>
    );
  }

  // Bullet list
  if (/^[-•]\s/m.test(text)) {
    const items = text
      .split("\n")
      .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("•"))
      .map((l) => l.trim().replace(/^[-•]\s+/, ""));
    return (
      <ul className="mt-2 space-y-1 text-[10.5px] leading-[1.65] text-zinc-700">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
            <span>{cleanText(item)}</span>
          </li>
        ))}
      </ul>
    );
  }

  // Plain paragraphs
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return (
    <div className="mt-2 space-y-2 text-[10.5px] leading-[1.65] text-zinc-700">
      {paragraphs.map((p, i) => (
        <p key={i}>{cleanText(p)}</p>
      ))}
    </div>
  );
}

function BantVerdictBadge({ verdict }: { verdict: string }) {
  const isPassing = verdict.toUpperCase().includes("PASS");
  const cls = isPassing
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-amber-50 text-amber-700 border-amber-200";
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-semibold ${cls}`}
    >
      {verdict.toUpperCase()}
    </span>
  );
}

function ReportPageHeader({
  company,
  title,
}: {
  company: string;
  title: string;
}) {
  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.35em] text-zinc-400">
            DELPHI
          </p>
          <h2 className="mt-0.5 text-[15px] font-bold text-zinc-900">
            {title}
          </h2>
        </div>
        <p className="text-[10px] text-zinc-400">{company}</p>
      </div>
      <div className="mt-2 h-px bg-zinc-200" />
    </>
  );
}

export default async function PipelineReportPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("pipeline_leads")
    .select("*, assigned_agent:assigned_agent_id(id, name, slug)")
    .eq("id", id)
    .single();

  if (!lead) notFound();

  const agent = lead.assigned_agent as unknown as {
    id: string;
    name: string;
    slug: string;
  } | null;
  const stageLabel =
    PIPELINE_STAGE_LABELS[lead.stage as PipelineStage] ?? lead.stage;
  const metadata = (lead.metadata ?? {}) as Record<string, unknown>;
  const painPoints = (metadata.pain_points as string[]) ?? [];
  const compliance = (metadata.compliance as string[]) ?? [];

  const brief = lead.sdr_brief ? parseBrief(lead.sdr_brief) : null;

  // Group sections into logical report pages
  const sectionGroups: { pageTitle: string; items: BriefSection[] }[] = [];

  const contextTitles = new Set([
    "Pain Summary",
    "Trigger Event",
    "Company Context",
    "Touch History",
    "What I Promised",
    "What I Avoided",
  ]);
  const strategyTitles = new Set([
    "Recommended AE Approach",
    "Watch Out For",
  ]);
  const complianceTitles = new Set([
    "GDPR — Compliance Notes",
    "Research Confidence Summary",
  ]);
  const flagTitles = new Set(["SDR Flags to Hermes (requires Your Decision Before AE Routing)"]);

  const allSections = brief?.sections ?? [];

  const matchSection = (section: BriefSection, titleSet: Set<string>) =>
    [...titleSet].some(
      (t) =>
        section.title.toLowerCase().replace(/\s+/g, " ") ===
        t.toLowerCase().replace(/\s+/g, " ") ||
        t.toLowerCase().includes(section.title.toLowerCase()) ||
        section.title.toLowerCase().includes(t.toLowerCase())
    );

  const contextItems = allSections.filter((s) => matchSection(s, contextTitles));
  const strategyItems = allSections.filter((s) => matchSection(s, strategyTitles));
  const complianceItems = allSections.filter((s) => matchSection(s, complianceTitles));
  const flagItems = allSections.filter((s) => matchSection(s, flagTitles));
  const categorised = new Set([
    ...contextItems.map((s) => s.title),
    ...strategyItems.map((s) => s.title),
    ...complianceItems.map((s) => s.title),
    ...flagItems.map((s) => s.title),
  ]);
  const otherItems = allSections.filter((s) => !categorised.has(s.title));

  if (contextItems.length > 0) sectionGroups.push({ pageTitle: "Company Context & Background", items: contextItems });
  if (strategyItems.length > 0) sectionGroups.push({ pageTitle: "Recommended Strategy", items: strategyItems });
  if (complianceItems.length > 0 || flagItems.length > 0)
    sectionGroups.push({
      pageTitle: "Compliance, Risks & Flags",
      items: [...complianceItems, ...flagItems],
    });
  if (otherItems.length > 0) sectionGroups.push({ pageTitle: "Additional Notes", items: otherItems });

  return (
    <>
      <PrintTrigger />

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4;
              margin: 18mm 16mm 20mm 16mm;
            }
            @media print {
              html, body {
                background: white !important;
                color: #18181b !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print { display: none !important; }
              .page-break { break-before: page; }
            }
            @media screen {
              body { background: #f4f4f5; }
            }
          `,
        }}
      />

      <div className="mx-auto max-w-[210mm] bg-white font-sans text-zinc-900 shadow-lg print:max-w-none print:shadow-none">
        <PrintToolbar backHref={`/pipeline/${id}`} />

        {/* ═══ PAGE 1 — Executive Summary ═══ */}
        <div className="px-10 pt-10 pb-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-[0.35em] text-zinc-400">
                DELPHI
              </p>
              <h1 className="mt-1 text-[22px] font-bold leading-tight text-zinc-900">
                Lead Qualification Report
              </h1>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-400">
                {format(new Date(), "dd MMMM yyyy")}
              </p>
              <p className="text-[10px] text-zinc-400">
                Ref: {id.slice(0, 8).toUpperCase()}
              </p>
              <p className="mt-1 text-[8px] font-semibold tracking-[0.2em] text-zinc-300">
                CONFIDENTIAL
              </p>
            </div>
          </div>
          <div className="mt-3 h-[2px] bg-zinc-900" />

          {/* Company card */}
          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 px-6 py-5">
            <h2 className="text-[18px] font-bold text-zinc-900">
              {lead.company_name}
            </h2>
            <p className="mt-1 text-[12px] text-zinc-600">
              {lead.contact_name}
              {lead.contact_role && ` — ${lead.contact_role}`}
            </p>
            {lead.contact_email && (
              <p className="mt-0.5 text-[12px] text-zinc-400">
                {lead.contact_email}
              </p>
            )}
          </div>

          {/* KPI strip */}
          <div className="mt-5 grid grid-cols-4 gap-3">
            {[
              { label: "STAGE", value: stageLabel },
              {
                label: "DEAL VALUE",
                value: lead.deal_value_eur
                  ? `€${Number(lead.deal_value_eur).toLocaleString("en")}`
                  : "—",
              },
              {
                label: "CONFIDENCE",
                value:
                  lead.confidence !== null && lead.confidence !== undefined
                    ? `${lead.confidence}%`
                    : "—",
              },
              {
                label: "BANT SCORE",
                value: (metadata.bant_score as string) ?? "—",
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded border border-zinc-200 px-3 py-2.5"
              >
                <p className="text-[9px] font-semibold tracking-wider text-zinc-400">
                  {kpi.label}
                </p>
                <p className="mt-1 text-[13px] font-bold text-zinc-900">
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          {/* Details grid */}
          <div className="mt-5 grid grid-cols-2 gap-x-8">
            {[
              { label: "Source", value: lead.source },
              { label: "Assigned Agent", value: agent?.name ?? "Unassigned" },
              metadata.sector ? { label: "Sector", value: metadata.sector as string } : null,
              metadata.location ? { label: "Location", value: metadata.location as string } : null,
              metadata.estimated_labour_cost_eur
                ? {
                    label: "Est. Labour Cost",
                    value: `€${Number(metadata.estimated_labour_cost_eur).toLocaleString("en")}/yr`,
                  }
                : null,
              {
                label: "Created",
                value: format(new Date(lead.created_at), "dd MMM yyyy, HH:mm"),
              },
            ]
              .filter(Boolean)
              .map((row) => (
                <div
                  key={row!.label}
                  className="flex items-center justify-between border-b border-zinc-100 py-2 text-[11px]"
                >
                  <span className="text-zinc-400">{row!.label}</span>
                  <span className="font-medium capitalize text-zinc-800">
                    {row!.value}
                  </span>
                </div>
              ))}
          </div>

          {/* Decision banner */}
          {brief?.decision && (
            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-5 py-3">
              <p className="text-[9px] font-semibold tracking-wider text-amber-600">
                SDR DECISION
              </p>
              <p className="mt-1 text-[12px] font-bold text-amber-800">
                {cleanText(brief.decision)}
              </p>
            </div>
          )}

          {/* BANT Analysis */}
          {brief && brief.bantItems.length > 0 && (
            <div className="mt-6">
              <h3 className="text-[10px] font-bold tracking-wider text-zinc-400">
                BANT ANALYSIS
              </h3>
              <div className="mt-3 space-y-2.5">
                {brief.bantItems.map((item) => (
                  <div
                    key={item.letter}
                    className="rounded border border-zinc-200 px-4 py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-bold text-zinc-700">
                        {item.letter}
                      </span>
                      <span className="text-[12px] font-semibold text-zinc-900">
                        {item.label}
                      </span>
                      <BantVerdictBadge verdict={item.verdict} />
                      {item.confidence && (
                        <span className="text-[10px] text-zinc-400">
                          {cleanText(item.confidence)} confidence
                        </span>
                      )}
                    </div>
                    {item.details.length > 0 && (
                      <div className="mt-1.5 space-y-0.5 pl-[34px] text-[10px] leading-[1.55] text-zinc-600">
                        {item.details.map((d, di) => (
                          <p key={di}>{cleanText(d)}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pain Points + Compliance */}
          <div className="mt-5 grid grid-cols-2 gap-6">
            {painPoints.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold tracking-wider text-zinc-400">
                  KEY PAIN POINTS
                </h3>
                <ul className="mt-2 space-y-1">
                  {painPoints.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2 text-[11px] text-zinc-700"
                    >
                      <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                      <span className="capitalize">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {compliance.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold tracking-wider text-zinc-400">
                  COMPLIANCE
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {compliance.map((c) => (
                    <span
                      key={c}
                      className="rounded border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ PAGE 2+ — Brief sections ═══ */}
        {sectionGroups.map((group) => (
          <div key={group.pageTitle} className="page-break px-10 pt-8 pb-8">
            <ReportPageHeader
              company={lead.company_name}
              title={group.pageTitle}
            />
            {group.items.map((section) => (
              <div key={section.title} className="mt-5">
                <h3 className="text-[10px] font-bold tracking-wider text-zinc-400">
                  {section.title.toUpperCase()}
                </h3>
                <ContentBlock text={section.content} />
              </div>
            ))}
          </div>
        ))}

        {/* Discovery Notes */}
        {lead.discovery_notes && (
          <div className="page-break px-10 pt-8 pb-8">
            <ReportPageHeader
              company={lead.company_name}
              title="Discovery Notes"
            />
            <div className="mt-5">
              <ContentBlock text={lead.discovery_notes} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-zinc-200 px-10 py-4 text-center text-[8px] tracking-wider text-zinc-300">
          Confidential — Delphi · Generated{" "}
          {format(new Date(), "dd MMM yyyy, HH:mm")} · Ref{" "}
          {id.slice(0, 8).toUpperCase()}
        </div>
      </div>
    </>
  );
}
