import { db } from "../firebase/firebaseConfig"
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore"

export const addRecurring = async (data: any) => {
  return addDoc(collection(db, "recurringTemplates"), data)
}

export const getRecurringTemplates = async (userId: string) => {
  const q = query(
    collection(db, "recurringTemplates"),
    where("userId", "==", userId)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const updateRecurring = async (id: string, data: any) => {
  return updateDoc(doc(db, "recurringTemplates", id), data)
}

export const deleteRecurring = async (id: string) => {
  return deleteDoc(doc(db, "recurringTemplates", id))
}