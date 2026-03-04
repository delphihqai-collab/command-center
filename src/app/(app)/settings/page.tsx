import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Settings</h1>
        <p className="text-sm text-zinc-400">Account and system configuration</p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-zinc-500">Email</p>
            <p className="text-sm text-zinc-50">{user?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">User ID</p>
            <p className="font-mono text-sm text-zinc-400">{user?.id ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Last Sign In</p>
            <p className="text-sm text-zinc-400">
              {user?.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString("en-GB")
                : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">
            Notification preferences will be available in a future update.
            Currently all alerts go through Discord.
          </p>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-zinc-500">Version</p>
            <p className="text-sm text-zinc-50">V1 — Command Center</p>
          </div>
          <Separator className="bg-zinc-800" />
          <div>
            <p className="text-xs text-zinc-500">Environment</p>
            <p className="text-sm text-zinc-400">
              PC2 · Port 9069 · Supabase Cloud
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
