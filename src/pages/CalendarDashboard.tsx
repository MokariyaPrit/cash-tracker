import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import {
  Button,
  Box,
  Typography,
  Paper,
  useTheme,
  alpha,
  Stack,
  Grid,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import {
  getTransactions,
  deleteTransaction,
} from "../services/transactionService";

import { getPersons } from "../services/personService";
import { useAppSelector } from "../hooks/reduxHooks";
import { useConfirm } from "../contexts/ConfirmContext";

import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

export default function CalendarDashboard() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const theme = useTheme();

  const user = useAppSelector((state) => state.auth.user);

  const [date, setDate] = useState(new Date());
  const [transactions, setTransactions] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [t, p] = await Promise.all([
        getTransactions(user.uid),
        getPersons(user.uid),
      ]);
      setTransactions(t);
      setPersons(p);
    } finally {
      setLoading(false);
    }
  };

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

  const selectedTransactions = transactions.filter((t) => {
    const tDate = t.date?.seconds
      ? new Date(t.date.seconds * 1000)
      : new Date(t.date);
    return tDate.toDateString() === date.toDateString();
  });

  const tileContent = ({ date: tileDate }: { date: Date }) => {
    const dailyTransactions = transactions.filter((t) => {
      const tDate = t.date?.seconds
        ? new Date(t.date.seconds * 1000)
        : new Date(t.date);
      return tDate.toDateString() === tileDate.toDateString();
    });

    if (!dailyTransactions.length) return null;

    let total = 0;
    dailyTransactions.forEach((t) => {
      if (t.type === "income" || t.type === "borrow") total += t.amount;
      if (t.type === "expense" || t.type === "lent") total -= t.amount;
    });

    const isPositive = total >= 0;
    return (
      <Typography
        variant="caption"
        component="span"
        sx={{
          display: "block",
          fontWeight: 600,
          color: isPositive ? "success.main" : "error.main",
          lineHeight: 1.2,
        }}
      >
        {isPositive ? "" : ""}₹{Math.abs(total).toLocaleString()}
      </Typography>
    );
  };

  const monthTransactions = transactions.filter((t) => {
    const tDate = t.date?.seconds
      ? new Date(t.date.seconds * 1000)
      : new Date(t.date);
    return (
      tDate.getMonth() === date.getMonth() &&
      tDate.getFullYear() === date.getFullYear()
    );
  });

  const summary = monthTransactions.reduce(
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
    },
  );

  const balance =
    summary.income + summary.borrow - summary.expense - summary.lent;

  const summaryCards = [
    {
      label: "Income",
      value: summary.income,
      color: "success.main" as const,
      icon: <TrendingUpRoundedIcon fontSize="small" />,
    },
    {
      label: "Expense",
      value: summary.expense,
      color: "error.main" as const,
      icon: <TrendingDownRoundedIcon fontSize="small" />,
    },
    {
      label: "Borrow",
      value: summary.borrow,
      color: "info.main" as const,
      icon: <SwapHorizRoundedIcon fontSize="small" />,
    },
    {
      label: "Lent",
      value: summary.lent,
      color: "warning.main" as const,
      icon: <SwapHorizRoundedIcon fontSize="small" />,
    },
    {
      label: "Pending",
      value: summary.pending,
      color: "text.secondary" as const,
      icon: <ScheduleRoundedIcon fontSize="small" />,
    },
    {
      label: "Balance",
      value: balance,
      color: balance >= 0 ? "primary.main" : "error.main",
      icon: <AccountBalanceRoundedIcon fontSize="small" />,
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const calendarSx = {
    "& .react-calendar": {
      width: "100%",
      border: "none",
      fontFamily: theme.typography.fontFamily,
    },
    "& .react-calendar__tile": {
      padding: "8px 4px",
      fontSize: theme.typography.body2.fontSize,
    },
    "& .react-calendar__tile--now": {
      background: alpha(theme.palette.primary.main, 0.15),
      fontWeight: 600,
    },
    "& .react-calendar__tile--active": {
      background: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
    },
    "& .react-calendar__month-view__days__day--neighboringMonth": {
      color: theme.palette.text.disabled,
    },
    "& .react-calendar__navigation button": {
      fontSize: theme.typography.body1.fontSize,
      color: theme.palette.text.primary,
    },
    "& .react-calendar__month-view__weekdays__weekday": {
      color: theme.palette.text.secondary,
      fontWeight: 600,
    },
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1100,
        mx: "auto",
        px: { xs: 2, sm: 3 },
        py: 3,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
        <CalendarMonthRoundedIcon
          sx={{ fontSize: 32, color: "primary.main" }}
        />
        <Typography variant="h4" fontWeight={700} color="text.primary">
          DashBoard
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        View monthly summary and transactions by day.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid size={{ xs: 6, sm: 4, md: 2 }} key={card.label}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
                height: "100%",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 0.5 }}
              >
                <Box sx={{ color: card.color, display: "flex" }}>
                  {card.icon}
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  {card.label}
                </Typography>
              </Stack>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  color: card.color,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                ₹{Number(card.value).toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              ...calendarSx,
            }}
          >
            <Calendar
              value={date}
              onChange={(value) => setDate(value as Date)}
              onActiveStartDateChange={({ activeStartDate }) => {
                if (activeStartDate) setDate(activeStartDate);
              }}
              tileContent={tileContent}
            />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            color="text.primary"
            sx={{ mb: 1.5 }}
          >
            {date.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Typography>

          {selectedTransactions.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                textAlign: "center",
                borderRadius: 2,
                border: `1px dashed ${theme.palette.divider}`,
                backgroundColor: alpha(
                  theme.palette.text.primary,
                  theme.palette.mode === "light" ? 0.02 : 0.04,
                ),
              }}
            >
              <Typography color="text.secondary" variant="body2">
                No transactions on this day.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {selectedTransactions.map((t) => (
                <Paper
                  key={t.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      borderColor: alpha(theme.palette.primary.main, 0.4),
                      boxShadow: theme.shadows[2],
                    },
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {personMap[t.personId] || "-"}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        flexWrap="wrap"
                        sx={{ mt: 0.5 }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {capitalize(t.type)}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={
                            t.type === "income" || t.type === "borrow"
                              ? "success.main"
                              : "error.main"
                          }
                          sx={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          ₹{Number(t.amount).toLocaleString()}
                        </Typography>
                        <Typography
                          variant="caption"
                          color={
                            t.status === "completed"
                              ? "success.main"
                              : "text.secondary"
                          }
                        >
                          {capitalize(t.status)}
                        </Typography>
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditRoundedIcon fontSize="small" />}
                        onClick={() => navigate(`/transactions/edit/${t.id}`)}
                        sx={{ borderRadius: 1.5 }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        }
                        onClick={() => handleDelete(t.id)}
                        sx={{
                          borderRadius: 1.5,
                          "&:hover": {
                            backgroundColor: alpha(
                              theme.palette.error.main,
                              0.08,
                            ),
                          },
                        }}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
