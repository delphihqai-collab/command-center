"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RealtimeTable({ children, table }: { children: React.ReactNode; table: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`${table}-realtime`)
      .on("postgres_changes" as never, { event: "*", schema: "public", table }, () => router.refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [table, router]);

  return <>{children}</>;
}
