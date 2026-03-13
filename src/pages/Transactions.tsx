import { useEffect, useState } from "react"
import { Button } from "@mui/material"
import { useNavigate } from "react-router-dom"

import {
  getTransactions,
  deleteTransaction
} from "../services/transactionService"

import { getPersons } from "../services/personService"
import { useAppSelector } from "../hooks/reduxHooks"

export default function Transactions() {

  const navigate = useNavigate()

  const user = useAppSelector((state) => state.auth.user)

  const [transactions, setTransactions] = useState<any[]>([])
  const [persons, setPersons] = useState<any[]>([])

  const loadData = async () => {

    if (!user) return

    const personsData = await getPersons(user.uid)
    const transactionData = await getTransactions(user.uid)

    setPersons(personsData)
    setTransactions(transactionData)
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleDelete = async (id: string) => {
    await deleteTransaction(id)
    loadData()
  }

  const personMap = Object.fromEntries(
    persons.map((p) => [p.id, p.name])
  )

  return (
    <div>

      <h2>Ledger</h2>

      <Button
        variant="contained"
        onClick={() => navigate("/transactions/add")}
      >
        Add Transaction
      </Button>

      {transactions.map((t) => (
        <div
          key={t.id}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginTop: "10px"
          }}
        >

          <strong>{t.type.toUpperCase()}</strong>

          <div>Person: {personMap[t.personId]}</div>

          <div>Amount: ₹{t.amount}</div>

          <Button
            onClick={() => navigate(`/transactions/edit/${t.id}`)}
          >
            Edit
          </Button>

          <Button
            color="error"
            onClick={() => handleDelete(t.id)}
          >
            Delete
          </Button>

        </div>
      ))}

    </div>
  )
}