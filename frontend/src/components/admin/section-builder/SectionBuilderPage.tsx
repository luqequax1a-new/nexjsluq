"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { App } from "antd";
import { usePageHeader } from "@/hooks/usePageHeader";
import { getSections, getTemplates, addSection, updateSection, deleteSection, reorderSections, toggleSection, duplicateSection } from "@/lib/api/sectionBuilder";
import type { PageSection, SectionTemplate, GroupedTemplates, SidebarMode, ResponsiveMode } from "@/types/sectionBuilder";
import { SectionList } from "./sidebar/SectionList";
import { SectionSettings } from "./sidebar/SectionSettings";
import { AddSectionDrawer } from "./sidebar/AddSectionDrawer";
import { PreviewFrame } from "./preview/PreviewFrame";

export function SectionBuilderPage() {
  const router = useRouter();
  const { message } = App.useApp();

  // Data state
  const [sections, setSections] = useState<PageSection[]>([]);
  const [templates, setTemplates] = useState<SectionTemplate[]>([]);
  const [groupedTemplates, setGroupedTemplates] = useState<GroupedTemplates[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // UI state
  const [pageType, setPageType] = useState("home");
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("list");
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [responsiveMode, setResponsiveMode] = useState<ResponsiveMode>("desktop");
  const [isDirty, setIsDirty] = useState(false);

  // Undo/Redo
  const [history, setHistory] = useState<PageSection[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const previewRef = useRef<HTMLIFrameElement>(null);

  const selectedSection = sections.find((s) => s.id === selectedSectionId) || null;

  // ─── Page Header (dark mode = full screen) ───
  usePageHeader({
    title: "Tema Düzenleyici",
    variant: "dark",
    onBack: () => router.push("/admin"),
    extra: (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <select
          value={pageType}
          onChange={(e) => setPageType(e.target.value)}
          style={{
            background: "#1a1a2e",
            color: "#fff",
            border: "1px solid #333",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <option value="home">Anasayfa</option>
          <option value="category">Kategori Sayfası</option>
          <option value="product">Ürün Sayfası</option>
        </select>

        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            style={{
              background: "transparent",
              border: "none",
              color: historyIndex <= 0 ? "#555" : "#aaa",
              cursor: historyIndex <= 0 ? "default" : "pointer",
              fontSize: 18,
              padding: "4px 8px",
            }}
            title="Geri Al (Ctrl+Z)"
          >
            ↩
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            style={{
              background: "transparent",
              border: "none",
              color: historyIndex >= history.length - 1 ? "#555" : "#aaa",
              cursor: historyIndex >= history.length - 1 ? "default" : "pointer",
              fontSize: 18,
              padding: "4px 8px",
            }}
            title="Yinele (Ctrl+Shift+Z)"
          >
            ↪
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          style={{
            background: isDirty ? "#6366f1" : "#333",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 20px",
            fontSize: 13,
            fontWeight: 600,
            cursor: saving || !isDirty ? "default" : "pointer",
            opacity: saving || !isDirty ? 0.6 : 1,
            transition: "all 0.2s",
          }}
        >
          {saving ? "Kaydediliyor..." : isDirty ? "Kaydet" : "Kaydedildi ✓"}
        </button>
      </div>
    ),
  });

  // ─── Data Loading ───
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sectionsRes, templatesRes] = await Promise.all([
        getSections(pageType),
        getTemplates(),
      ]);
      setSections(sectionsRes.sections);
      setTemplates(templatesRes.templates);
      setGroupedTemplates(templatesRes.grouped);
      pushHistory(sectionsRes.sections);
    } catch (err) {
      message.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [pageType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Keyboard Shortcuts ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sections, historyIndex, history, isDirty, saving]);

  // ─── History ───
  function pushHistory(newSections: PageSection[]) {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      const next = [...trimmed, JSON.parse(JSON.stringify(newSections))];
      setHistoryIndex(next.length - 1);
      return next;
    });
  }

  function handleUndo() {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setSections(JSON.parse(JSON.stringify(history[newIndex])));
    setIsDirty(true);
  }

  function handleRedo() {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setSections(JSON.parse(JSON.stringify(history[newIndex])));
    setIsDirty(true);
  }

  // ─── Actions ───
  async function handleSave() {
    if (saving || !isDirty) return;
    setSaving(true);
    try {
      for (const section of sections) {
        await updateSection(section.id, {
          settings: section.settings,
          is_active: section.is_active,
        });
      }
      await reorderSections(sections.map((s, i) => ({ id: s.id, position: i })));
      setIsDirty(false);
      message.success("Değişiklikler kaydedildi");
    } catch (err) {
      message.error("Kaydetme sırasında hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSection(templateId: number) {
    try {
      const res = await addSection(pageType, templateId);
      const newSections = [...sections, res.section];
      setSections(newSections);
      pushHistory(newSections);
      setSelectedSectionId(res.section.id);
      setSidebarMode("settings");
      setIsDirty(true);
      message.success("Bölüm eklendi");
    } catch (err: any) {
      message.error(err?.message || "Bölüm eklenemedi");
    }
  }

  async function handleDeleteSection(sectionId: number) {
    try {
      await deleteSection(sectionId);
      const newSections = sections.filter((s) => s.id !== sectionId);
      setSections(newSections);
      pushHistory(newSections);
      if (selectedSectionId === sectionId) {
        setSelectedSectionId(null);
        setSidebarMode("list");
      }
      setIsDirty(true);
      message.success("Bölüm silindi");
    } catch {
      message.error("Bölüm silinemedi");
    }
  }

  async function handleToggleSection(sectionId: number) {
    const newSections = sections.map((s) =>
      s.id === sectionId ? { ...s, is_active: !s.is_active } : s
    );
    setSections(newSections);
    pushHistory(newSections);
    setIsDirty(true);
  }

  async function handleDuplicateSection(sectionId: number) {
    try {
      const res = await duplicateSection(sectionId);
      const newSections = [...sections, res.section];
      setSections(newSections);
      pushHistory(newSections);
      setIsDirty(true);
      message.success("Bölüm kopyalandı");
    } catch {
      message.error("Bölüm kopyalanamadı");
    }
  }

  function handleReorder(newSections: PageSection[]) {
    setSections(newSections);
    pushHistory(newSections);
    setIsDirty(true);
  }

  function handleSelectSection(sectionId: number) {
    setSelectedSectionId(sectionId);
    setSidebarMode("settings");
  }

  function handleSettingsChange(sectionId: number, newSettings: Record<string, any>) {
    const newSections = sections.map((s) =>
      s.id === sectionId ? { ...s, settings: newSettings } : s
    );
    setSections(newSections);
    setIsDirty(true);
    // Don't push history on every keystroke — only on blur/commit
  }

  function handleSettingsCommit() {
    pushHistory(sections);
  }

  function handleBackToList() {
    setSelectedSectionId(null);
    setSidebarMode("list");
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 72px)", overflow: "hidden" }}>
      {/* ─── LEFT SIDEBAR ─── */}
      <div
        style={{
          width: 360,
          minWidth: 360,
          maxWidth: 360,
          height: "100%",
          background: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {sidebarMode === "list" && (
          <SectionList
            sections={sections}
            loading={loading}
            onSelect={handleSelectSection}
            onReorder={handleReorder}
            onToggle={handleToggleSection}
            onDuplicate={handleDuplicateSection}
            onDelete={handleDeleteSection}
            onAddClick={() => setSidebarMode("add")}
          />
        )}

        {sidebarMode === "settings" && selectedSection && (
          <SectionSettings
            section={selectedSection}
            onBack={handleBackToList}
            onChange={handleSettingsChange}
            onCommit={handleSettingsCommit}
            onToggle={() => handleToggleSection(selectedSection.id)}
            onDelete={() => handleDeleteSection(selectedSection.id)}
          />
        )}

        {sidebarMode === "add" && (
          <AddSectionDrawer
            grouped={groupedTemplates}
            onSelect={handleAddSection}
            onClose={() => setSidebarMode("list")}
          />
        )}
      </div>

      {/* ─── RIGHT PREVIEW ─── */}
      <div
        style={{
          flex: 1,
          height: "100%",
          background: "#f1f5f9",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <PreviewFrame
          ref={previewRef}
          responsiveMode={responsiveMode}
          onResponsiveModeChange={setResponsiveMode}
          sections={sections}
          selectedSectionId={selectedSectionId}
          onSelectSection={handleSelectSection}
        />
      </div>
    </div>
  );
}
