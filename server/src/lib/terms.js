// The Terms (session 40). Raise TERMS_VERSION whenever the wording on the
// /terms page changes in a way members must agree to again: everyone is
// then asked once more before they post, offer or answer.
export const TERMS_VERSION = 1;
export const termsAccepted = (u) => (u.terms_version ?? 0) >= TERMS_VERSION;
