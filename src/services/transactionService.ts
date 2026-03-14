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
  deleteDoc,
  writeBatch,
  Timestamp,
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

// ── Fetch only one month from Firestore ──────────────────────────────
export const getTransactionsByMonth = async (
  userId: string,
  year: number,
  month: number  // 0-indexed (0 = January)
) => {
  const start = Timestamp.fromDate(new Date(year, month, 1, 0, 0, 0, 0))
  const end = Timestamp.fromDate(new Date(year, month + 1, 0, 23, 59, 59, 999))

  const q = query(
    collection(db, "transactions"),
    where("userId", "==", userId),
    where("date", ">=", start),
    where("date", "<=", end),
    orderBy("date", "desc")
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

// ── Fetch by person — with optional month filter ─────────────────────
export const getTransactionsByPerson = async (
  userId: string,
  personId: string,
  year?: number,
  month?: number  // 0-indexed
) => {
  let q

  if (year !== undefined && month !== undefined) {
    const start = Timestamp.fromDate(new Date(year, month, 1, 0, 0, 0, 0))
    const end = Timestamp.fromDate(new Date(year, month + 1, 0, 23, 59, 59, 999))

    q = query(
      collection(db, "transactions"),
      where("userId", "==", userId),
      where("personId", "==", personId),
      where("date", ">=", start),
      where("date", "<=", end),
      orderBy("date", "asc")
    )
  } else {
    // full history — no date filter
    q = query(
      collection(db, "transactions"),
      where("userId", "==", userId),
      where("personId", "==", personId),
      orderBy("date", "asc")
    )
  }

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

export const bulkMarkCompleted = async (ids: string[], completedDate: Date) => {
  const batch = writeBatch(db)
  ids.forEach((id) => {
    const ref = doc(db, "transactions", id)
    batch.update(ref, { status: "completed", completedDate })
  })
  return batch.commit()
}