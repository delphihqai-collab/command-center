"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/(auth)/actions";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-400">Are you sure?</span>
        <form action={logout}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="border-red-800 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
          >
            Yes, sign out
          </Button>
        </form>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirming(false)}
          className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => setConfirming(true)}
      className="gap-2 border-red-800 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
