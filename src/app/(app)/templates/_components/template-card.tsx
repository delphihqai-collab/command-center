import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { OutreachTemplate } from "@/lib/types";

const CHANNEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  linkedin: MessageSquare,
  discord: MessageSquare,
};

export function TemplateCard({ template }: { template: OutreachTemplate }) {
  const ChannelIcon = CHANNEL_ICONS[template.channel] ?? Mail;
  const variables = (template.variables ?? []) as string[];

  return (
    <Card className="border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ChannelIcon className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-medium text-zinc-50">{template.name}</h3>
          </div>
          <Badge variant="outline" className="border-zinc-700 text-[10px] text-zinc-500">
            {template.category}
          </Badge>
        </div>
        {template.subject && (
          <p className="mt-1 text-xs text-zinc-400">Subject: {template.subject}</p>
        )}
        <p className="mt-2 line-clamp-3 text-xs text-zinc-500">{template.body}</p>
        {variables.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {variables.map((v) => (
              <span key={v} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                {"{" + v + "}"}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center gap-3 text-[10px] text-zinc-600">
          <span>Used {template.times_used ?? 0}x</span>
          {template.avg_open_rate != null && <span>Open {template.avg_open_rate}%</span>}
          {template.avg_reply_rate != null && <span>Reply {template.avg_reply_rate}%</span>}
          <span className="ml-auto">
            {formatDistanceToNow(new Date(template.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
