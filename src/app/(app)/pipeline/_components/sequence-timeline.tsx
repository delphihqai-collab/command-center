import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle2, Clock, XCircle, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface SequenceStep {
  id: string;
  step_number: number;
  channel: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  replied_at: string | null;
  reply_sentiment: string | null;
  message_preview: string | null;
}

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sent: Mail,
  opened: CheckCircle2,
  replied: MessageSquare,
  pending: Clock,
  failed: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  sent: "text-indigo-400 bg-indigo-950",
  opened: "text-amber-400 bg-amber-950",
  clicked: "text-cyan-400 bg-cyan-950",
  replied: "text-emerald-400 bg-emerald-950",
  pending: "text-zinc-400 bg-zinc-800",
  failed: "text-red-400 bg-red-950",
};

export function SequenceTimeline({ steps }: { steps: SequenceStep[] }) {
  if (steps.length === 0) return null;

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">
          Outreach Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4 pl-6">
          {/* Vertical line */}
          <div className="absolute left-[9px] top-1 bottom-1 w-px bg-zinc-800" />

          {steps.map((step) => {
            const Icon = STATUS_ICONS[step.status] ?? Clock;
            const colorClass = STATUS_COLORS[step.status] ?? STATUS_COLORS.pending;

            return (
              <div key={step.id} className="relative flex items-start gap-3">
                <div className={`absolute -left-6 flex h-[18px] w-[18px] items-center justify-center rounded-full ${colorClass}`}>
                  <Icon className="h-2.5 w-2.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-300">
                      Step {step.step_number}
                    </span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                      {step.channel}
                    </span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                      {step.status}
                    </span>
                    {step.reply_sentiment && (
                      <span className={`rounded px-1.5 py-0.5 text-[10px] ${
                        step.reply_sentiment === "positive" ? "bg-emerald-950 text-emerald-400" :
                        step.reply_sentiment === "negative" ? "bg-red-950 text-red-400" :
                        "bg-zinc-800 text-zinc-400"
                      }`}>
                        {step.reply_sentiment}
                      </span>
                    )}
                  </div>
                  {step.message_preview && (
                    <p className="mt-1 truncate text-xs text-zinc-500">{step.message_preview}</p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-zinc-600">
                    {step.sent_at && <span>Sent {format(new Date(step.sent_at), "dd MMM HH:mm")}</span>}
                    {step.opened_at && <span>Opened {format(new Date(step.opened_at), "dd MMM HH:mm")}</span>}
                    {step.replied_at && <span>Replied {format(new Date(step.replied_at), "dd MMM HH:mm")}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
