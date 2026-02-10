"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { PageSection } from "@/types/sectionBuilder";
import { SectionListItem } from "./SectionListItem";
import { SectionIcon } from "../utils/sectionIcons";
import { Settings } from "lucide-react";

interface SectionListProps {
  sections: PageSection[];
  loading: boolean;
  onSelect: (id: number) => void;
  onReorder: (sections: PageSection[]) => void;
  onToggle: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onAddClick: () => void;
}

export function SectionList({
  sections,
  loading,
  onSelect,
  onReorder,
  onToggle,
  onDuplicate,
  onDelete,
  onAddClick,
}: SectionListProps) {
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(Number(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === Number(active.id));
    const newIndex = sections.findIndex((s) => s.id === Number(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sections, oldIndex, newIndex);
    onReorder(reordered);
  }

  const activeSection = sections.find((s) => s.id === activeId);

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ color: "#9ca3af", fontSize: 13 }}>Yükleniyor...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Section List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
        {sections.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: 80, height: 80, margin: "0 auto 16px", background: "#f3f4f6", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
              </svg>
            </div>
            <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 4px", fontWeight: 500 }}>
              Bu sayfaya henüz bir bölüm eklemediniz.
            </p>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: "0 0 20px" }}>
              Sayfanıza bölümleri ekleyerek düzenleyin.
            </p>
            <button
              onClick={onAddClick}
              style={{
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 24px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 18 }}>⊕</span> Yeni Bölüm
            </button>
          </div>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {sections.map((section) => (
                    <SectionListItem
                      key={section.id}
                      section={section}
                      isActive={false}
                      onClick={() => onSelect(section.id)}
                      onToggle={() => onToggle(section.id)}
                      onDuplicate={() => onDuplicate(section.id)}
                      onDelete={() => onDelete(section.id)}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeSection ? (
                  <div
                    style={{
                      background: "#fff",
                      border: "2px solid #6366f1",
                      borderRadius: 10,
                      padding: "12px 16px",
                      boxShadow: "0 12px 24px -4px rgba(0,0,0,0.15)",
                      opacity: 0.95,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    <SectionIcon templateKey={activeSection.template?.key || ""} size={16} />
                    <span>{activeSection.template?.name || "Bölüm"}</span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            <button
              onClick={onAddClick}
              style={{
                marginTop: 12,
                width: "100%",
                background: "transparent",
                color: "#6366f1",
                border: "2px dashed #c7d2fe",
                borderRadius: 10,
                padding: "10px 0",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#6366f1";
                e.currentTarget.style.background = "#f5f3ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#c7d2fe";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ fontSize: 16 }}>⊕</span> Yeni Bölüm
            </button>
          </>
        )}
      </div>

      {/* Bottom: Theme Settings */}
      <div style={{ borderTop: "1px solid #e5e7eb", padding: "12px 16px" }}>
        <button
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            padding: "10px 12px",
            borderRadius: 8,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            color: "#374151",
            fontWeight: 500,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Settings size={18} color="#6b7280" />
          Tema Ayarları
          <span style={{ marginLeft: "auto", color: "#9ca3af", fontSize: 18 }}>›</span>
        </button>
      </div>
    </div>
  );
}
