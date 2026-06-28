"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { UserRound, Briefcase, GraduationCap, Award, ScrollText, Building2 } from "lucide-react";
import { Tabs, Skeleton } from "@/components/ui";
import { useProfile } from "../hooks/useProfile";
import { profileService } from "../services/profileService";
import {
  PERSONAL_FIELDS,
  PROFESSIONAL_FIELDS,
  OFFICE_FIELDS,
  QUALIFICATION_FIELDS,
  CERTIFICATION_FIELDS,
  LICENSE_FIELDS,
  PROFILE_TABS,
} from "../constants";
import { formatDate } from "@/utils/format";
import ProfileHeader from "./ProfileHeader";
import RecordSection from "./RecordSection";
import EntryListSection from "./EntryListSection";
import ExpertiseSection from "./ExpertiseSection";
import LanguagesSection from "./LanguagesSection";
import AvailabilitySection from "./AvailabilitySection";
import FeeStructureSection from "./FeeStructureSection";
import VerificationCard from "./VerificationCard";

export default function ProfileWorkspace() {
  const { profile, setProfile, loading } = useProfile();
  const params = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") || "personal");

  if (loading || !profile) {
    return (
      <div className="space-y-4">
        <Skeleton height={120} rounded={16} />
        <Skeleton height={44} rounded={12} />
        <Skeleton height={280} rounded={16} />
      </div>
    );
  }

  const onUpdated = setProfile;

  return (
    <div className="space-y-5">
      <ProfileHeader profile={profile} onUpdated={onUpdated} />

      <Tabs tabs={PROFILE_TABS} active={tab} onChange={setTab} />

      {tab === "personal" && (
        <RecordSection
          title="Personal Information"
          subtitle="Your basic details"
          icon={UserRound}
          fields={PERSONAL_FIELDS}
          data={profile.profile}
          onSave={(values) => profileService.updatePersonal(values)}
          onUpdated={onUpdated}
        />
      )}

      {tab === "professional" && (
        <div className="space-y-5">
          <RecordSection
            title="Professional Information"
            subtitle="Your advisory background"
            icon={Briefcase}
            fields={PROFESSIONAL_FIELDS}
            data={profile.professional || {}}
            onSave={(values) => profileService.updateProfessional(values)}
            onUpdated={onUpdated}
          />
          <ExpertiseSection entries={profile.expertise} onUpdated={onUpdated} />
          <LanguagesSection entries={profile.languages} onUpdated={onUpdated} />
          <RecordSection
            title="Office Information"
            subtitle="Where you operate from"
            icon={Building2}
            fields={OFFICE_FIELDS}
            data={profile.professional || {}}
            onSave={(values) => profileService.updateProfessional(values)}
            onUpdated={onUpdated}
          />
        </div>
      )}

      {tab === "education" && (
        <EntryListSection
          title="Educational Qualification"
          subtitle="Your academic background"
          icon={GraduationCap}
          collection="qualifications"
          fields={QUALIFICATION_FIELDS}
          entries={profile.qualifications}
          onUpdated={onUpdated}
          emptyText="Add your degrees and academic qualifications."
          renderSummary={(e) => (
            <>
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                {e.degree} {e.specialization ? `· ${e.specialization}` : ""}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {e.university || "—"} {e.passing_year ? `· ${e.passing_year}` : ""}
              </p>
              {e.description && (
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  {e.description}
                </p>
              )}
            </>
          )}
        />
      )}

      {tab === "certifications" && (
        <EntryListSection
          title="Certification"
          subtitle="Professional certifications"
          icon={Award}
          collection="certifications"
          fields={CERTIFICATION_FIELDS}
          entries={profile.certifications}
          onUpdated={onUpdated}
          emptyText="Add certifications like CFP®, CFA, or ChFC."
          renderSummary={(e) => (
            <>
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                {e.certification_name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {e.issuing_organization || "—"} {e.credential_id ? `· ID: ${e.credential_id}` : ""}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {formatDate(e.issue_date)} → {e.expiry_date ? formatDate(e.expiry_date) : "No expiry"}
              </p>
            </>
          )}
        />
      )}

      {tab === "licenses" && (
        <EntryListSection
          title="Professional License"
          subtitle="Regulatory licenses"
          icon={ScrollText}
          collection="licenses"
          fields={LICENSE_FIELDS}
          entries={profile.licenses}
          onUpdated={onUpdated}
          emptyText="Add the licenses that authorize your practice."
          renderSummary={(e) => (
            <>
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                {e.license_number}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {e.issuing_authority || "—"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {formatDate(e.issue_date)} → {e.expiry_date ? formatDate(e.expiry_date) : "No expiry"}
              </p>
            </>
          )}
        />
      )}

      {tab === "availability" && <AvailabilitySection availability={profile.availability} onUpdated={onUpdated} />}

      {tab === "fees" && <FeeStructureSection professional={profile.professional} onUpdated={onUpdated} />}

      {tab === "verification" && <VerificationCard verification={profile.verification} />}
    </div>
  );
}
