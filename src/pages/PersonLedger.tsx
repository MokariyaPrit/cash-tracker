import { useEffect, useState } from "react";
import { Box, Typography, Button, Divider, Chip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";

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
      (t) => t.personId === person.id
    );
    let balance = 0;
    personTransactions.forEach((t) => {
      if (t.type === "income") balance += t.amount;
      if (t.type === "borrow") balance += t.amount;
      if (t.type === "expense") balance -= t.amount;
      if (t.type === "lent") balance -= t.amount;
    });
    return { id: person.id, name: person.name, balance };
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

  const currentBalance =
    personRows.length > 0 ? personRows[personRows.length - 1].balance : 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* ── Person Balances List ── */}
      {!selectedPerson && (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight={700}>
              Person Balances
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Overview of all your contacts and their current balances
            </Typography>
          </Box>

          <DataGrid
            rows={personBalances}
            columns={personColumns}
            autoHeight
            disableRowSelectionOnClick
          />
        </>
      )}

      {/* ── Selected Person Ledger ── */}
      {selectedPerson && (
        <>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 3,
              pb: 2.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            {/* Left: Back + Name */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => setSelectedPerson(null)}
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                  minWidth: "auto",
                  "&:hover": { backgroundColor: "action.hover" },
                }}
              >
                Back
              </Button>

              <Divider
                orientation="vertical"
                flexItem
                sx={{ height: 28, alignSelf: "center" }}
              />

              <Box>
                <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
                  {selectedPerson.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Transaction Ledger
                </Typography>
              </Box>
            </Box>

            {/* Right: Balance chip + Add button */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {personRows.length > 0 && (
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: currentBalance >= 0 ? "success.light" : "error.light",
                    backgroundColor: currentBalance >= 0
                      ? "rgba(46,125,50,0.06)"
                      : "rgba(211,47,47,0.06)",
                    minWidth: 120,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    Current Balance
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    color={currentBalance >= 0 ? "success.main" : "error.main"}
                  >
                    ₹{currentBalance}
                  </Typography>
                </Box>
              )}

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() =>
                  navigate(`/transactions/add?personId=${selectedPerson.id}`)
                }
                sx={{ borderRadius: 2, px: 2.5, fontWeight: 600 }}
              >
                Add Transaction
              </Button>
            </Box>
          </Box>

          {/* Transaction count badge */}
          <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={`${personRows.length} transaction${personRows.length !== 1 ? "s" : ""}`}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          </Box>

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