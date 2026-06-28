import { createCollectionRoutes } from "@/lib/api/collectionRoute";

export const { POST, PUT, DELETE } = createCollectionRoutes("advisor_qualifications", [
  "degree",
  "university",
  "specialization",
  "passing_year",
  "description",
]);
