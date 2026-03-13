import { useEffect, useState } from "react"
import { TextField, MenuItem, Button } from "@mui/material"

import {
  addTransaction,
  updateTransaction
} from "../services/transactionService"

import { getPersons } from "../services/personService"
import { useAppSelector } from "../hooks/reduxHooks"

import { useNavigate, useParams } from "react-router-dom"

import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/firebaseConfig"

export default function AddTransaction() {

  const navigate = useNavigate()
  const { id } = useParams()

//   const user = useAppSelector((state: any) => state.auth.user)
const user = useAppSelector((state) => state.auth.user)

  const [persons, setPersons] = useState<any[]>([])
  const [personId, setPersonId] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState("expense")

  useEffect(() => {
    if (user) {
      loadPersons()
      if (id) loadTransaction()
    }
  }, [user])

   if (!user) return
   
  const loadPersons = async () => {
    const data = await getPersons(user.uid)
    setPersons(data)
  }

  const loadTransaction = async () => {
    const ref = doc(db, "transactions", id!)
    const snap = await getDoc(ref)

    if (snap.exists()) {
      const data: any = snap.data()

      setPersonId(data.personId)
      setAmount(data.amount)
      setType(data.type)
    }
  }

  const handleSave = async () => {

    const data = {
      userId: user.uid,
      personId,
      amount: Number(amount),
      type,
      date: new Date(),
    }

    if (id) {
      await updateTransaction(id, data)
    } else {
      await addTransaction({
        ...data,
        createdAt: new Date()
      })
    }

    navigate("/transactions")
  }

  return (
    <div>

      <h2>{id ? "Edit Transaction" : "Add Transaction"}</h2>

      <TextField
        select
        label="Person"
        fullWidth
        value={personId}
        onChange={(e) => setPersonId(e.target.value)}
      >
        {persons.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Amount"
        type="number"
        fullWidth
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <TextField
        select
        label="Type"
        fullWidth
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        <MenuItem value="expense">Expense</MenuItem>
        <MenuItem value="income">Income</MenuItem>
        <MenuItem value="lent">Lent</MenuItem>
        <MenuItem value="borrow">Borrow</MenuItem>
      </TextField>

      <Button
        variant="contained"
        onClick={handleSave}
      >
        Save
      </Button>

    </div>
  )
}