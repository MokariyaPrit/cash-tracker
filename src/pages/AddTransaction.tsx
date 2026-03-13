import { useEffect, useState } from "react"
import { TextField, MenuItem, Button, Checkbox, FormControlLabel } from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import dayjs from "dayjs"

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

  const user = useAppSelector((state) => state.auth.user)

  const [persons, setPersons] = useState<any[]>([])
  const [personId, setPersonId] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState("expense")
  const [date, setDate] = useState(dayjs())
  const [completed, setCompleted] = useState(true)

  useEffect(() => {
    if (!user) return

    loadPersons()

    if (id) {
      loadTransaction()
    }

  }, [user, id])

  if(!user) return null
  
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
      setCompleted(data.status === "completed")

      if (data.date?.seconds) {
        setDate(dayjs(new Date(data.date.seconds * 1000)))
      }

    }
  }

  const handleSave = async () => {

    if (!user) return

    const payload = {
      userId: user.uid,
      personId,
      amount: Number(amount),
      type,
      status: completed ? "completed" : "pending",
      date: date.toDate(),
    }

    if (id) {

      await updateTransaction(id, payload)

    } else {

      await addTransaction({
        ...payload,
        createdAt: new Date(),
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

      <DatePicker
        label="Transaction Date"
        value={date}
        onChange={(newValue) => setDate(newValue!)}
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={completed}
            onChange={(e) => setCompleted(e.target.checked)}
          />
        }
        label="Mark as Completed"
      />

      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={handleSave}
      >
        Save
      </Button>

    </div>
  )
}