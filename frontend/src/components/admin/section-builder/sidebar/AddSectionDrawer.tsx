"use client";

import React, { useState } from "react";
import { X, Search } from "lucide-react";
import type { GroupedTemplates } from "@/types/sectionBuilder";
import { SectionIcon } from "../utils/sectionIcons";

interface AddSectionDrawerProps {
  grouped: GroupedTemplates[];
  onSelect: (templateId: number) => void;
  onClose: () => void;
}

export function AddSectionDrawer({ grouped, onSelect, onClose }: AddSectionDrawerProps) {
  const [search, setSearch] = useState("");

  const filteredGroups = grouped
    .map((group) => ({
      ...group,
      templates: group.templates.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          (t.description || "").toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((group) => group.templates.length > 0);

  const totalCount = filteredGroups.reduce((sum, g) => sum + g.templates.length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "16px 16px 12px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: "#1f2937" }}>
          Bölüm Seç ({totalCount})
        </span>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 4,
            borderRadius: 6,
            color: "#6b7280",
            display: "flex",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <X size={18} />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: "12px 16px 8px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "8px 12px",
          }}
        >
          <Search size={16} color="#9ca3af" />
          <input
            type="text"
            placeholder="Bölüm ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              flex: 1,
              fontSize: 13,
              color: "#1f2937",
            }}
          />
        </div>
      </div>

      {/* Template List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {filteredGroups.map((group) => (
          <div key={group.category}>
            {/* Category Header */}
            <div
              style={{
                padding: "14px 16px 6px",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#9ca3af",
              }}
            >
              {group.label}
            </div>

            {/* Templates */}
            {group.templates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelect(template.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid #f3f4f6",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ flexShrink: 0, color: "#6b7280", display: "flex", width: 36, height: 36, borderRadius: 8, background: "#f3f4f6", alignItems: "center", justifyContent: "center" }}>
                  <SectionIcon templateKey={template.key} size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#1f2937" }}>
                    {template.name}
                  </div>
                  {template.description && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#9ca3af",
                        marginTop: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {template.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af", fontSize: 13 }}>
            Aramanızla eşleşen bölüm bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}
