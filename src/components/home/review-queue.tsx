import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

interface Lead {
  id: string;
  company_name: string;
  contact_name: string | null;
  icp_score: number | null;
  industry: string | null;
  trigger_event: string | null;
}

interface Props {
  leads: Lead[];
}

export function ReviewQueue({ leads }: Props) {
  if (leads.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
        Review Queue ({leads.length})
      </h2>
      <div className="space-y-2">
        {leads.map((lead) => (
          <Link key={lead.id} href={`/pipeline/${lead.id}`}>
            <Card className="border-amber-800/30 bg-zinc-900 transition-colors hover:border-amber-700/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-950/40">
                  <span className="text-xs font-bold text-amber-400">
                    {lead.icp_score ?? "?"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-100">
                    {lead.company_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    {lead.industry && <span>{lead.industry}</span>}
                    {lead.trigger_event && (
                      <span>&middot; {lead.trigger_event}</span>
                    )}
                    {lead.contact_name && (
                      <span>&middot; {lead.contact_name}</span>
                    )}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="border-amber-700 text-amber-400"
                >
                  Review
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
