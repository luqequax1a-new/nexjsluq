"use client";

import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ProductAttributeValue = { value?: string | number | null };
type ProductAttribute = {
  id?: number | string;
  name?: string | null;
  values?: ProductAttributeValue[] | null;
};
type AttributeGroup = [string, ProductAttribute[]];

export interface CustomProductTab {
  id?: number;
  title: string;
  content_html?: string | null;
}

export interface ProductTabsProps {
  description?: string;
  attributeGroups: AttributeGroup[];
  customTabs?: CustomProductTab[];
}

export function ProductTabs({ description, attributeGroups, customTabs }: ProductTabsProps) {
  const hasAttributes = attributeGroups.length > 0;
  const normalizedDescription = String(description ?? "").trim();

  const tabs = useMemo(() => {
    const normalizedCustomTabs = Array.isArray(customTabs)
      ? customTabs.filter(
          (t) =>
            String(t?.title ?? "").trim() !== "" &&
            String(t?.content_html ?? "").trim() !== ""
        )
      : [];

    const items: Array<{ key: string; label: string; render: () => React.ReactNode }> = [];

    if (normalizedDescription) {
      items.push({
        key: "description",
        label: "Açıklama",
        render: () => (
          <div>
            <div
              className="prose prose-sm text-gray-600 leading-relaxed max-w-none"
              dangerouslySetInnerHTML={{ __html: normalizedDescription }}
            />
          </div>
        ),
      });
    }

    if (hasAttributes) {
      items.push({
        key: "specification",
        label: "Özellikler",
        render: () => (
          <div className="space-y-6">
            {attributeGroups.map(([setName, attrs]) => (
              <div key={setName}>
                <div className="text-sm font-semibold text-gray-900 mb-3">{setName}</div>

                <dl className="divide-y divide-gray-200">
                  {attrs.map((a) => {
                    const name = String(a?.name ?? "").trim();
                    const values = Array.isArray(a?.values) ? a.values : [];
                    const valueText = values
                      .map((v) => String(v?.value ?? "").trim())
                      .filter(Boolean)
                      .join(", ");

                    if (!name || !valueText) return null;

                    return (
                      <div
                        key={String(a?.id ?? name)}
                        className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 py-3"
                      >
                        <dt className="text-sm font-medium text-gray-700">{name}</dt>
                        <dd className="text-sm font-semibold text-gray-900 text-right">{valueText}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            ))}
          </div>
        ),
      });
    }

    for (let i = 0; i < normalizedCustomTabs.length; i++) {
      const t = normalizedCustomTabs[i];
      const key = `custom-${t?.id ?? i}`;
      items.push({
        key,
        label: String(t.title),
        render: () => (
          <div
            className="prose prose-sm text-gray-600 leading-relaxed max-w-none"
            dangerouslySetInnerHTML={{ __html: String(t?.content_html ?? "") }}
          />
        ),
      });
    }

    return items;
  }, [customTabs, normalizedDescription, hasAttributes, attributeGroups]);

  const showTabs = tabs.length > 0;
  const [activeTab, setActiveTab] = useState<string>(() => tabs[0]?.key ?? "description");

  useEffect(() => {
    if (!tabs.find((t) => t.key === activeTab)) {
      setActiveTab(tabs[0]?.key ?? "description");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.length]);

  if (!showTabs) return null;

  return (
    <div className="mt-8 rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 sm:px-6">
        <div className="flex items-center gap-2 overflow-hidden">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "px-4 py-4 text-sm font-semibold -mb-px border-b-2 transition-colors whitespace-nowrap",
                activeTab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <hr className="border-gray-200" />
      </div>

      <div className="px-4 sm:px-6 py-6">{tabs.find((t) => t.key === activeTab)?.render() ?? null}</div>
    </div>
  );
}
