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
  month?: number
) => {
  try {
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
      q = query(
        collection(db, "transactions"),
        where("userId", "==", userId),
        where("personId", "==", personId),
        orderBy("date", "asc")
      )
    }
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

  } catch (error: any) {
    console.error("Index missing — click this URL to create it:", error)

    // ── Fallback: fetch without date filter, filter in JS ──
    const fallback = query(
      collection(db, "transactions"),
      where("userId", "==", userId),
      where("personId", "==", personId),
    )
    const snapshot = await getDocs(fallback)
    const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    if (year !== undefined && month !== undefined) {
      return all
        .filter((t: any) => {
          const d = t.date?.seconds
            ? new Date(t.date.seconds * 1000)
            : new Date(t.date)
          return d.getMonth() === month && d.getFullYear() === year
        })
        .sort((a: any, b: any) => {
          const aDate = a.date?.seconds ? new Date(a.date.seconds * 1000) : new Date(a.date)
          const bDate = b.date?.seconds ? new Date(b.date.seconds * 1000) : new Date(b.date)
          return aDate.getTime() - bDate.getTime()
        })
    }

    return all.sort((a: any, b: any) => {
      const aDate = a.date?.seconds ? new Date(a.date.seconds * 1000) : new Date(a.date)
      const bDate = b.date?.seconds ? new Date(b.date.seconds * 1000) : new Date(b.date)
      return aDate.getTime() - bDate.getTime()
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