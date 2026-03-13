import { db } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where
} from "firebase/firestore";

export const addPerson = async (person: any) => {
  return addDoc(collection(db, "persons"), person);
};

export const getPersons = async (userId: string) => {
  const q = query(collection(db, "persons"), where("userId", "==", userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const deletePerson = async (id: string) => {
  return deleteDoc(doc(db, "persons", id));
};