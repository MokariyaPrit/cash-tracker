export interface Transaction {
  id?: string
  userId: string
  personId: string
  type: "expense" | "income" | "lent" | "borrow"
  amount: number
  description?: string
  date: any
  completedDate?: any
  createdAt: any
  status: "pending" | "completed"
}