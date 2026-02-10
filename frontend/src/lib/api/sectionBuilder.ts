import { apiFetch } from "@/lib/api";
import type { PageSection, SectionTemplate, GroupedTemplates } from "@/types/sectionBuilder";

export async function getSections(pageType: string = 'home') {
  return apiFetch<{ sections: PageSection[] }>(`/api/page-sections?page_type=${pageType}`);
}

export async function getTemplates() {
  return apiFetch<{ templates: SectionTemplate[]; grouped: GroupedTemplates[] }>('/api/page-sections/templates');
}

export async function addSection(pageType: string, sectionTemplateId: number) {
  return apiFetch<{ section: PageSection; message: string }>('/api/page-sections', {
    method: 'POST',
    json: { page_type: pageType, section_template_id: sectionTemplateId },
  });
}

export async function updateSection(sectionId: number, data: { settings?: Record<string, any>; is_active?: boolean }) {
  return apiFetch<{ section: PageSection; message: string }>(`/api/page-sections/${sectionId}`, {
    method: 'PUT',
    json: data,
  });
}

export async function toggleSection(sectionId: number) {
  return apiFetch<{ section: PageSection; is_active: boolean }>(`/api/page-sections/${sectionId}/toggle`, {
    method: 'POST',
  });
}

export async function duplicateSection(sectionId: number) {
  return apiFetch<{ section: PageSection; message: string }>(`/api/page-sections/${sectionId}/duplicate`, {
    method: 'POST',
  });
}

export async function deleteSection(sectionId: number) {
  return apiFetch<{ message: string }>(`/api/page-sections/${sectionId}`, {
    method: 'DELETE',
  });
}

export async function reorderSections(order: { id: number; position: number }[]) {
  return apiFetch<{ message: string }>('/api/page-sections/reorder', {
    method: 'POST',
    json: { order },
  });
}

export async function bulkSaveSections(pageType: string, sections: { id: number; settings: Record<string, any>; is_active: boolean; position: number }[]) {
  return apiFetch<{ message: string }>('/api/page-sections/bulk-save', {
    method: 'POST',
    json: { page_type: pageType, sections },
  });
}
