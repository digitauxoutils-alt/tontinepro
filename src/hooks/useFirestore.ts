// src/hooks/useFirestore.ts
import { useState, useEffect } from "react";
import { db } from "../config/firebase";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

// 🔹 Hook pour récupérer une collection Firestore
export function useCollection<T>(path: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, path);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        ...(doc.data() as T),
        id: doc.id,
      }));
      setData(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [path]);

  return { data, loading };
}

// 🔹 Hook pour récupérer un document Firestore
export function useDocument<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, path);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.data() as T);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [path]);

  return { data, loading };
}

// 🔹 Fonctions utilitaires Firestore
export const FirestoreService = {
  add: async (path: string, data: any) => {
    return await addDoc(collection(db, path), data);
  },
  set: async (path: string, id: string, data: any) => {
    return await setDoc(doc(db, path, id), data);
  },
  update: async (path: string, id: string, data: any) => {
    return await updateDoc(doc(db, path, id), data);
  },
  delete: async (path: string, id: string) => {
    return await deleteDoc(doc(db, path, id));
  },
  get: async (path: string, id: string) => {
    const snap = await getDoc(doc(db, path, id));
    return snap.exists() ? snap.data() : null;
  },
  list: async (path: string) => {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
};