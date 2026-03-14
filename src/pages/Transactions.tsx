import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  useTheme,
  alpha,
  Stack,
  CircularProgress,
  Tooltip,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  getTransactions,
  deleteTransaction,
} from "../services/transactionService";
import { getPersons } from "../services/personService";
import { useAppSelector } from "../hooks/reduxHooks";
import { useConfirm } from "../contexts/ConfirmContext";
import { DataGrid, type GridColDef, GridToolbar } from "@mui/x-data-grid";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

export default function Transactions() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const theme = useTheme();
  const user = useAppSelector((state) => state.auth.user);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [personsData, transactionData] = await Promise.all([
        getPersons(user.uid),
        getTransactions(user.uid),
      ]);
      setPersons(personsData);
      setTransactions(transactionData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete transaction?",
      message: "This transaction will be removed. This cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      confirmColor: "error",
    });
    if (!ok) return;
    await deleteTransaction(id);
    loadData();
  };

  const personMap = Object.fromEntries(persons.map((p) => [p.id, p.name]));

  const sortedTransactions = [...transactions].sort((a, b) => {
    const aDate = a.date?.seconds
      ? new Date(a.date.seconds * 1000)
      : new Date(a.date);
    const bDate = b.date?.seconds
      ? new Date(b.date.seconds * 1000)
      : new Date(b.date);
    return bDate.getTime() - aDate.getTime();
  });

  const reversed = [...sortedTransactions].reverse();
  let balance = 0;
  const rows = reversed
    .map((t) => {
      if (t.type === "income") balance += t.amount;
      if (t.type === "expense") balance -= t.amount;
      if (t.type === "borrow") balance += t.amount;
       // settlement resets balance to 0 — don't add/subtract, just reset
      if (t.type === "settlement") balance = 0;
      return {
        id: t.id,
        date: t.date?.seconds
          ? new Date(t.date.seconds * 1000).toLocaleDateString("en-GB")
          : "-",
        person: personMap[t.personId] || "-",
        type: t.type,
        amount: t.amount,
        status: t.status,
        balance,
        description: t.description ?? "",
        completedDate: t.completedDate?.seconds
          ? new Date(t.completedDate.seconds * 1000).toLocaleDateString("en-GB")
          : t.status === "completed"
          ? "—"
          : "",
      };
    })
    .reverse();

  const columns: GridColDef[] = [
    { field: "date", headerName: "Date", flex: 1, minWidth: 110 },
    { field: "person", headerName: "Person", flex: 1, minWidth: 100 },
   {
  field: "type",
  headerName: "Type",
  flex: 1,
  minWidth: 90,
  renderCell: (params) => {
    if (params.value === "settlement") {
      return (
        <Chip
          label="Settlement"
          size="small"
          color="success"
          variant="outlined"
          sx={{ fontSize: 11, fontWeight: 600 }}
        />
      );
    }
    return (
      <Typography variant="body2" fontWeight={500}>
        {capitalize(params.value)}
      </Typography>
    );
  },
},
    {
      field: "amount",
      headerName: "Amount",
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ fontVariantNumeric: "tabular-nums" }}
        >
          ₹{Number(params.value).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography
            variant="body2"
            color={
              params.value === "completed" ? "success.main" : "text.secondary"
            }
            fontWeight={params.value === "completed" ? 600 : 400}
          >
            {capitalize(params.value)}
          </Typography>
        </Box>
      ),
    },
    {
      field: "completedDate",
      headerName: "Completed On",
      flex: 1,
      minWidth: 130,
      renderCell: (params) =>
        params.value ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <EventAvailableRoundedIcon
              fontSize="small"
              sx={{ color: "success.main", fontSize: 16 }}
            />
            <Typography variant="body2" color="success.main" fontWeight={500}>
              {params.value}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.disabled">
            —
          </Typography>
        ),
    },
    {
      field: "description",
      headerName: "Description",
      flex: 1.5,
      minWidth: 160,
      renderCell: (params) =>
        params.value ? (
          <Tooltip title={params.value} arrow placement="top">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                maxWidth: "100%",
                overflow: "hidden",
              }}
            >
              <InfoOutlinedIcon
                fontSize="small"
                sx={{ color: "text.secondary", fontSize: 15, flexShrink: 0 }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {params.value}
              </Typography>
            </Box>
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.disabled">
            —
          </Typography>
        ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate(`/transactions/edit/${params.row.id}`)}
            sx={{ borderRadius: 1.5, minWidth: 0, px: 1 }}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            variant="outlined"
            onClick={() => handleDelete(params.row.id)}
            sx={{
              borderRadius: 1.5,
              minWidth: 0,
              px: 1,
              "&:hover": {
                backgroundColor: alpha(theme.palette.error.main, 0.08),
              },
            }}
          >
            Delete
          </Button>
        </Stack>
      ),
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1200,
        mx: "auto",
        px: { xs: 2, sm: 3 },
        py: 3,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Transactions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            View and manage all your income, expenses, and borrowed amounts.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => navigate("/transactions/add")}
          sx={{
            borderRadius: 2,
            alignSelf: { xs: "stretch", sm: "center" },
            minWidth: { sm: 180 },
          }}
        >
          Add transaction
        </Button>
      </Stack>

      {rows.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 2,
            border: `1px dashed ${theme.palette.divider}`,
            backgroundColor: alpha(
              theme.palette.text.primary,
              theme.palette.mode === "light" ? 0.02 : 0.04
            ),
          }}
        >
          <ReceiptLongRoundedIcon
            sx={{ fontSize: 56, color: "text.disabled", mb: 1 }}
          />
          <Typography color="text.secondary" variant="body1" gutterBottom>
            No transactions yet
          </Typography>
          <Typography color="text.disabled" variant="body2" sx={{ mb: 2 }}>
            Add your first transaction to start tracking.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => navigate("/transactions/add")}
            sx={{ borderRadius: 2 }}
          >
            Add transaction
          </Button>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            overflow: "hidden",
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <DataGrid
            rows={rows}
            columns={columns}
            slots={{ toolbar: GridToolbar }}
            disableRowSelectionOnClick
            autoHeight
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            pageSizeOptions={[10, 25, 50]}
            sx={{
              minHeight: 400,
              "& .MuiDataGrid-cell": { py: 1.25 },
            }}
          />
        </Paper>
      )}
    </Box>
  );
}