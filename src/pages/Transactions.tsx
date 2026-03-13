import { useEffect, useState } from "react"
import { TextField, Button, MenuItem } from "@mui/material"

import { addTransaction } from "../services/transactionService"
import { getPersons } from "../services/personService"
import { useAppSelector } from "../hooks/reduxHooks"

export default function Transactions() {
  const user = useAppSelector((state: any) => state.auth.user)

  const [persons, setPersons] = useState<any[]>([])
  const [personId, setPersonId] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState("expense")

  useEffect(() => {
    loadPersons()
  }, [])

  const loadPersons = async () => {
    const data = await getPersons(user.uid)
    setPersons(data)
  }

  const handleAdd = async () => {
    await addTransaction({
      userId: user.uid,
      personId,
      amount: Number(amount),
      type,
      createdAt: new Date(),
      date: new Date(),
    })

    alert("Transaction Added")
  }

  return (
    <div>

      <h2>Add Transaction</h2>

      <TextField
        select
        label="Person"
        value={personId}
        onChange={(e) => setPersonId(e.target.value)}
        fullWidth
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
        onChange={(e) => setAmount(e.target.value)}
      />

      <TextField
        select
        label="Type"
        value={type}
        fullWidth
        onChange={(e) => setType(e.target.value)}
      >
        <MenuItem value="expense">Expense</MenuItem>
        <MenuItem value="income">Income</MenuItem>
        <MenuItem value="lent">Lent</MenuItem>
        <MenuItem value="borrow">Borrow</MenuItem>
      </TextField>

      <Button variant="contained" onClick={handleAdd}>
        Add Transaction
      </Button>

    </div>
  )
}