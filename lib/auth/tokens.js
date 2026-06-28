import "server-only";
import { randomBytes } from "node:crypto";

export function generateToken(bytes = 24) {
  return randomBytes(bytes).toString("hex");
}
