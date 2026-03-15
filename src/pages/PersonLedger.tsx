import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  MenuItem,
  useTheme,
  useMediaQuery,
  alpha,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { getPersons } from "../services/personService";
import {
  getTransactions,
  getTransactionsByPerson,
  addTransaction,
  bulkMarkCompleted,
  deleteTransaction,
} from "../services/transactionService";
import { useAppSelector } from "../hooks/reduxHooks";
import { useNavigate, useParams } from "react-router-dom";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useConfirm } from "../contexts/ConfirmContext";
import { useAlert } from "../contexts/AlertContext";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function PersonLedger() {
  const user = useAppSelector((state) => state.auth.user);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const showAlert = useAlert();

  const [persons, setPersons] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [personTransactions, setPersonTransactions] = useState<any[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleDescription, setSettleDescription] = useState("");
  const [settleDate, setSettleDate] = useState<Dayjs>(dayjs());
  const [settling, setSettling] = useState(false);

  const [showAllHistory, setShowAllHistory] = useState(false);
  const [ledgerMonth, setLedgerMonth] = useState(new Date().getMonth());
  const [ledgerYear, setLedgerYear] = useState(new Date().getFullYear());

  const yearOptions = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - 2 + i
  );

  const loadData = async () => {
    if (!user) return;
    const [t, p] = await Promise.all([
      getTransactions(user.uid),
      getPersons(user.uid),
    ]);
    setTransactions(t);
    setPersons(p);
    if (id) {
      const person = p.find((x: any) => x.id === id);
      setSelectedPerson(person ?? null);
    }
  };

  const loadPersonTransactions = async (personId: string) => {
    if (!user) return;
    const data = showAllHistory
      ? await getTransactionsByPerson(user.uid, personId)
      : await getTransactionsByPerson(user.uid, personId, ledgerYear, ledgerMonth);
    setPersonTransactions(data);
  };

  useEffect(() => { loadData(); }, [user, id]);

  useEffect(() => {
    if (selectedPerson) {
      loadPersonTransactions(selectedPerson.id);
    } else {
      setPersonTransactions([]);
    }
  }, [selectedPerson, showAllHistory, ledgerMonth, ledgerYear]);

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
    if (selectedPerson) loadPersonTransactions(selectedPerson.id);
  };

  const handleSettleUp = async () => {
    if (!user || !selectedPerson) return;
    setSettling(true);
    try {
      const settledAt = settleDate.toDate();
      await addTransaction({
        userId: user.uid,
        personId: selectedPerson.id,
        type: "settlement",
        amount: Math.abs(currentBalance),
        description: settleDescription.trim()
          ? settleDescription.trim()
          : `Settlement for ${selectedPerson.name}`,
        status: "completed",
        date: settledAt,
        completedDate: settledAt,
        createdAt: new Date(),
        isSettlement: true,
      });

      const pendingIds = personTransactions
        .filter((t) => t.status === "pending")
        .map((t) => t.id);

      if (pendingIds.length > 0) await bulkMarkCompleted(pendingIds, settledAt);

      showAlert(
        `Settled ₹${Math.abs(currentBalance).toLocaleString()} with ${selectedPerson.name}`,
        "success"
      );
      setSettleOpen(false);
      setSettleDescription("");
      setSettleDate(dayjs());
      await loadPersonTransactions(selectedPerson.id);
    } catch {
      showAlert("Settlement failed. Please try again.", "error");
    } finally {
      setSettling(false);
    }
  };

  // ── Person balance list ────────────────────────────────────────────
  const personBalances = persons.map((person) => {
    const pt = transactions.filter((t) => t.personId === person.id);
    let bal = 0;
    pt.forEach((t) => {
      if (t.type === "income")     bal += t.amount;
      if (t.type === "advance")    bal += t.amount;
      if (t.type === "expense")    bal -= t.amount;
      if (t.type === "salary")     bal -= t.amount;
      if (t.type === "settlement") bal += t.amount;
    });
    return { id: person.id, name: person.name, balance: bal };
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
        <Button onClick={() => navigate(`/persons/ledger/${params.row.id}`)}>
          View Ledger
        </Button>
      ),
    },
  ];

  // ── Person transaction rows ────────────────────────────────────────
  let balance = 0;
  const personRows = personTransactions.map((t) => {
    if (t.type === "income")     balance += t.amount;
    if (t.type === "advance")    balance += t.amount;
    if (t.type === "expense")    balance -= t.amount;
    if (t.type === "salary")     balance -= t.amount;
    if (t.type === "settlement") balance += t.amount;
    return {
      id: t.id,
      date: t.date?.seconds
        ? new Date(t.date.seconds * 1000).toLocaleDateString("en-GB")
        : "",
      type: t.type,
      amount: t.amount,
      status: t.status,
      balance,
      description: t.description ?? "",
      isSettlement: t.isSettlement ?? false,
    };
  });

  const transactionColumns: GridColDef[] = [
    { field: "date", headerName: "Date", flex: 1 },
    {
      field: "type", headerName: "Type", flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {params.row.isSettlement ? (
            <Chip label="Settlement" size="small" color="success" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
          ) : (
            <Typography variant="body2">
              {params.value.charAt(0).toUpperCase() + params.value.slice(1)}
            </Typography>
          )}
        </Box>
      ),
    },
    { field: "amount", headerName: "Amount", flex: 1, renderCell: (p) => `₹${p.value}` },
    {
      field: "balance", headerName: "Balance", flex: 1,
      renderCell: (p) => (
        <span style={{ color: p.value >= 0 ? "green" : "red" }}>₹{p.value}</span>
      ),
    },
    {
      field: "status", headerName: "Status", flex: 1,
      renderCell: (p) => (
        <Typography variant="body2" color={p.value === "completed" ? "success.main" : "text.secondary"} fontWeight={p.value === "completed" ? 600 : 400}>
          {p.value.charAt(0).toUpperCase() + p.value.slice(1)}
        </Typography>
      ),
    },
    {
      field: "description", headerName: "Description", flex: 1.5,
      renderCell: (p) => p.value ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <InfoOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.value}
          </Typography>
        </Box>
      ) : <Typography variant="body2" color="text.disabled">—</Typography>,
    },
    {
      field: "actions", headerName: "Actions", flex: 1, sortable: false, filterable: false,
      renderCell: (p) => (
        <>
          <Button size="small" onClick={() => navigate(`/transactions/edit/${p.row.id}`)}>Edit</Button>
          <Button size="small" color="error" onClick={() => handleDelete(p.row.id)}>Delete</Button>
        </>
      ),
    },
  ];

  const currentBalance = personRows.length > 0 ? personRows[personRows.length - 1].balance : 0;
  const pendingCount = personTransactions.filter((t) => t.status === "pending").length;

  const typeColor = (type: string): any => {
    if (["income", "advance", "settlement"].includes(type)) return "success";
    if (["expense", "salary"].includes(type)) return "error";
    return "default";
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>

      {/* ══════════════ PERSON BALANCES LIST ══════════════ */}
      {!id && (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight={700}>Person Balances</Typography>
            <Typography variant="body2" color="text.secondary">
              Overview of all your contacts and their current balances
            </Typography>
          </Box>

          {isMobile ? (
            <Stack spacing={1.5}>
              {personBalances.length === 0 && (
                <Typography color="text.secondary" textAlign="center" py={4}>No persons found.</Typography>
              )}
              {personBalances.map((p) => (
                <Card
                  key={p.id}
                  variant="outlined"
                  sx={{ borderRadius: 2, cursor: "pointer" }}
                  onClick={() => navigate(`/persons/ledger/${p.id}`)}
                >
                  <CardContent sx={{ p: "14px 16px !important", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                      <Typography fontWeight={600}>{p.name}</Typography>
                      <Typography variant="body2" fontWeight={700} color={p.balance >= 0 ? "success.main" : "error.main"}>
                        ₹{p.balance.toLocaleString()}
                      </Typography>
                    </Box>
                    <ChevronRightIcon sx={{ color: "text.disabled" }} />
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <DataGrid rows={personBalances} columns={personColumns} autoHeight disableRowSelectionOnClick />
          )}
        </>
      )}

      {/* ══════════════ PERSON LEDGER DETAIL ══════════════ */}
      {id && selectedPerson && (
        <>
          {/* ── Header ── */}
          <Box sx={{ mb: 3, pb: 2.5, borderBottom: "1px solid", borderColor: "divider" }}>

            {/* Back + Name */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/persons/ledger")}
                sx={{ color: "text.secondary", fontWeight: 500, minWidth: "auto", px: 1 }}
              >
                {!isMobile && "Back"}
              </Button>
              <Divider orientation="vertical" flexItem sx={{ height: 28, alignSelf: "center" }} />
              <Box>
                <Typography variant="h5" fontWeight={700} lineHeight={1.2}>{selectedPerson.name}</Typography>
                <Typography variant="body2" color="text.secondary">Transaction Ledger</Typography>
              </Box>
            </Box>

            {/* Balance + Action Buttons */}
            <Box
              sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "center",
                gap: 1.5,
                justifyContent: isMobile ? "stretch" : "flex-end",
              }}
            >
              {personRows.length > 0 && (
                <Box
                  sx={{
                    px: 2, py: 1, borderRadius: 2,
                    border: "1px solid",
                    borderColor: currentBalance >= 0 ? "success.light" : "error.light",
                    backgroundColor: currentBalance >= 0 ? "rgba(46,125,50,0.06)" : "rgba(211,47,47,0.06)",
                    textAlign: "center",
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">Current Balance</Typography>
                  <Typography variant="subtitle1" fontWeight={700} color={currentBalance >= 0 ? "success.main" : "error.main"}>
                    ₹{currentBalance.toLocaleString()}
                  </Typography>
                </Box>
              )}

              {currentBalance !== 0 && (
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<AccountBalanceWalletRoundedIcon />}
                  onClick={() => setSettleOpen(true)}
                  fullWidth={isMobile}
                  sx={{ borderRadius: 2, fontWeight: 600, borderColor: "success.main", color: "success.main" }}
                >
                  Settle Up
                </Button>
              )}

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate(`/transactions/add?personId=${selectedPerson.id}`)}
                fullWidth={isMobile}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                Add Transaction
              </Button>
            </Box>
          </Box>

          {/* ── Month filter row ── */}
          <Box
            sx={{
              mb: 2,
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "center",
              gap: 1.5,
            }}
          >
            {/* Chips */}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip
                label={`${personRows.length} transaction${personRows.length !== 1 ? "s" : ""}`}
                size="small" variant="outlined" sx={{ fontWeight: 500 }}
              />
              {pendingCount > 0 && (
                <Chip label={`${pendingCount} pending`} size="small" color="warning" variant="outlined" sx={{ fontWeight: 500 }} />
              )}
            </Box>

            {/* Filter controls */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                ml: isMobile ? 0 : "auto",
              }}
            >
              <Button
                size="small"
                variant={showAllHistory ? "contained" : "outlined"}
                onClick={() => setShowAllHistory((v) => !v)}
                sx={{ borderRadius: 2, fontWeight: 600, flex: isMobile ? 1 : "unset" }}
              >
                {showAllHistory ? "All History" : "This Month"}
              </Button>

              {!showAllHistory && (
                <>
                  <TextField
                    select size="small" value={ledgerMonth}
                    onChange={(e) => setLedgerMonth(Number(e.target.value))}
                    sx={{ flex: 1, minWidth: isMobile ? 0 : 120, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    SelectProps={{ MenuProps: { sx: { zIndex: 9999 } } }}
                  >
                    {monthNames.map((m, i) => <MenuItem key={i} value={i}>{m}</MenuItem>)}
                  </TextField>

                  <TextField
                    select size="small" value={ledgerYear}
                    onChange={(e) => setLedgerYear(Number(e.target.value))}
                    sx={{ flex: isMobile ? 1 : "unset", minWidth: isMobile ? 0 : 90, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    SelectProps={{ MenuProps: { sx: { zIndex: 9999 } } }}
                  >
                    {yearOptions.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                  </TextField>
                </>
              )}
            </Box>
          </Box>

          {/* ── Transaction list ── */}
          {isMobile ? (
            <Stack spacing={1.5}>
              {personRows.length === 0 && (
                <Typography color="text.secondary" textAlign="center" py={4}>No transactions found.</Typography>
              )}
              {personRows.map((row) => (
                <Card key={row.id} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: "12px 16px !important" }}>

                    {/* Row 1: date + type chip + icon actions */}
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">{row.date}</Typography>
                        {row.isSettlement ? (
                          <Chip label="Settlement" size="small" color="success" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                        ) : (
                          <Chip
                            label={row.type.charAt(0).toUpperCase() + row.type.slice(1)}
                            size="small"
                            color={typeColor(row.type)}
                            variant="outlined"
                            sx={{ fontSize: 10, height: 18 }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: "flex" }}>
                        <IconButton size="small" onClick={() => navigate(`/transactions/edit/${row.id}`)}>
                          <EditOutlinedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Row 2: amount + running balance */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        ₹{row.amount.toLocaleString()}
                      </Typography>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="caption" color="text.secondary" display="block">Balance</Typography>
                        <Typography variant="body2" fontWeight={700} color={row.balance >= 0 ? "success.main" : "error.main"}>
                          ₹{row.balance.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Row 3: description */}
                    {row.description && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                        <InfoOutlinedIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary" noWrap>{row.description}</Typography>
                      </Box>
                    )}

                    {/* Row 4: status */}
                    <Chip
                      label={row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                      size="small"
                      color={row.status === "completed" ? "success" : "default"}
                      sx={{ fontSize: 10, height: 18 }}
                    />
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <DataGrid rows={personRows} columns={transactionColumns} autoHeight disableRowSelectionOnClick />
          )}
        </>
      )}

      {/* ══════════════ SETTLE UP DIALOG ══════════════ */}
      <Dialog
        open={settleOpen}
        onClose={() => !settling && setSettleOpen(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: "1.25rem" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleOutlineRoundedIcon color="success" />
            Settle Up with {selectedPerson?.name}
          </Box>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Box
              sx={{
                p: 2, borderRadius: 2,
                backgroundColor: alpha(theme.palette.success.main, 0.06),
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>Settlement Amount</Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                ₹{Math.abs(currentBalance).toLocaleString()}
              </Typography>
              {pendingCount > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  {pendingCount} pending transaction{pendingCount !== 1 ? "s" : ""} will be marked as completed
                </Typography>
              )}
            </Box>

            <DatePicker
              label="Settlement Date"
              value={settleDate}
              format="DD/MM/YYYY"
              onChange={(val) => setSettleDate(val ?? dayjs())}
              slotProps={{
                textField: {
                  size: "small", fullWidth: true,
                  helperText: "Date the payment was made",
                  sx: { "& .MuiOutlinedInput-root": { borderRadius: 2 } },
                },
              }}
            />

            <TextField
              label="Note (optional)"
              placeholder="e.g. Paid via UPI, Cash payment…"
              size="small" fullWidth multiline minRows={2}
              value={settleDescription}
              onChange={(e) => setSettleDescription(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: isMobile ? 4 : 3,
            gap: 1,
            flexDirection: isMobile ? "column-reverse" : "row",
          }}
        >
          <Button
            variant="outlined" color="inherit"
            onClick={() => setSettleOpen(false)}
            disabled={settling}
            fullWidth={isMobile}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained" color="success"
            onClick={handleSettleUp}
            disabled={settling}
            fullWidth={isMobile}
            startIcon={settling ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineRoundedIcon />}
            sx={{ borderRadius: 2, minWidth: 130 }}
          >
            {settling ? "Settling…" : "Confirm Settle"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}