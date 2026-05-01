import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// Generic CRUD operations
export const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

export const getDocuments = async (collectionName, filters = []) => {
  try {
    let q = collection(db, collectionName);
    
    // Apply filters if any (e.g. [['status', '==', 'Active']])
    if (filters.length > 0) {
      filters.forEach(f => {
        q = query(q, where(f[0], f[1], f[2]));
      });
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

export const updateDocument = async (collectionName, id, data) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return { id, ...data };
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteDocument = async (collectionName, id) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return id;
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// Domain-specific services that use the generic ones
export const StudentService = {
  getAll: () => getDocuments('students'),
  add: (data) => addDocument('students', data),
  update: (id, data) => updateDocument('students', id, data),
  delete: (id) => deleteDocument('students', id)
};

export const TeacherService = {
  getAll: () => getDocuments('teachers'),
  add: (data) => addDocument('teachers', data),
  update: (id, data) => updateDocument('teachers', id, data),
  delete: (id) => deleteDocument('teachers', id)
};
