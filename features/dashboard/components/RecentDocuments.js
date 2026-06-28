"use client";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { Card, CardHeader, EmptyState, Button } from "@/components/ui";
import { categoryMeta } from "@/features/documents/constants";
import { formatDate } from "@/utils/format";

export default function RecentDocuments({ documents = [] }) {
  const router = useRouter();
  return (
    <Card>
      <CardHeader
        title="Recent Documents"
        subtitle="Latest uploads"
        icon={FileText}
        action={<Button size="sm" variant="ghost" onClick={() => router.push("/documents")}>View all</Button>}
      />
      {documents.length === 0 ? (
        <EmptyState icon={FileText} title="No documents" />
      ) : (
        <div className="space-y-1.5">
          {documents.map((d) => {
            const meta = categoryMeta(d.category);
            const Icon = meta.icon;
            return (
              <div key={d.id} className="flex items-center gap-3 rounded-xl p-2.5">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0" style={{ background: "var(--surface-hover)", color: meta.color }}>
                  <Icon size={15} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{d.name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{d.clientName}</p>
                </div>
                <span className="text-[11px] flex-shrink-0" style={{ color: "var(--muted)" }}>{formatDate(d.uploadedAt)}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
