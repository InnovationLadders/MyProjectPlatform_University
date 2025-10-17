import { getFirestore } from './firebase.js';
import admin from 'firebase-admin';
import type { LTISession, UserData, LTIContext, LTIResourceLink, LTILaunchRecord, GradePassback } from '../types/lti.js';

const COLLECTIONS = {
  LTI_SESSIONS: 'lti_sessions',
  USERS: 'users',
  LTI_CONTEXTS: 'lti_contexts',
  LTI_RESOURCE_LINKS: 'lti_resource_links',
  LTI_LAUNCHES: 'lti_launches',
  LTI_GRADE_PASSBACKS: 'lti_grade_passbacks'
};

export async function createLTISession(nonce: string, state: string, expiresInMinutes: number = 10): Promise<string> {
  const db = getFirestore();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);

  const session: Partial<LTISession> = {
    nonce,
    state,
    createdAt: admin.firestore.Timestamp.fromDate(now) as any,
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt) as any
  };

  const docRef = await db.collection(COLLECTIONS.LTI_SESSIONS).add(session);
  return docRef.id;
}

export async function getLTISessionByNonce(nonce: string): Promise<{ id: string; data: LTISession } | null> {
  const db = getFirestore();
  const snapshot = await db.collection(COLLECTIONS.LTI_SESSIONS)
    .where('nonce', '==', nonce)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    data: doc.data() as LTISession
  };
}

export async function deleteLTISession(sessionId: string): Promise<void> {
  const db = getFirestore();
  await db.collection(COLLECTIONS.LTI_SESSIONS).doc(sessionId).delete();
}

export async function getUserByLTIUserId(ltiUserId: string): Promise<{ id: string; data: UserData } | null> {
  const db = getFirestore();
  const snapshot = await db.collection(COLLECTIONS.USERS)
    .where('ltiUserId', '==', ltiUserId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    data: doc.data() as UserData
  };
}

export async function createUser(userData: Omit<UserData, 'createdAt' | 'updatedAt'>): Promise<string> {
  const db = getFirestore();
  const now = admin.firestore.Timestamp.now();

  const user = {
    ...userData,
    createdAt: now,
    updatedAt: now
  };

  const docRef = await db.collection(COLLECTIONS.USERS).add(user);
  return docRef.id;
}

export async function updateUser(userId: string, userData: Partial<UserData>): Promise<void> {
  const db = getFirestore();
  const now = admin.firestore.Timestamp.now();

  await db.collection(COLLECTIONS.USERS).doc(userId).update({
    ...userData,
    updatedAt: now
  });
}

export async function createOrUpdateContext(context: Omit<LTIContext, 'createdAt'>): Promise<string> {
  const db = getFirestore();
  const snapshot = await db.collection(COLLECTIONS.LTI_CONTEXTS)
    .where('contextId', '==', context.contextId)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }

  const docRef = await db.collection(COLLECTIONS.LTI_CONTEXTS).add({
    ...context,
    createdAt: admin.firestore.Timestamp.now()
  });

  return docRef.id;
}

export async function createOrUpdateResourceLink(resourceLink: Omit<LTIResourceLink, 'createdAt'>): Promise<string> {
  const db = getFirestore();
  const snapshot = await db.collection(COLLECTIONS.LTI_RESOURCE_LINKS)
    .where('resourceLinkId', '==', resourceLink.resourceLinkId)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const docId = snapshot.docs[0].id;
    await db.collection(COLLECTIONS.LTI_RESOURCE_LINKS).doc(docId).update(resourceLink);
    return docId;
  }

  const docRef = await db.collection(COLLECTIONS.LTI_RESOURCE_LINKS).add({
    ...resourceLink,
    createdAt: admin.firestore.Timestamp.now()
  });

  return docRef.id;
}

export async function createLaunchRecord(launch: Omit<LTILaunchRecord, 'timestamp'>): Promise<string> {
  const db = getFirestore();
  const docRef = await db.collection(COLLECTIONS.LTI_LAUNCHES).add({
    ...launch,
    timestamp: admin.firestore.Timestamp.now()
  });

  return docRef.id;
}

export async function createGradePassback(gradeData: Omit<GradePassback, 'createdAt'>): Promise<string> {
  const db = getFirestore();
  const docRef = await db.collection(COLLECTIONS.LTI_GRADE_PASSBACKS).add({
    ...gradeData,
    createdAt: admin.firestore.Timestamp.now()
  });

  return docRef.id;
}

export async function updateGradePassback(gradeId: string, updates: Partial<GradePassback>): Promise<void> {
  const db = getFirestore();
  await db.collection(COLLECTIONS.LTI_GRADE_PASSBACKS).doc(gradeId).update(updates);
}

export async function cleanExpiredSessions(): Promise<number> {
  const db = getFirestore();
  const now = admin.firestore.Timestamp.now();

  const snapshot = await db.collection(COLLECTIONS.LTI_SESSIONS)
    .where('expiresAt', '<', now)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return snapshot.size;
}
