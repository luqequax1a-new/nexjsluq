"use client";

import React, { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import type { PageSection, SchemaField, SchemaGroup } from "@/types/sectionBuilder";
import { ControlRenderer } from "../controls/ControlRenderer";
import { SectionIcon } from "../utils/sectionIcons";

interface SectionSettingsProps {
  section: PageSection;
  onBack: () => void;
  onChange: (sectionId: number, settings: Record<string, any>) => void;
  onCommit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

export function SectionSettings({
  section,
  onBack,
  onChange,
  onCommit,
  onToggle,
  onDelete,
}: SectionSettingsProps) {
  const schema = section.template?.schema;
  const groups: SchemaGroup[] = schema?.groups || [];
  const fields: SchemaField[] = schema?.fields || [];
  const rawSettings = section.settings || {};

  // Merge field defaults into settings so depends_on always has a value to compare
  const settings = React.useMemo(() => {
    const merged: Record<string, any> = { ...rawSettings };
    for (const f of fields) {
      if (f.default !== undefined && merged[f.key] === undefined) {
        merged[f.key] = f.default;
      }
    }
    return merged;
  }, [rawSettings, fields]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    groups.forEach((g, i) => {
      initial[g.key] = i === 0;
    });
    return initial;
  });

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFieldChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    onChange(section.id, newSettings);
  };

  const handleFieldBlur = () => {
    onCommit();
  };

  // Check if a field should be visible based on depends_on
  const isFieldVisible = (field: SchemaField): boolean => {
    if (!field.depends_on) return true;
    return Object.entries(field.depends_on).every(
      ([depKey, depValue]) => {
        const current = settings[depKey];
        if (current === depValue) return true;
        if (current !== undefined && String(current) === String(depValue)) return true;
        return false;
      }
    );
  };

  // Group fields by their group key
  const fieldsByGroup: Record<string, SchemaField[]> = {};
  const ungroupedFields: SchemaField[] = [];

  fields.forEach((field) => {
    if (field.group) {
      if (!fieldsByGroup[field.group]) fieldsByGroup[field.group] = [];
      fieldsByGroup[field.group].push(field);
    } else {
      ungroupedFields.push(field);
    }
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          onClick={onBack}
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
          <ArrowLeft size={18} />
        </button>
        <div style={{ flexShrink: 0, color: "#6b7280", display: "flex" }}>
          <SectionIcon templateKey={section.template?.key || ""} size={18} />
        </div>
        <span
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: 600,
            color: "#1f2937",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {section.template?.name || "Bölüm"}
        </span>
      </div>

      {/* Settings Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {/* Ungrouped fields */}
        {ungroupedFields.length > 0 && (
          <div style={{ padding: "8px 16px 16px" }}>
            {ungroupedFields.map(
              (field) =>
                isFieldVisible(field) && (
                  <ControlRenderer
                    key={field.key}
                    field={field}
                    value={settings[field.key] ?? field.default ?? ""}
                    onChange={(val: any) => handleFieldChange(field.key, val)}
                    onBlur={handleFieldBlur}
                    allSettings={settings}
                  />
                )
            )}
          </div>
        )}

        {/* Grouped fields as accordions */}
        {groups.map((group) => {
          const groupFields = fieldsByGroup[group.key] || [];
          if (groupFields.length === 0) return null;
          const isOpen = openGroups[group.key] ?? false;

          return (
            <div key={group.key} style={{ margin: "0 12px 8px", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              {/* Accordion Header */}
              <button
                onClick={() => toggleGroup(group.key)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "13px 16px",
                  background: isOpen ? "#fafafa" : "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#1f2937",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                onMouseLeave={(e) => (e.currentTarget.style.background = isOpen ? "#fafafa" : "#fff")}
              >
                {group.label}
                {isOpen ? (
                  <ChevronDown size={16} color="#9ca3af" />
                ) : (
                  <ChevronRight size={16} color="#9ca3af" />
                )}
              </button>

              {/* Accordion Content */}
              {isOpen && (
                <div
                  style={{
                    padding: "4px 16px 16px",
                    borderTop: "1px solid #f3f4f6",
                  }}
                >
                  {groupFields.map(
                    (field) =>
                      isFieldVisible(field) && (
                        <ControlRenderer
                          key={field.key}
                          field={field}
                          value={settings[field.key] ?? field.default ?? ""}
                          onChange={(val: any) => handleFieldChange(field.key, val)}
                          onBlur={handleFieldBlur}
                          allSettings={settings}
                        />
                      )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div style={{ borderTop: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          onClick={onToggle}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            background: "transparent",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            color: "#374151",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {section.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
          {section.is_active ? "Bölümü Gizle" : "Bölümü Göster"}
        </button>

        <button
          onClick={onDelete}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            background: "transparent",
            border: "1px solid #fecaca",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            color: "#ef4444",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fef2f2";
            e.currentTarget.style.borderColor = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "#fecaca";
          }}
        >
          <Trash2 size={16} />
          Bölümü Sil
        </button>
      </div>
    </div>
  );
}
