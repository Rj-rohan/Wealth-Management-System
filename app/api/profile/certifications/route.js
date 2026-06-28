import { createCollectionRoutes } from "@/lib/api/collectionRoute";

export const { POST, PUT, DELETE } = createCollectionRoutes("advisor_certifications", [
  "certification_name",
  "issuing_organization",
  "credential_id",
  "issue_date",
  "expiry_date",
]);
