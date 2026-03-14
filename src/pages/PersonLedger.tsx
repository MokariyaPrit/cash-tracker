import { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";

import { getTransactions } from "../services/transactionService";
import { getPersons } from "../services/personService";
import { useAppSelector } from "../hooks/reduxHooks";
import { useNavigate } from "react-router-dom";
import { deleteTransaction } from "../services/transactionService";

import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useParams } from "react-router-dom";
import { useConfirm } from "../contexts/ConfirmContext";

export default function PersonLedger() {
  const user = useAppSelector((state) => state.auth.user);
  const [persons, setPersons] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const handleDelete = async (transactionId: string) => {
    const ok = await confirm({
      title: "Delete transaction?",
      message: "This transaction will be removed. This cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      confirmColor: "error",
    });
    if (!ok) return;
    await deleteTransaction(transactionId);
    loadData();
  };
  useEffect(() => {
    loadData();
  }, [user]);
  const loadData = async () => {
    if (!user) return;

    const t = await getTransactions(user.uid);
    const p = await getPersons(user.uid);

    setTransactions(t);
    setPersons(p);

    if (id) {
      const person = p.find((x) => x.id === id);
      setSelectedPerson(person);
    }
  };

  // PERSON BALANCE LIST
  const personBalances = persons.map((person) => {
    const personTransactions = transactions.filter(
      (t) => t.personId === person.id,
    );

    let balance = 0;

    personTransactions.forEach((t) => {
      if (t.type === "income") balance += t.amount;
      if (t.type === "borrow") balance += t.amount;

      if (t.type === "expense") balance -= t.amount;
      if (t.type === "lent") balance -= t.amount;
    });

    return {
      id: person.id,
      name: person.name,
      balance,
    };
  });

  const personColumns: GridColDef[] = [
    { field: "name", headerName: "Person", flex: 1 },

    {
      field: "balance",
      headerName: "Balance",
      flex: 1,
      renderCell: (params) => (
        <span style={{ color: params.value >= 0 ? "green" : "red" }}>
          ₹{params.value}
        </span>
      ),
    },

    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Button
          onClick={() =>
            setSelectedPerson(persons.find((p) => p.id === params.row.id))
          }
        >
          View Ledger
        </Button>
      ),
    },
  ];

  // PERSON TRANSACTION HISTORY
  let balance = 0;

  const personRows = transactions
    .filter((t) => t.personId === selectedPerson?.id)
    .sort((a, b) => {
      const aDate = a.date?.seconds
        ? new Date(a.date.seconds * 1000)
        : new Date(a.date);

      const bDate = b.date?.seconds
        ? new Date(b.date.seconds * 1000)
        : new Date(b.date);

      return aDate.getTime() - bDate.getTime();
    })
    .map((t) => {
      if (t.type === "income") balance += t.amount;
      if (t.type === "borrow") balance += t.amount;
      if (t.type === "expense") balance -= t.amount;
      if (t.type === "lent") balance -= t.amount;

      return {
        id: t.id,
        date: t.date?.seconds
          ? new Date(t.date.seconds * 1000).toLocaleDateString()
          : "",
        type: t.type,
        amount: t.amount,
        status: t.status,
        balance,
      };
    });

  const transactionColumns: GridColDef[] = [
    { field: "date", headerName: "Date", flex: 1 },

    { field: "type", headerName: "Type", flex: 1 },

    {
      field: "amount",
      headerName: "Amount",
      flex: 1,
      renderCell: (params) => `₹${params.value}`,
    },

    {
      field: "balance",
      headerName: "Balance",
      flex: 1,
      renderCell: (params) => (
        <span style={{ color: params.value >= 0 ? "green" : "red" }}>
          ₹{params.value}
        </span>
      ),
    },

    { field: "status", headerName: "Status", flex: 1 },

    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <Button
            size="small"
            onClick={() => navigate(`/transactions/edit/${params.row.id}`)}
          >
            Edit
          </Button>

          <Button
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

  return (
    <Box>
      {!selectedPerson && (
        <>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Person Balances
          </Typography>

          <DataGrid
            rows={personBalances}
            columns={personColumns}
            autoHeight
            disableRowSelectionOnClick
          />
        </>
      )}

      {selectedPerson && (
        <>
          <Button sx={{ mb: 2 }} onClick={() => setSelectedPerson(null)}>
            ← Back
          </Button>

          <Button
            variant="contained"
            sx={{ mb: 2 }}
            onClick={() =>
              navigate(`/transactions/add?personId=${selectedPerson.id}`)
            }
          >
            Add Transaction
          </Button>

          <Typography variant="h4" sx={{ mb: 2 }}>
            {selectedPerson.name} Ledger
          </Typography>

          <DataGrid
            rows={personRows}
            columns={transactionColumns}
            autoHeight
            disableRowSelectionOnClick
          />
        </>
      )}
    </Box>
  );
}
