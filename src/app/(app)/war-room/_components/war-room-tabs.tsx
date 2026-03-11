"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Target } from "lucide-react";

interface Props {
  pipelineCommand: React.ReactNode;
  operations: React.ReactNode;
}

export function WarRoomTabs({ pipelineCommand, operations }: Props) {
  return (
    <Tabs defaultValue="pipeline" className="space-y-4">
      <TabsList className="bg-zinc-900 border border-zinc-800">
        <TabsTrigger value="pipeline" className="gap-2 data-[state=active]:bg-zinc-800">
          <Target className="h-3.5 w-3.5" />
          Pipeline Command
        </TabsTrigger>
        <TabsTrigger value="operations" className="gap-2 data-[state=active]:bg-zinc-800">
          <Shield className="h-3.5 w-3.5" />
          Operations
        </TabsTrigger>
      </TabsList>
      <TabsContent value="pipeline" className="space-y-6">
        {pipelineCommand}
      </TabsContent>
      <TabsContent value="operations" className="space-y-6">
        {operations}
      </TabsContent>
    </Tabs>
  );
}
