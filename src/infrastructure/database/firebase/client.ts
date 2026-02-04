/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FIRESTORE CLIENT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Singleton Firestore client with proper initialization.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { env } from '../../config/env.config.js';
import { createLogger } from '../../logging/pino.logger.js';

const logger = createLogger('firestore');

let firestoreInstance: Firestore | null = null;

/**
 * Get or initialize the Firestore client
 */
export function getFirestoreClient(): Firestore {
    if (firestoreInstance) {
        return firestoreInstance;
    }

    if (env.DB_TYPE !== 'firestore') {
        throw new Error('DB_TYPE is not set to firestore');
    }

    if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
        throw new Error('Missing Firebase configuration');
    }

    try {
        if (getApps().length === 0) {
            initializeApp({
                credential: cert({
                    projectId: env.FIREBASE_PROJECT_ID,
                    clientEmail: env.FIREBASE_CLIENT_EMAIL,
                    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });
            logger.info('Firebase Admin initialized');
        }

        firestoreInstance = getFirestore();
        logger.info('Firestore client connection established');
        return firestoreInstance;
    } catch (error) {
        logger.fatal('Failed to initialize Firestore', error as Error);
        throw error;
    }
}
