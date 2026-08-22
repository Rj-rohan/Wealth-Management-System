import { GET as oauthGet } from "../../oauth/route";

export async function GET(request) {
  return oauthGet(request);
}
