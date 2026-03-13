import { db } from "../firebase/firebaseConfig"
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore"


export const addTransaction = async (data: any) => {
  return addDoc(collection(db, "transactions"), data)
}


export const getTransactions = async (userId: string) => {
  const q = query(
    collection(db, "transactions"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  )

  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}


export const updateTransaction = async (id: string, data: any) => {
  const ref = doc(db, "transactions", id)
  return updateDoc(ref, data)
}


export const deleteTransaction = async (id: string) => {
  const ref = doc(db, "transactions", id)
  return deleteDoc(ref)
}