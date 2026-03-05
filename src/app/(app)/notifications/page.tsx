import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { NotificationActions } from "./_components/notification-actions";
import { RealtimeRefresh } from "@/components/realtime-refresh";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const items = notifications ?? [];
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">Notifications</h1>
          <p className="text-sm text-zinc-400">
            {unread > 0
              ? `${unread} unread notification${unread !== 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        {unread > 0 && <NotificationActions mode="mark-all" />}
      </div>

      {items.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            No notifications.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card
              key={n.id}
              className={`border-zinc-800 ${
                n.read ? "bg-zinc-900/50" : "bg-zinc-900"
              }`}
            >
              <CardContent className="flex items-start gap-3 py-3">
                {!n.read && (
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-indigo-500" />
                )}
                <div className="flex-1">
                  <p
                    className={`text-sm ${
                      n.read ? "text-zinc-400" : "font-medium text-zinc-50"
                    }`}
                  >
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-0.5 text-xs text-zinc-500">{n.body}</p>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5">
                      {n.type}
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(n.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
                {!n.read && <NotificationActions mode="mark-one" id={n.id} />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RealtimeRefresh table="notifications" />
    </div>
  );
}
