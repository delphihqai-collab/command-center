import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { SignOutButton } from "./_components/sign-out-button";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [userRes, agentsRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("agents").select("id, name, slug, status, type, model").order("slug"),
  ]);

  const user = userRes.data.user;
  const agents = agentsRes.data ?? [];

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

      {/* Agents Overview */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Agents ({agents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-50">
                    {agent.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {agent.type} · {agent.model}
                  </p>
                </div>
                <StatusBadge status={agent.status} />
              </div>
            ))}
          </div>
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
            <p className="text-sm text-zinc-50">V2 — Command Center</p>
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

      {/* Danger Zone */}
      <Card className="border-red-900/50 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-red-400">
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  );
}
