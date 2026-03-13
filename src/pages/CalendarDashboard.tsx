import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Grid, Card, CardContent, Typography } from "@mui/material";

import {
  getTransactions,
  deleteTransaction,
} from "../services/transactionService";

import { getPersons } from "../services/personService";
import { useAppSelector } from "../hooks/reduxHooks";

export default function CalendarDashboard() {

  const navigate = useNavigate();

  const user = useAppSelector((state) => state.auth.user);

  const [date, setDate] = useState(new Date());
  const [transactions, setTransactions] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const t = await getTransactions(user.uid);
    const p = await getPersons(user.uid);

    setTransactions(t);
    setPersons(p);
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    loadData();
  };

  const personMap = Object.fromEntries(
    persons.map((p) => [p.id, p.name])
  );

  // Transactions of selected day
  const selectedTransactions = transactions.filter((t) => {
    const tDate = t.date?.seconds
      ? new Date(t.date.seconds * 1000)
      : new Date(t.date);

    return tDate.toDateString() === date.toDateString();
  });

  // Calendar day totals
  const tileContent = ({ date }: any) => {

    const dailyTransactions = transactions.filter((t) => {
      const tDate = t.date?.seconds
        ? new Date(t.date.seconds * 1000)
        : new Date(t.date);

      return tDate.toDateString() === date.toDateString();
    });

    if (!dailyTransactions.length) return null;

    let total = 0;

    dailyTransactions.forEach((t) => {
      if (t.type === "income" || t.type === "borrow") total += t.amount;
      if (t.type === "expense" || t.type === "lent") total -= t.amount;
    });

    return (
      <div style={{ fontSize: 12 }}>
        {total >= 0 ? (
          <span style={{ color: "green" }}>+₹{total}</span>
        ) : (
          <span style={{ color: "red" }}>₹{total}</span>
        )}
      </div>
    );
  };

  const summary = transactions.reduce(
  (acc, t) => {

    if (t.type === "income") acc.income += t.amount;
    if (t.type === "expense") acc.expense += t.amount;
    if (t.type === "borrow") acc.borrow += t.amount;
    if (t.type === "lent") acc.lent += t.amount;

    if (t.status === "pending") acc.pending += t.amount;
    if (t.status === "completed") acc.completed += t.amount;

    return acc;

  },
  {
    income: 0,
    expense: 0,
    borrow: 0,
    lent: 0,
    pending: 0,
    completed: 0,
  }
);
const balance =
  summary.income +
  summary.borrow -
  summary.expense -
  summary.lent;

  return (
    <div>

      <h2>Calendar Dashboard</h2>


<Grid container spacing={2} sx={{ mb: 3 }}>

  <Grid size={{ xs: 12, md: 2 }}>
    <Card>
      <CardContent>
        <Typography variant="h6">Income</Typography>
        <Typography sx={{ color: "green" }}>
          ₹{summary.income}
        </Typography>
      </CardContent>
    </Card>
  </Grid>

  <Grid size={{ xs: 12, md: 2 }}>
    <Card>
      <CardContent>
        <Typography variant="h6">Expense</Typography>
        <Typography sx={{ color: "red" }}>
          ₹{summary.expense}
        </Typography>
      </CardContent>
    </Card>
  </Grid>

  <Grid size={{ xs: 12, md: 2 }}>
    <Card>
      <CardContent>
        <Typography variant="h6">Borrow</Typography>
        <Typography>
          ₹{summary.borrow}
        </Typography>
      </CardContent>
    </Card>
  </Grid>

  <Grid size={{ xs: 12, md: 2 }}>
    <Card>
      <CardContent>
        <Typography variant="h6">Lent</Typography>
        <Typography>
          ₹{summary.lent}
        </Typography>
      </CardContent>
    </Card>
  </Grid>

  <Grid size={{ xs: 12, md: 2 }}>
    <Card>
      <CardContent>
        <Typography variant="h6">Pending</Typography>
        <Typography sx={{ color: "orange" }}>
          ₹{summary.pending}
        </Typography>
      </CardContent>
    </Card>
  </Grid>

  <Grid size={{ xs: 12, md: 2 }}>
    <Card>
      <CardContent>
        <Typography variant="h6">Balance</Typography>
        <Typography sx={{ color: "blue" }}>
          ₹{balance}
        </Typography>
      </CardContent>
    </Card>
  </Grid>

</Grid>
      <Calendar
        value={date}
        onChange={(value) => setDate(value as Date)}
        tileContent={tileContent}
      />

      <h3 style={{ marginTop: 20 }}>
        Transactions on {date.toDateString()}
      </h3>

      {selectedTransactions.length === 0 && (
        <p>No transactions</p>
      )}

      {selectedTransactions.map((t) => (
        <div
          key={t.id}
          style={{
            border: "1px solid #ddd",
            padding: "10px",
            marginTop: "10px",
          }}
        >

          <strong>{personMap[t.personId]}</strong>

          <div>Type: {t.type}</div>
          <div>Amount: ₹{t.amount}</div>
          <div>Status: {t.status}</div>

          <div style={{ marginTop: 6 }}>

            <Button
              size="small"
              onClick={() =>
                navigate(`/transactions/edit/${t.id}`)
              }
            >
              Edit
            </Button>

            <Button
              size="small"
              color="error"
              onClick={() => handleDelete(t.id)}
            >
              Delete
            </Button>

          </div>

        </div>
      ))}

    </div>
  );
}