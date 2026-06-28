// Server-side aggregation of an advisor's full profile across all tables.
import "server-only";
import { db } from "@/lib/db/database";
import { buildVerification } from "@/utils/profile";

export function getAggregateProfile(user) {
  const profile =
    db.findOne("advisor_profiles", { user_id: user.id }) ||
    db.insert("advisor_profiles", { user_id: user.id, email: user.email });

  const advisorId = user.id;

  const professional = db.findOne("advisor_professional_details", { advisor_id: advisorId }) || null;
  const availability = db.findOne("advisor_availability", { advisor_id: advisorId }) || null;

  const aggregate = {
    profile,
    professional,
    qualifications: db.findMany("advisor_qualifications", { advisor_id: advisorId }),
    certifications: db.findMany("advisor_certifications", { advisor_id: advisorId }),
    licenses: db.findMany("advisor_licenses", { advisor_id: advisorId }),
    languages: db.findMany("advisor_languages", { advisor_id: advisorId }),
    expertise: db.findMany("advisor_expertise", { advisor_id: advisorId }),
    availability,
  };

  aggregate.verification = buildVerification(aggregate, user);
  return aggregate;
}
