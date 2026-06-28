"use client";
import { FileText, Download } from "lucide-react";
import { Card, CardHeader, Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/utils/format";

const CATEGORY_LABEL = {
  kyc: "KYC",
  identity: "Identity",
  tax: "Tax",
  investment_statements: "Statements",
  reports: "Reports",
  other: "Other",
};

export default function ClientDocuments({ documents = [] }) {
  return (
    <Card>
      <CardHeader title="Documents" subtitle="Client files and records" icon={FileText} />
      {documents.length === 0 ? (
        <EmptyState icon={FileText} title="No documents" description="Uploaded documents will appear here." />
      ) : (
        <div className="space-y-2">
          {documents.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
              <span className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0" style={{ background: "var(--danger-dim)", color: "var(--danger)" }}>
                <FileText size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{d.name}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {(d.sizeKb / 1024).toFixed(1)} MB · {formatDate(d.uploadedAt)}
                </p>
              </div>
              <Badge tone="neutral">{CATEGORY_LABEL[d.category] || d.category}</Badge>
              <button className="p-1.5 rounded-lg" style={{ color: "var(--muted)" }} aria-label="Download">
                <Download size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
