import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
  alpha,
  Stack,
  CircularProgress,
  Tooltip,
  Chip,
  IconButton,
  Card,
  CardContent,
  Divider,
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
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

const TYPE_CONFIG: Record<string, { color: string; bgKey: string; icon: any }> = {
  income:     { color: "success", bgKey: "success", icon: TrendingUpRoundedIcon },
  expense:    { color: "error",   bgKey: "error",   icon: TrendingDownRoundedIcon },
  salary:     { color: "error",   bgKey: "error",   icon: TrendingDownRoundedIcon },
  advance:    { color: "info",    bgKey: "info",     icon: AccountBalanceWalletRoundedIcon },
  settlement: { color: "success", bgKey: "success", icon: SwapHorizRoundedIcon },
};

export default function Transactions() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  // const isMd = useMediaQuery(theme.breakpoints.down("md"));
  const user = useAppSelector((state) => state.auth.user);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  const monthLabel = new Date(selectedMonth.year, selectedMonth.month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const isCurrentMonth =
    selectedMonth.month === new Date().getMonth() &&
    selectedMonth.year === new Date().getFullYear();

  const prevMonth = () =>
    setSelectedMonth((m) =>
      m.month === 0 ? { month: 11, year: m.year - 1 } : { month: m.month - 1, year: m.year }
    );

  const nextMonth = () =>
    setSelectedMonth((m) =>
      m.month === 11 ? { month: 0, year: m.year + 1 } : { month: m.month + 1, year: m.year }
    );

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

  useEffect(() => { loadData(); }, [user, selectedMonth.month, selectedMonth.year]);

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
    const aDate = a.date?.seconds ? new Date(a.date.seconds * 1000) : new Date(a.date);
    const bDate = b.date?.seconds ? new Date(b.date.seconds * 1000) : new Date(b.date);
    return bDate.getTime() - aDate.getTime();
  });

  const reversed = [...sortedTransactions].reverse();
  const rows = reversed
    .map((t) => {
      return {
        id: t.id,
        date: t.date?.seconds
          ? new Date(t.date.seconds * 1000).toLocaleDateString("en-GB")
          : "-",
        person: personMap[t.personId] || "-",
        type: t.type,
        amount: t.amount,
        status: t.status,
        description: t.description ?? "",
        completedDate: t.completedDate?.seconds
          ? new Date(t.completedDate.seconds * 1000).toLocaleDateString("en-GB")
          : t.status === "completed" ? "—" : "",
      };
    })
    .reverse();

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
      minWidth: 110,
      renderCell: (params) => {
        const cfg = TYPE_CONFIG[params.value] ?? { color: "default" };
        return (
          <Chip
            label={capitalize(params.value)}
            size="small"
            color={cfg.color as any}
            variant="outlined"
            sx={{ fontSize: 11, fontWeight: 600, height: 22 }}
          />
        );
      },
    },
    {
      field: "amount",
      headerName: "Amount",
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: "tabular-nums" }}>
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
        <Chip
          label={capitalize(params.value)}
          size="small"
          variant="filled"
          color={params.value === "completed" ? "success" : "default"}
          sx={{ fontSize: 11, fontWeight: 600, height: 22 }}
        />
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
            <EventAvailableRoundedIcon sx={{ color: "success.main", fontSize: 15 }} />
            <Typography variant="body2" color="success.main" fontWeight={500}>
              {params.value}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.disabled">—</Typography>
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, maxWidth: "100%", overflow: "hidden" }}>
              <InfoOutlinedIcon sx={{ color: "text.secondary", fontSize: 15, flexShrink: 0 }} />
              <Typography variant="body2" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {params.value}
              </Typography>
            </Box>
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.disabled">—</Typography>
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
          <IconButton size="small" onClick={() => navigate(`/transactions/edit/${params.row.id}`)} sx={{ color: "primary.main" }}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(params.row.id)} sx={{ color: "error.main" }}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  // ── Summary card component ─────────────────────────────────────────
  const SummaryCard = ({
    label, amount, colorKey, icon: Icon,
  }: {
    label: string; amount: number; colorKey: string; icon: any;
  }) => {
    const c = theme.palette[colorKey as keyof typeof theme.palette] as any;
    return (
      <Box
        sx={{
          flex: 1,
          minWidth: { xs: "calc(50% - 6px)", sm: 120 },
          p: { xs: 1.5, sm: 2 },
          borderRadius: 2.5,
          border: "1px solid",
          borderColor: alpha(c.main, 0.2),
          backgroundColor: alpha(c.main, 0.05),
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Icon sx={{ fontSize: 15, color: c.main }} />
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: 10 }}>
            {label}
          </Typography>
        </Box>
        <Typography variant="subtitle2" fontWeight={800} color={c.main} sx={{ fontVariantNumeric: "tabular-nums" }}>
          ₹{amount.toLocaleString()}
        </Typography>
      </Box>
    );
  };

  // ── Mobile transaction card ────────────────────────────────────────
  const MobileTransactionCard = ({ row }: { row: any }) => {
    const cfg = TYPE_CONFIG[row.type] ?? { color: "default", icon: ReceiptLongRoundedIcon };
    const c = theme.palette[cfg.color as keyof typeof theme.palette] as any;
    const isDebit = row.type === "expense" || row.type === "salary";

    return (
      <Card
        variant="outlined"
        sx={{
          borderRadius: 2.5,
          borderLeft: "3px solid",
          borderLeftColor: c?.main ?? "divider",
          transition: "box-shadow 0.2s",
          "&:hover": { boxShadow: theme.shadows[3] },
        }}
      >
        <CardContent sx={{ p: "12px 14px !important" }}>
          {/* Row 1: Person + Amount */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.75 }}>
            <Box>
              <Typography fontWeight={700} variant="body2" lineHeight={1.3}>
                {row.person}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {row.date}
              </Typography>
            </Box>
            <Typography
              fontWeight={800}
              variant="body1"
              color={isDebit ? "error.main" : "success.main"}
              sx={{ fontVariantNumeric: "tabular-nums" }}
            >
              {isDebit ? "−" : "+"}₹{Number(row.amount).toLocaleString()}
            </Typography>
          </Box>

          <Divider sx={{ my: 0.75 }} />

          {/* Row 2: Type + Status  */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
            <Chip
              label={capitalize(row.type)}
              size="small"
              color={cfg.color as any}
              variant="outlined"
              sx={{ fontSize: 10, height: 20, fontWeight: 600 }}
            />
            <Chip
              label={capitalize(row.status)}
              size="small"
              color={row.status === "completed" ? "success" : "default"}
              variant="filled"
              sx={{ fontSize: 10, height: 20, fontWeight: 600 }}
            />
          </Box>

          {/* Row 3: Description (if any) */}
          {row.description && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.75 }}>
              <InfoOutlinedIcon sx={{ fontSize: 12, color: "text.disabled", flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {row.description}
              </Typography>
            </Box>
          )}

          {/* Row 4: Completed date + Actions */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.75 }}>
            {row.completedDate ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <EventAvailableRoundedIcon sx={{ fontSize: 12, color: "success.main" }} />
                <Typography variant="caption" color="success.main" fontWeight={500}>
                  {row.completedDate}
                </Typography>
              </Box>
            ) : (
              <Box />
            )}
            <Box sx={{ display: "flex", gap: 0.25 }}>
              <IconButton size="small" onClick={() => navigate(`/transactions/edit/${row.id}`)} sx={{ color: "primary.main", p: 0.5 }}>
                <EditOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton size="small" onClick={() => handleDelete(row.id)} sx={{ color: "error.main", p: 0.5 }}>
                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>

      {/* ── Header ── */}
<Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
  
  {/* Title */}
  <Box>
    <Typography variant="h5" fontWeight={800} color="text.primary" letterSpacing="-0.5px">
      Transactions
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
      Manage your income, expenses, salary & advances
    </Typography>
  </Box>

  {/* Row 1 (mobile): Month navigator only */}
  {/* Row 1+2 (desktop): month + buttons side by side */}
  <Stack
    direction={{ xs: "column", sm: "row" }}
    alignItems={{ xs: "stretch", sm: "center" }}
    justifyContent="space-between"
    spacing={1}
  >
    {/* Month navigator row */}
    <Stack direction="row" alignItems="center" spacing={1}>
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          alignItems: "center",
          border: `1.5px solid ${theme.palette.divider}`,
          borderRadius: 2.5,
          overflow: "hidden",
          flex: { xs: 1, sm: "none" },
        }}
      >
        <IconButton size="small" onClick={prevMonth} sx={{ borderRadius: 0, px: 0.75 }}>
          <ChevronLeftRoundedIcon fontSize="small" />
        </IconButton>
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{ px: 1.5, flex: 1, justifyContent: "center", minWidth: { sm: 155 } }}
        >
          <CalendarTodayRoundedIcon sx={{ fontSize: 13, color: "text.secondary", flexShrink: 0 }} />
          <Typography variant="body2" fontWeight={700} noWrap>
            {monthLabel}
          </Typography>
        </Stack>
        <IconButton size="small" onClick={nextMonth} sx={{ borderRadius: 0, px: 0.75 }}>
          <ChevronRightRoundedIcon fontSize="small" />
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
          sx={{ borderRadius: 2, whiteSpace: "nowrap", height: 36 }}
        >
          Today
        </Button>
      )}
    </Stack>

    {/* Add button — full width on mobile, normal on desktop */}
    <Button
      variant="contained"
      startIcon={<AddRoundedIcon />}
      onClick={() => navigate("/transactions/add")}
      sx={{
        borderRadius: 2,
        fontWeight: 700,
        height: 40,
        width: { xs: "100%", sm: "auto" },
      }}
    >
      Add Transaction
    </Button>
  </Stack>
