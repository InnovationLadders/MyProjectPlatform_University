import { getFirestore } from './firebase.js';
import admin from 'firebase-admin';
const COLLECTIONS = {
    LTI_SESSIONS: 'lti_sessions',
    USERS: 'users',
    LTI_CONTEXTS: 'lti_contexts',
    LTI_RESOURCE_LINKS: 'lti_resource_links',
    LTI_LAUNCHES: 'lti_launches',
    LTI_GRADE_PASSBACKS: 'lti_grade_passbacks'
};
export async function createLTISession(nonce, state, expiresInMinutes = 10) {
    const db = getFirestore();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);
    const session = {
        nonce,
        state,
        createdAt: admin.firestore.Timestamp.fromDate(now),
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt)
    };
    const docRef = await db.collection(COLLECTIONS.LTI_SESSIONS).add(session);
    return docRef.id;
}
export async function getLTISessionByNonce(nonce) {
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
        data: doc.data()
    };
}
export async function deleteLTISession(sessionId) {
    const db = getFirestore();
    await db.collection(COLLECTIONS.LTI_SESSIONS).doc(sessionId).delete();
}
export async function getUserByLTIUserId(ltiUserId) {
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
        data: doc.data()
    };
}
export async function createUser(userData) {
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
export async function updateUser(userId, userData) {
    const db = getFirestore();
    const now = admin.firestore.Timestamp.now();
    await db.collection(COLLECTIONS.USERS).doc(userId).update({
        ...userData,
        updatedAt: now
    });
}
export async function createOrUpdateContext(context) {
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
export async function createOrUpdateResourceLink(resourceLink) {
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
export async function createLaunchRecord(launch) {
    const db = getFirestore();
    const docRef = await db.collection(COLLECTIONS.LTI_LAUNCHES).add({
        ...launch,
        timestamp: admin.firestore.Timestamp.now()
    });
    return docRef.id;
}
export async function createGradePassback(gradeData) {
    const db = getFirestore();
    const docRef = await db.collection(COLLECTIONS.LTI_GRADE_PASSBACKS).add({
        ...gradeData,
        createdAt: admin.firestore.Timestamp.now()
    });
    return docRef.id;
}
export async function updateGradePassback(gradeId, updates) {
    const db = getFirestore();
    await db.collection(COLLECTIONS.LTI_GRADE_PASSBACKS).doc(gradeId).update(updates);
}
export async function cleanExpiredSessions() {
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
