// Server-side aggregation of an advisor's full profile across all PostgreSQL tables.
import "server-only";
import { db } from "@/lib/db/database";
import { buildVerification } from "@/utils/profile";

export async function getAggregateProfile(user) {
  let profile = await db.findOne("advisor_profiles", { user_id: user.id });
  if (!profile) {
    profile = await db.insert("advisor_profiles", { user_id: user.id, email: user.email });
  }

  const advisorId = user.id;

  const [
    professional,
    availability,
    qualifications,
    certifications,
    licenses,
    languages,
    expertise,
  ] = await Promise.all([
    db.findOne("advisor_professional_details", { advisor_id: advisorId }),
    db.findOne("advisor_availability", { advisor_id: advisorId }),
    db.findMany("advisor_qualifications", { advisor_id: advisorId }),
    db.findMany("advisor_certifications", { advisor_id: advisorId }),
    db.findMany("advisor_licenses", { advisor_id: advisorId }),
    db.findMany("advisor_languages", { advisor_id: advisorId }),
    db.findMany("advisor_expertise", { advisor_id: advisorId }),
  ]);

  const aggregate = {
    profile: profile || {},
    professional: professional || null,
    qualifications: qualifications || [],
    certifications: certifications || [],
    licenses: licenses || [],
    languages: languages || [],
    expertise: expertise || [],
    availability: availability || null,
  };

  aggregate.verification = buildVerification(aggregate, user);
  return aggregate;
}
