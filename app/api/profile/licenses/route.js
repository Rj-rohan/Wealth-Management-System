import { createCollectionRoutes } from "@/lib/api/collectionRoute";

export const { POST, PUT, DELETE } = createCollectionRoutes("advisor_licenses", [
  "license_number",
  "issuing_authority",
  "issue_date",
  "expiry_date",
  "verification_status",
]);
