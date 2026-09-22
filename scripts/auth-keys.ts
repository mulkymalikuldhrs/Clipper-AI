/* Generate Convex Auth keys (JWT_PRIVATE_KEY + JWKS) with node:crypto. */
import { generateKeyPairSync } from "node:crypto";
import { writeFileSync } from "node:fs";

const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const jwk = publicKey.export({ format: "jwk" }) as Record<string, string>;
const jwks = { keys: [{ ...jwk, alg: "RS256", use: "sig", kid: "super-clipper" }] };

writeFileSync("/tmp/sc-jwt.pem", pem);
writeFileSync("/tmp/sc-jwks.json", JSON.stringify(jwks));
console.log("OK keys written");
