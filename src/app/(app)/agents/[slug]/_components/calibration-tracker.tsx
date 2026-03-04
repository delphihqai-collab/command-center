import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";

interface CalibrationGate {
  id: string;
  gate_name: string;
  gate_description: string | null;
  required_count: number;
  completed_count: number;
  completed: boolean;
  completed_at: string | null;
}

export function CalibrationTracker({ gates }: { gates: CalibrationGate[] }) {
  const total = gates.length;
  const done = gates.filter((g) => g.completed).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">
          Calibration Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {allDone ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/30 p-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <p className="text-sm font-medium text-emerald-400">
              All calibration gates completed!
            </p>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
                <span>
                  {done}/{total} gates
                </span>
                <span>{percent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800">
                <div
                  className="h-2 rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </>
        )}

        {/* Gate checklist */}
        <div className="space-y-2">
          {gates.map((gate) => (
            <div
              key={gate.id}
              className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3"
            >
              {gate.completed ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
              )}
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${gate.completed ? "text-zinc-400 line-through" : "text-zinc-50"}`}>
                  {gate.gate_name}
                </p>
                {gate.gate_description && (
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {gate.gate_description}
                  </p>
                )}
                {gate.required_count > 1 && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Progress: {gate.completed_count}/{gate.required_count}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
