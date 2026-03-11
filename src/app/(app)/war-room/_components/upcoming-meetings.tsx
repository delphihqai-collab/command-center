import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface MeetingLead {
  id: string;
  company_name: string;
  contact_name: string | null;
  meeting_scheduled_at: string;
  deal_value_eur: number | null;
}

export function UpcomingMeetings({ leads }: { leads: MeetingLead[] }) {
  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 p-4 text-center">
        <p className="text-sm text-zinc-500">No upcoming meetings</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-400">
        <CalendarCheck className="h-3.5 w-3.5" />
        Upcoming Meetings ({leads.length})
      </h3>
      <div className="space-y-2">
        {leads.map((lead) => (
          <Link key={lead.id} href={`/pipeline/${lead.id}`}>
            <Card className="border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium text-zinc-50">{lead.company_name}</p>
                  {lead.contact_name && (
                    <p className="text-xs text-zinc-500">{lead.contact_name}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-blue-400">
                    {format(new Date(lead.meeting_scheduled_at), "dd MMM HH:mm")}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    {formatDistanceToNow(new Date(lead.meeting_scheduled_at), { addSuffix: true })}
                  </p>
                  {lead.deal_value_eur && (
                    <p className="text-[10px] text-emerald-400">
                      &euro;{lead.deal_value_eur.toLocaleString("en")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
