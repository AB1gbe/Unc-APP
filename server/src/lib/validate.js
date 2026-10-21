// Tiny input validators. Each returns the cleaned value or throws a 400.
import { HttpError } from './http.js';

export function str(body, field, { min = 1, max = 200, optional = false } = {}) {
  const raw = body?.[field];
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    if (optional) return null;
    throw new HttpError(400, `${field} is required.`, { field });
  }
  const value = String(raw).trim();
  if (value.length < min) throw new HttpError(400, `${field} must be at least ${min} characters.`, { field });
  if (value.length > max) throw new HttpError(400, `${field} must be at most ${max} characters.`, { field });
  return value;
}

export function int(body, field, { min = 0, max = 1_000_000_000, optional = false } = {}) {
  const raw = body?.[field];
  if (raw === undefined || raw === null || raw === '') {
    if (optional) return null;
    throw new HttpError(400, `${field} is required.`, { field });
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new HttpError(400, `${field} must be a whole number between ${min} and ${max}.`, { field });
  }
  return value;
}

export function oneOf(body, field, allowed, { optional = false } = {}) {
  const raw = body?.[field];
  if ((raw === undefined || raw === '') && optional) return null;
  if (!allowed.includes(raw)) {
    throw new HttpError(400, `${field} must be one of: ${allowed.join(', ')}.`, { field });
  }
  return raw;
}

export function email(body, field = 'email') {
  const value = str(body, field, { max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new HttpError(400, 'Please enter a valid email address.', { field });
  }
  return value;
}

export function isoDate(body, field, { optional = false } = {}) {
  const value = str(body, field, { max: 10, optional });
  if (value === null) return null;
  // Round-trip through a real date so impossible days (2026-02-31) fail:
  // JavaScript would silently turn them into March 3.
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, `${field} must be a date like 2026-01-31.`, { field });
  }
  return value;
}

export function password(body, field = 'password') {
  const value = str(body, field, { min: 8, max: 200 });
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    throw new HttpError(400, 'Password needs at least 8 characters with letters and numbers.', { field });
  }
  return value;
}

export function ageOn(dobIso, today = new Date()) {
  const dob = new Date(dobIso + 'T00:00:00Z');
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const m = today.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}