</Stack>
      {/* ── Summary cards ── */}
      {sortedTransactions.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            mb: 2.5,
          }}
        >
          {monthSummary.income > 0 && (
            <SummaryCard label="Income" amount={monthSummary.income} colorKey="success" icon={TrendingUpRoundedIcon} />
          )}
          {monthSummary.expense > 0 && (
            <SummaryCard label="Expense" amount={monthSummary.expense} colorKey="error" icon={TrendingDownRoundedIcon} />
          )}
          {monthSummary.salary > 0 && (
            <SummaryCard label="Salary" amount={monthSummary.salary} colorKey="error" icon={TrendingDownRoundedIcon} />
          )}
          {monthSummary.advance > 0 && (
            <SummaryCard label="Advance" amount={monthSummary.advance} colorKey="info" icon={AccountBalanceWalletRoundedIcon} />
          )}
          {/* Net flow */}
          <Box
            sx={{
  flex: 1,
  minWidth: { xs: "calc(50% - 6px)", sm: 120 },
  p: { xs: 1.5, sm: 2 },
  borderRadius: 2.5,
  border: "1px solid",
  borderColor: "rgba(16, 185, 129, 0.2)",
  backgroundColor: "rgba(16, 185, 129, 0.05)",
  display: "flex",
  flexDirection: "column",
  gap: 0.5,
}}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: 10 }}>
              Transaction{sortedTransactions.length !== 1 ? "s" : ""}
            </Typography>
            <Typography
              variant="subtitle2"
              fontWeight={800}
              color={"success.main"}
              sx={{ fontVariantNumeric: "tabular-nums" }}
            >
              {sortedTransactions.length}
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── Empty state ── */}
      {rows.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            textAlign: "center",
            borderRadius: 3,
            border: `1.5px dashed ${theme.palette.divider}`,
            backgroundColor: alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.02 : 0.04),
          }}
        >
          <ReceiptLongRoundedIcon sx={{ fontSize: 52, color: "text.disabled", mb: 1.5 }} />
          <Typography color="text.secondary" variant="body1" fontWeight={600} gutterBottom>
            No transactions in {monthLabel}
          </Typography>
          <Typography color="text.disabled" variant="body2" sx={{ mb: 2.5, maxWidth: 280, mx: "auto" }}>
            Use the arrows to navigate months or add a new transaction.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => navigate("/transactions/add")}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Add transaction
          </Button>
        </Paper>
      ) : isMobile ? (
        /* ── Mobile: Card list ── */
        <Stack spacing={1.25}>
          {rows.map((row) => (
            <MobileTransactionCard key={row.id} row={row} />
          ))}
        </Stack>
      ) : (
        /* ── Desktop: DataGrid ── */
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2.5,
            border: `1.5px solid ${theme.palette.divider}`,
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
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10, 25, 50]}
            sx={{
              border: "none",
              "& .MuiDataGrid-cell": { py: 1.25 },
            }}
          />
        </Paper>
      )}
    </Box>
  );
}