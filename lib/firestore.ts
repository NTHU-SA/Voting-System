import admin from "firebase-admin";

interface FirestoreCache {
  db: admin.firestore.Firestore | null;
}

declare global {
  // eslint-disable-next-line no-var
  var firestoreCache: FirestoreCache | undefined;
}

let cached: FirestoreCache = global.firestoreCache || {
  db: null,
};

if (!global.firestoreCache) {
  global.firestoreCache = cached;
}

/**
 * Initialize Firebase Admin SDK with service account credentials
 */
function initializeFirebase(): admin.app.App {
  // Check if already initialized
  if (admin.apps.length > 0) {
    return admin.apps[0] as admin.app.App;
  }

  // Initialize with service account
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!serviceAccount) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT environment variable is required"
    );
  }

  let credential: admin.credential.Credential;

  try {
    // Parse service account JSON
    const serviceAccountJson = JSON.parse(serviceAccount);
    credential = admin.credential.cert(serviceAccountJson);
  } catch (error) {
    throw new Error(
      "Failed to parse FIREBASE_SERVICE_ACCOUNT: " +
        (error instanceof Error ? error.message : "Invalid JSON")
    );
  }

  return admin.initializeApp({
    credential,
    projectId,
  });
}

/**
 * Get Firestore database instance
 */
async function getFirestore(): Promise<admin.firestore.Firestore> {
  if (cached.db) {
    return cached.db;
  }

  try {
    initializeFirebase();
    cached.db = admin.firestore();

    // Set timestamp settings
    cached.db.settings({
      ignoreUndefinedProperties: true,
    });

    return cached.db;
  } catch (error) {
    throw new Error(
      "Failed to initialize Firestore: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
  }
}

export default getFirestore;

// Export Firestore types for convenience
export { admin };
export type { Firestore, DocumentData, Timestamp } from "firebase-admin/firestore";
