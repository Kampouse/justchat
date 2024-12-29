import * as jose from "jose";

const access = "rw"; // or "ro";

const keyPair = await crypto.subtle.generateKey(
  {
    name: "Ed25519",
    namedCurve: "Ed25519",
  },
  true,
  ["sign", "verify"],
);

const rawPublicKey = await crypto.subtle.exportKey("raw", keyPair.publicKey);

const urlSafeBase64PublicKey = btoa(
  String.fromCharCode(...new Uint8Array(rawPublicKey)),
)
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");

console.log("Public Key\n", urlSafeBase64PublicKey);

const jwt = await new jose.SignJWT({ a: access })
  .setProtectedHeader({ alg: "EdDSA", typ: "JWT" })
  .setIssuedAt()
  .sign(keyPair.privateKey);

console.log("JWT\n", jwt);
