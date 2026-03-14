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
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  getTransactionsByMonth,
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
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";

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

  // ── Month filter state ─────────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  const monthLabel = new Date(
    selectedMonth.year,
    selectedMonth.month
  ).toLocaleString("default", { month: "long", year: "numeric" });

  const isCurrentMonth =
    selectedMonth.month === new Date().getMonth() &&
    selectedMonth.year === new Date().getFullYear();

  const prevMonth = () => {
    setSelectedMonth((m) => {
      if (m.month === 0) return { month: 11, year: m.year - 1 };
      return { month: m.month - 1, year: m.year };
    });
  };

  const nextMonth = () => {
    setSelectedMonth((m) => {
      if (m.month === 11) return { month: 0, year: m.year + 1 };
      return { month: m.month + 1, year: m.year };
    });
  };

  // ── Fetch only selected month from Firestore ───────────────────────
  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [personsData, transactionData] = await Promise.all([
        getPersons(user.uid),
        getTransactionsByMonth(user.uid, selectedMonth.year, selectedMonth.month),
      ]);
      setPersons(personsData);
      setTransactions(transactionData);
    } finally {
      setLoading(false);
    }
  };

  // ── Reload whenever user or selected month changes ─────────────────
  useEffect(() => {
    loadData();
  }, [user, selectedMonth.month, selectedMonth.year]);

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

  // ── Firestore already returns this month only, just sort ───────────
  const sortedTransactions = [...transactions].sort((a, b) => {
    const aDate = a.date?.seconds
      ? new Date(a.date.seconds * 1000)
      : new Date(a.date);
    const bDate = b.date?.seconds
      ? new Date(b.date.seconds * 1000)
      : new Date(b.date);
    return bDate.getTime() - aDate.getTime();
  });

  // ── Running balance (oldest → newest, then reverse for display) ────
  const reversed = [...sortedTransactions].reverse();
  let balance = 0;
  const rows = reversed
    .map((t) => {
      if (t.type === "income")     balance += t.amount;
      if (t.type === "expense")    balance -= t.amount;
      if (t.type === "salary")     balance -= t.amount;
      if (t.type === "advance")    balance += t.amount;
      if (t.type === "settlement") balance += t.amount;
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

  // ── Month summary ──────────────────────────────────────────────────
  const monthSummary = sortedTransactions.reduce(
    (acc, t) => {
      if (t.type === "income")  acc.income  += t.amount;
      if (t.type === "expense") acc.expense += t.amount;
      if (t.type === "salary")  acc.salary  += t.amount;
      if (t.type === "advance") acc.advance += t.amount;
      return acc;
    },
    { income: 0, expense: 0, salary: 0, advance: 0 }
  );

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
      field: "balance",
      headerName: "Balance",
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <Typography
          variant="body2"
          fontWeight={600}
          color={params.value >= 0 ? "success.main" : "error.main"}
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
        <Typography
          variant="body2"
          color={
            params.value === "completed" ? "success.main" : "text.secondary"
          }
          fontWeight={params.value === "completed" ? 600 : 400}
        >
          {capitalize(params.value)}
        </Typography>
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
      {/* ── Header ── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Transactions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            View and manage all your income, expenses, salary and advanced amounts.
          </Typography>
        </Box>

        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
          {/* Month navigator */}
          <Paper
            elevation={0}
            sx={{
              display: "flex",
              alignItems: "center",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <IconButton size="small" onClick={prevMonth} sx={{ borderRadius: 0, px: 1 }}>
              <ChevronLeftRoundedIcon />
            </IconButton>

            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ px: 1.5, minWidth: 170, justifyContent: "center" }}
            >
              <CalendarTodayRoundedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="body2" fontWeight={600}>
                {monthLabel}
              </Typography>
            </Stack>

            <IconButton size="small" onClick={nextMonth} sx={{ borderRadius: 0, px: 1 }}>
              <ChevronRightRoundedIcon />
            </IconButton>
          </Paper>

          {!isCurrentMonth && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                const now = new Date();
                setSelectedMonth({ month: now.getMonth(), year: now.getFullYear() });
              }}
              sx={{ borderRadius: 2, whiteSpace: "nowrap" }}
            >
              This Month
            </Button>
          )}

          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => navigate("/transactions/add")}
            sx={{ borderRadius: 2, minWidth: { sm: 160 } }}
          >
            Add transaction
          </Button>
        </Stack>
      </Stack>

      {/* ── Month summary chips ── */}
      {sortedTransactions.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2.5, gap: 1 }}>
          {monthSummary.income > 0 && (
            <Chip
              label={`Income ₹${monthSummary.income.toLocaleString()}`}
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
          {monthSummary.expense > 0 && (
            <Chip
              label={`Expense ₹${monthSummary.expense.toLocaleString()}`}
              size="small"
              color="error"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
          {monthSummary.salary > 0 && (
            <Chip
              label={`Salary ₹${monthSummary.salary.toLocaleString()}`}
              size="small"
              color="error"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
          {monthSummary.advance > 0 && (
            <Chip
              label={`Advance ₹${monthSummary.advance.toLocaleString()}`}
              size="small"
              color="info"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
          <Chip
            label={`${sortedTransactions.length} transactions`}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
        </Stack>
      )}

      {/* ── Empty state ── */}
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
          <ReceiptLongRoundedIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary" variant="body1" gutterBottom>
            No transactions in {monthLabel}
          </Typography>
          <Typography color="text.disabled" variant="body2" sx={{ mb: 2 }}>
            Use the arrows to navigate months or add a new transaction.
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