import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function SectionHeader({ title, subtitle, align, viewAllUrl, viewAllLabel }: {
    title?: string; subtitle?: string; align?: string; viewAllUrl?: string; viewAllLabel?: string;
}) {
    if (!title) return null;
    const isCenter = align === "center";
    const isRight = align === "right";
    return (
        <div className={`mb-10 ${isCenter ? "text-center" : isRight ? "text-right" : "flex items-center justify-between"}`}>
            <div>
                <h2 className="text-3xl font-heading font-bold">{title}</h2>
                {subtitle && <p className="text-gray-500 mt-2">{subtitle}</p>}
            </div>
            {viewAllUrl && !isCenter && (
                <Link href={viewAllUrl} className="text-primary font-bold flex items-center gap-1 hover:underline">
                    {viewAllLabel || "Tümünü Gör"} <ChevronRight className="w-4 h-4" />
                </Link>
            )}
        </div>
    );
}
