export function StatusDot({ status }: { status: string }) {
  const config: Record<string, { color: string; animate: boolean; label: string }> = {
    active: { color: "bg-emerald-500", animate: true, label: "Active" },
    idle: { color: "bg-amber-500", animate: true, label: "Idle" },
    built_not_calibrated: { color: "bg-zinc-500", animate: false, label: "Not Calibrated" },
    offline: { color: "bg-zinc-700", animate: false, label: "Offline" },
  };

  const { color, animate, label } = config[status] ?? config.offline;

  return (
    <span className="flex items-center gap-1.5" title={label}>
      <span className="relative flex h-2.5 w-2.5">
        {animate && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${color}`}
          />
        )}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
      </span>
      <span className="text-[10px] text-zinc-500">{label}</span>
    </span>
  );
}
