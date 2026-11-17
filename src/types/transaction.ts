export type TransactionMode = "regular" | "cashed"

export interface Transaction {
  id?: string
  userId: string
  personId: string
  mode: TransactionMode
  type: "expense" | "income" | "advance" | "settlement" | "salary"
  amount: number
  description?: string
  date: any
  completedDate?: any
  createdAt: any
  status: "pending" | "completed"
}

/** Older docs without mode are treated as regular. */
export const resolveTransactionMode = (mode?: string | null): TransactionMode =>
  mode === "cashed" ? "cashed" : "regular"