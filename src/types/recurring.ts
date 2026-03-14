export interface RecurringTemplate {
  id?: string
  userId: string
  personId: string
  amount: number
  type: "expense" | "income" | "advance"
  dayOfMonth: number        // 1–28
  description?: string
  createdAt: any
}