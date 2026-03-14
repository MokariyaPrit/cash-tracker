export interface Transaction {
  id?: string
  userId: string
  personId: string
  type: "expense" | "income" | "borrow" | "settlement"
  amount: number
  description?: string
  date: any
  completedDate?: any
  createdAt: any
  status: "pending" | "completed"
}