import { db } from "../firebase/firebaseConfig"
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore"

export const addTransaction = async (data: any) => {
  return addDoc(collection(db, "transactions"), data)
}

export const getTransactions = async (userId: string) => {
  const q = query(
    collection(db, "transactions"),
    where("userId", "==", userId)
  )

  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}