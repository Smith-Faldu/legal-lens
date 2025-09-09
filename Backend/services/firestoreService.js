import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  setDoc,
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase.js';
import admin from '../config/firebaseAdmin.js';

// User operations
export const saveUserData = async (uid, userData) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    // If document doesn't exist, create it
    if (error.code === 'not-found') {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return true;
    }
    throw error;
  }
};

export const getUserData = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Get user data error:', error);
    throw error;
  }
};

export const updateUserData = async (uid, updateData) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Update user data error:', error);
    throw error;
  }
};

// Document operations
export const saveDocumentData = async (documentId, documentData) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await setDoc(docRef, {
      ...documentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Save document data error:', error);
    throw error;
  }
};

export const getDocumentData = async (documentId) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Get document data error:', error);
    throw error;
  }
};

export const getUserDocuments = async (userId, options = {}) => {
  try {
    const { 
      page = 1, 
      limit: docLimit = 10, 
      sortBy = 'createdAt', 
      order = 'desc' 
    } = options;

    const documentsRef = collection(db, 'documents');
    let q = query(
      documentsRef,
      where('userId', '==', userId),
      orderBy(sortBy, order),
      limit(docLimit)
    );

    // Add pagination if page > 1
    if (page > 1) {
      const offset = (page - 1) * docLimit;
      const offsetQuery = query(
        documentsRef,
        where('userId', '==', userId),
        orderBy(sortBy, order),
        limit(offset)
      );
      const offsetSnapshot = await getDocs(offsetQuery);
      const lastVisible = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
      
      if (lastVisible) {
        q = query(
          documentsRef,
          where('userId', '==', userId),
          orderBy(sortBy, order),
          startAfter(lastVisible),
          limit(docLimit)
        );
      }
    }

    const querySnapshot = await getDocs(q);
    const documents = [];
    
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });

    return documents;
  } catch (error) {
    console.error('Get user documents error:', error);
    throw error;
  }
};

export const updateDocumentData = async (documentId, updateData) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Update document data error:', error);
    throw error;
  }
};

export const deleteDocumentData = async (documentId) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Delete document data error:', error);
    throw error;
  }
};

// Analysis operations
export const saveAnalysisData = async (analysisId, analysisData) => {
  try {
    const analysisRef = doc(db, 'analyses', analysisId);
    await setDoc(analysisRef, {
      ...analysisData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Save analysis data error:', error);
    throw error;
  }
};

export const getAnalysisData = async (analysisId) => {
  try {
    const analysisRef = doc(db, 'analyses', analysisId);
    const analysisSnap = await getDoc(analysisRef);
    
    if (analysisSnap.exists()) {
      return { id: analysisSnap.id, ...analysisSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Get analysis data error:', error);
    throw error;
  }
};

export const getUserAnalyses = async (userId, options = {}) => {
  try {
    const { 
      page = 1, 
      limit: analysisLimit = 10, 
      documentId 
    } = options;

    const analysesRef = collection(db, 'analyses');
    let q = query(
      analysesRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(analysisLimit)
    );

    // Filter by document if specified
    if (documentId) {
      q = query(
        analysesRef,
        where('userId', '==', userId),
        where('documentId', '==', documentId),
        orderBy('createdAt', 'desc'),
        limit(analysisLimit)
      );
    }

    // Add pagination if page > 1
    if (page > 1) {
      const offset = (page - 1) * analysisLimit;
      const offsetQuery = query(
        analysesRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(offset)
      );
      const offsetSnapshot = await getDocs(offsetQuery);
      const lastVisible = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
      
      if (lastVisible) {
        q = query(
          analysesRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(analysisLimit)
        );
      }
    }

    const querySnapshot = await getDocs(q);
    const analyses = [];
    
    querySnapshot.forEach((doc) => {
      analyses.push({ id: doc.id, ...doc.data() });
    });

    return analyses;
  } catch (error) {
    console.error('Get user analyses error:', error);
    throw error;
  }
};

export const deleteAnalysisData = async (analysisId) => {
  try {
    const analysisRef = doc(db, 'analyses', analysisId);
    await deleteDoc(analysisRef);
    return true;
  } catch (error) {
    console.error('Delete analysis data error:', error);
    throw error;
  }
};

// Document Analysis operations (for uploadController)
export const saveDocumentAnalysis = async (documentData, userId) => {
  try {
    const documentId = `${userId}_${Date.now()}`;
    const documentRef = doc(db, 'documents', documentId);
    await setDoc(documentRef, {
      ...documentData,
      userId,
      documentId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return documentId;
  } catch (error) {
    console.error('Save document analysis error:', error);
    throw error;
  }
};

const firestore = admin.firestore();

export async function saveDocumentHistory(userId, documentData) {
  try {
    const docRef = firestore.collection('history').doc(userId);
    await docRef.set(
      { documents: admin.firestore.FieldValue.arrayUnion(documentData) },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Error saving document history:', error);
    throw error;
  }
}
