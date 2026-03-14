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

// ── Keep original — used as fallback / person ledger all history ─────
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

// ── NEW: fetch only one month from Firestore ─────────────────────────
export const getTransactionsByMonth = async (
  userId: string,
  year: number,
  month: number
) => {
  const start = Timestamp.fromDate(new Date(year, month, 1, 0, 0, 0, 0))
  const end = Timestamp.fromDate(new Date(year, month + 1, 0, 23, 59, 59, 999))

  try {
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", userId),
      where("date", ">=", start),
      where("date", "<=", end),
      orderBy("date", "desc")
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (error: any) {
    // If index is missing, Firebase error contains a direct URL to create it
    // Log it so you can click the link in console
    console.error("getTransactionsByMonth error:", error)

    // Fallback: fetch all user transactions and filter in JS
    const fallback = query(
      collection(db, "transactions"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    )
    const snapshot = await getDocs(fallback)
    const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    // Filter by month in JS as fallback
    return all.filter((t: any) => {
      const d = t.date?.seconds
        ? new Date(t.date.seconds * 1000)
        : new Date(t.date)
      return (
        d.getMonth() === month &&
        d.getFullYear() === year
      )
    })
  }
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