import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, collection, doc, type Firestore } from 'firebase/firestore';
import { FIREBASE_CONFIG, isFirebaseConfigured } from '../config';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. ' +
      'Create a Firebase project at https://console.firebase.google.com, ' +
      'enable Firestore, then add the VITE_FIREBASE_* values to your .env file and restart the dev server.'
    );
  }
  if (!app) {
    app = initializeApp(FIREBASE_CONFIG);
  }
  return app;
}

export function getDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

export const knowledgeEntriesCollection = () => collection(getDb(), 'knowledgeEntries');
export const embeddingVectorsCollection = () => collection(getDb(), 'embeddingVectors');
export const appConfigDoc = () => doc(getDb(), 'appConfig', 'global');
export const appConfigCollection = () => collection(getDb(), 'appConfig');
export const hostAppConfigDoc = (contextKey: string) => doc(getDb(), 'appConfig', contextKey);
