import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let db: Firestore;

function formatPrivateKey(key: string): string {
  let cleaned = key.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
}

function initializeFirebase() {
  let app: App;
  const apps = getApps();

  if (apps.length > 0) {
    app = apps[0];
  } else {
    const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.resolve(process.cwd(), 'serviceAccountKey.json');

    if (fs.existsSync(keyPath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        app = initializeApp({
          credential: cert(serviceAccount),
        });
        console.log('✅ Firebase Admin (Firestore) initialized with serviceAccountKey.json file');
      } catch (err) {
        console.error('❌ Failed to parse serviceAccountKey.json:', err);
        app = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'kin-link-demo' });
      }
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        app = initializeApp({
          credential: cert(serviceAccount),
        });
        console.log('✅ Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT_JSON');
      } catch (err) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err);
        app = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'kin-link-demo' });
      }
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      try {
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(decoded);
        app = initializeApp({
          credential: cert(serviceAccount),
        });
        console.log('✅ Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT_BASE64');
      } catch (err) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:', err);
        app = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'kin-link-demo' });
      }
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      try {
        app = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID.trim(),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL.trim(),
            privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
          }),
        });
        console.log('✅ Firebase Admin (Firestore) initialized with environment variables');
      } catch (err) {
        console.error('❌ Failed to initialize Firebase with environment variables:', err);
        app = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'kin-link-demo' });
      }
    } else {
      console.warn('⚠️ No Firebase service account found. Please provide serviceAccountKey.json or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.');
      app = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'kin-link-demo',
      });
      console.log('ℹ️ Firebase Firestore initialized with fallback projectId');
    }
  }

  db = getFirestore(app);
}

initializeFirebase();

export { db };
