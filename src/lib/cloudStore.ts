import https from 'https';
import { DatabaseSchema, TestAttempt, User, Certificate, Answer } from './types';

const CLOUD_OBJECT_ID = 'ff808181a09d98f701a1107c2fa0074f';
const CLOUD_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;

export interface CloudPayload {
  users: User[];
  attempts: TestAttempt[];
  certificates: Certificate[];
  answers: Answer[];
}

let inMemoryCloudCache: CloudPayload | null = null;
let lastCloudFetchTime = 0;
const CACHE_TTL_MS = 2000; // 2 seconds cache for responsiveness

export async function fetchCloudRegistry(): Promise<CloudPayload> {
  const now = Date.now();
  if (inMemoryCloudCache && now - lastCloudFetchTime < CACHE_TTL_MS) {
    return inMemoryCloudCache;
  }

  return new Promise((resolve) => {
    const req = https.get(CLOUD_URL, { timeout: 4000 }, (res) => {
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
      console.warn('Could not reach cloud registry:', err.message);
      resolve(inMemoryCloudCache || { users: [], attempts: [], certificates: [], answers: [] });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(inMemoryCloudCache || { users: [], attempts: [], certificates: [], answers: [] });
    });
  });
}

export async function saveCloudRegistry(payload: CloudPayload): Promise<boolean> {
  inMemoryCloudCache = payload;
  lastCloudFetchTime = Date.now();

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
      CLOUD_URL,
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
      console.error('Failed to sync to cloud registry:', err.message);
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
