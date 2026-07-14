import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-change-this-in-production";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload {
  userId: string;
  role: string;
  kampusId: string | null;
  nim: string | null;
  [key: string]: any;
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d") // 1 day
    .sign(encodedSecret);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}
