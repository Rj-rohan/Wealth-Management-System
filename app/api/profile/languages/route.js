import { createCollectionRoutes } from "@/lib/api/collectionRoute";

export const { POST, PUT, DELETE } = createCollectionRoutes("advisor_languages", [
  "language",
  "proficiency",
]);
