import jsonwebtoken from "jsonwebtoken";

/**
 * Generates a JWT for GitHub App authentication
 */
export function generateJWT(appId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iat: now,
    exp: now + 10 * 60,
    iss: parseInt(appId, 10), // GitHub requires 'iss' to be an integer
  };

  return jsonwebtoken.sign(payload, privateKey, { algorithm: "RS256" });
}
