"use client";

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, Copy, Trash2, GripVertical, ChevronRight } from "lucide-react";
import type { PageSection } from "@/types/sectionBuilder";
import { SectionIcon } from "../utils/sectionIcons";

interface SectionListItemProps {
  section: PageSection;
  isActive: boolean;
  onClick: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function SectionListItem({
  section,
  isActive,
  onClick,
  onToggle,
  onDuplicate,
  onDelete,
}: SectionListItemProps) {
  const [showActions, setShowActions] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : section.is_active ? 1 : 0.5,
    position: "relative" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          background: isActive ? "#f5f3ff" : "#fff",
          border: `1px solid ${isActive ? "#6366f1" : "#e5e7eb"}`,
          borderLeft: isActive ? "3px solid #6366f1" : "1px solid #e5e7eb",
          borderRadius: 10,
          cursor: "pointer",
          transition: "all 0.15s ease",
          fontSize: 14,
        }}
        onClick={onClick}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.borderColor = "#c7d2fe";
            e.currentTarget.style.background = "#fafaff";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.background = "#fff";
          }
        }}
      >
        {/* Drag Handle */}
        <div
          {...listeners}
          style={{
            cursor: "grab",
            color: "#9ca3af",
            display: "flex",
            alignItems: "center",
            padding: "2px 0",
            flexShrink: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </div>

        {/* Icon */}
        <div style={{ flexShrink: 0, color: "#6b7280", display: "flex" }}>
          <SectionIcon templateKey={section.template?.key || ""} size={16} />
        </div>
        <span
          style={{
            flex: 1,
            fontWeight: 500,
            color: section.is_active ? "#1f2937" : "#9ca3af",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textDecoration: section.is_active ? "none" : "line-through",
          }}
        >
          {section.template?.name || "Bölüm"}
        </span>

        {/* Actions (on hover) */}
        {showActions ? (
          <div
            style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ActionBtn
              onClick={onToggle}
              title={section.is_active ? "Gizle" : "Göster"}
            >
              {section.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
            </ActionBtn>
            <ActionBtn onClick={onDuplicate} title="Kopyala">
              <Copy size={14} />
            </ActionBtn>
            <ActionBtn onClick={onDelete} title="Sil" danger>
              <Trash2 size={14} />
            </ActionBtn>
          </div>
        ) : (
          <ChevronRight size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 4,
        borderRadius: 6,
        color: danger ? "#ef4444" : "#6b7280",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? "#fef2f2" : "#f3f4f6";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}
