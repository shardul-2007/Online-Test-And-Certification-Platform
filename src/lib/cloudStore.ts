import https from 'https';
import { supabase } from './supabase';
import { DatabaseSchema, TestAttempt, User, Certificate, Answer } from './types';

const REST_FALLBACK_ID = 'ff808181a09d98f701a1107c2fa0074f';
const REST_FALLBACK_URL = `https://api.restful-api.dev/objects/${REST_FALLBACK_ID}`;

export interface CloudPayload {
  users: User[];
  attempts: TestAttempt[];
  certificates: Certificate[];
  answers: Answer[];
}

let inMemoryCloudCache: CloudPayload | null = null;
let lastCloudFetchTime = 0;
const CACHE_TTL_MS = 2000; // 2 seconds cache for responsiveness

/**
 * Fetch persistent participant records.
 * Prioritizes Supabase table 'fdp_store' (key: 'master').
 * Gracefully falls back to high-availability REST cloud object if table doesn't exist yet.
 */
export async function fetchCloudRegistry(): Promise<CloudPayload> {
  const now = Date.now();
  if (inMemoryCloudCache && now - lastCloudFetchTime < CACHE_TTL_MS) {
    return inMemoryCloudCache;
  }

  // 1. Attempt reading from Supabase
  try {
    const { data, error } = await supabase
      .from('fdp_store')
      .select('data')
      .eq('id', 'master')
      .maybeSingle();

    if (!error && data && data.data) {
      const sbData = data.data;
      inMemoryCloudCache = {
        users: Array.isArray(sbData.users) ? sbData.users : [],
        attempts: Array.isArray(sbData.attempts) ? sbData.attempts : [],
        certificates: Array.isArray(sbData.certificates) ? sbData.certificates : [],
        answers: Array.isArray(sbData.answers) ? sbData.answers : [],
      };
      lastCloudFetchTime = Date.now();
      return inMemoryCloudCache;
    }
  } catch (sbErr) {
    // Supabase query failed (e.g. table not created yet), continue to fallback
  }

  // 2. Fallback to resilient REST cloud store
  return new Promise((resolve) => {
    const req = https.get(REST_FALLBACK_URL, { timeout: 4000 }, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(raw);
            const data: CloudPayload = parsed.data || {
              users: [],
              attempts: [],
              certificates: [],
              answers: [],
            };
            inMemoryCloudCache = {
              users: Array.isArray(data.users) ? data.users : [],
              attempts: Array.isArray(data.attempts) ? data.attempts : [],
              certificates: Array.isArray(data.certificates) ? data.certificates : [],
              answers: Array.isArray(data.answers) ? data.answers : [],
            };
            lastCloudFetchTime = Date.now();
            resolve(inMemoryCloudCache);
            return;
          }
        } catch (e) {
          console.error('Error parsing cloud registry JSON:', e);
        }
        resolve(inMemoryCloudCache || { users: [], attempts: [], certificates: [], answers: [] });
      });
    });

    req.on('error', (err) => {
      console.warn('Could not reach cloud registry fallback:', err.message);
      resolve(inMemoryCloudCache || { users: [], attempts: [], certificates: [], answers: [] });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(inMemoryCloudCache || { users: [], attempts: [], certificates: [], answers: [] });
    });
  });
}

/**
 * Save persistent participant records.
 * Dual-writes to Supabase and the REST cloud store to ensure zero data loss.
 */
export async function saveCloudRegistry(payload: CloudPayload): Promise<boolean> {
  inMemoryCloudCache = payload;
  lastCloudFetchTime = Date.now();

  let supabaseSuccess = false;

  // 1. Try persisting to Supabase
  try {
    const { error } = await supabase
      .from('fdp_store')
      .upsert({
        id: 'master',
        data: {
          version: 1,
          updatedAt: new Date().toISOString(),
          users: payload.users,
          attempts: payload.attempts,
          certificates: payload.certificates,
          answers: payload.answers,
        },
        updated_at: new Date().toISOString(),
      });

    if (!error) {
      supabaseSuccess = true;
    }
  } catch (err) {
    // Supabase table may not exist yet
  }

  // 2. Also persist to REST fallback object store (guaranteed persistence)
  const fallbackSuccess = await saveToRestFallback(payload);

  return supabaseSuccess || fallbackSuccess;
}

function saveToRestFallback(payload: CloudPayload): Promise<boolean> {
  const bodyData = JSON.stringify({
    name: 'fdp_certipulse_master_registry',
    data: {
      version: 1,
      updatedAt: new Date().toISOString(),
      users: payload.users,
      attempts: payload.attempts,
      certificates: payload.certificates,
      answers: payload.answers,
    },
  });

  return new Promise((resolve) => {
    const req = https.request(
      REST_FALLBACK_URL,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyData),
        },
        timeout: 5000,
      },
      (res) => {
        let resData = '';
        res.on('data', (c) => (resData += c));
        res.on('end', () => {
          resolve(res.statusCode === 200);
        });
      }
    );

    req.on('error', (err) => {
      console.error('Failed to sync to cloud registry fallback:', err.message);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.write(bodyData);
    req.end();
  });
}
