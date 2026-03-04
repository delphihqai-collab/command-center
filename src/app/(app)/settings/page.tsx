import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignOutButton } from "./_components/sign-out-button";
import {
  NotificationsTab,
  PipelineConfigTab,
  DataRetentionTab,
  AgentModelsTab,
} from "./_components/settings-tabs";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [userRes, agentsRes, notifRes, configRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("agents").select("id, name, slug, status, type, model").order("slug"),
    supabase.from("notification_preferences").select("*").limit(1).maybeSingle(),
    supabase.from("pipeline_config").select("*"),
  ]);

  const user = userRes.data.user;
  const agents = agentsRes.data ?? [];
  const notifPrefs = notifRes.data;
  const configs = (configRes.data ?? []).map((c) => ({
    key: c.key,
    value: c.value,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Settings</h1>
        <p className="text-sm text-zinc-400">Account and system configuration</p>
      </div>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList className="border-zinc-800 bg-zinc-900">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="retention">Data Retention</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-400">Account</CardTitle>
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
              <CardTitle className="text-sm font-medium text-zinc-400">System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-zinc-500">Version</p>
                <p className="text-sm text-zinc-50">V5 — Command Center</p>
              </div>
              <Separator className="bg-zinc-800" />
              <div>
                <p className="text-xs text-zinc-500">Environment</p>
                <p className="text-sm text-zinc-400">PC2 · Port 9069 · Supabase Cloud</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-900/50 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-red-400">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <SignOutButton />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab prefs={notifPrefs} />
        </TabsContent>

        <TabsContent value="pipeline">
          <PipelineConfigTab configs={configs} />
        </TabsContent>

        <TabsContent value="agents">
          <AgentModelsTab agents={agents} />
        </TabsContent>

        <TabsContent value="retention">
          <DataRetentionTab configs={configs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
