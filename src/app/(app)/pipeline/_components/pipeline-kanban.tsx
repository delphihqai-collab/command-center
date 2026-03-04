"use client";

import { useState, useTransition } from "react";
import { DndContext, DragOverlay, closestCorners, type DragStartEvent, type DragEndEvent } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { LeadDetailSheet } from "./lead-detail-sheet";
import { advanceLeadStage } from "../actions";
import { PIPELINE_STAGES, type Lead } from "@/lib/types";
import { toast } from "sonner";

type LeadWithAgent = Lead & { agents?: { name: string } | null };

interface PipelineKanbanProps {
  leads: LeadWithAgent[];
}

export function SortableCard({ lead, onClick }: { lead: LeadWithAgent; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { lead },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard lead={lead} onClick={onClick} />
    </div>
  );
}

export function PipelineKanban({ leads }: PipelineKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sheetLead, setSheetLead] = useState<LeadWithAgent | null>(null);
  const [, startTransition] = useTransition();

  const leadsByStage = PIPELINE_STAGES.reduce<Record<string, LeadWithAgent[]>>(
    (acc, stage) => {
      acc[stage] = leads.filter((l) => l.stage === stage);
      return acc;
    },
    {} as Record<string, LeadWithAgent[]>
  );

  const activeLead = activeId ? leads.find((l) => l.id === activeId) ?? null : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const newStage = over.id as string;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === newStage) return;

    // Only allow dropping on valid stages
    if (!PIPELINE_STAGES.includes(newStage as typeof PIPELINE_STAGES[number])) return;

    startTransition(async () => {
      const result = await advanceLeadStage(leadId, newStage);
      if (result.success) {
        toast.success(`Moved to ${newStage.replace(/_/g, " ")}`);
      } else {
        toast.error(result.error ?? "Failed to move lead");
      }
    });
  }

  return (
    <>
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              leads={leadsByStage[stage] ?? []}
              onCardClick={setSheetLead}
            />
          ))}
        </div>
        <DragOverlay>
          {activeLead && <KanbanCard lead={activeLead} onClick={() => {}} />}
        </DragOverlay>
      </DndContext>

      {sheetLead && (
        <LeadDetailSheet lead={sheetLead}>
          <span className="hidden" />
        </LeadDetailSheet>
      )}
    </>
  );
}
