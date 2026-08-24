const { SignJWT, jwtVerify } = require("jose");

const SESSION_COOKIE_NAME = "fasteroid_session";
const SESSION_DURATION = "7d";
const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 7 * 1000; // 7 días, igual a SESSION_DURATION

function getSecretKey() {
  if (!process.env.AUTH_SECRET) {
    throw new Error("Falta la variable de entorno AUTH_SECRET");
  }
  return new TextEncoder().encode(process.env.AUTH_SECRET);
}

// payload: { telefono, nombre, rol }
async function signSession(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());
}

async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch {
    return null;
  }
}

async function setSessionCookie(res, payload) {
  const token = await signSession(payload);
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
}

module.exports = {
  SESSION_COOKIE_NAME,
  signSession,
  verifySessionToken,
  setSessionCookie,
  clearSessionCookie,
};
