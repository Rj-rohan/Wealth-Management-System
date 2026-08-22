import { GET as callbackGet } from "../../callback/route";

export async function GET(request) {
  return callbackGet(request);
}
