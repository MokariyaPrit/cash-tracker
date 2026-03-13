import { useEffect, useState } from "react";
import {
  TextField,
  MenuItem,
  Button,
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
  Paper,
  Stack,
  useTheme,
  alpha,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

import {
  addTransaction,
  updateTransaction,
} from "../services/transactionService";

import { getPersons } from "../services/personService";
import { useAppSelector } from "../hooks/reduxHooks";

import { useNavigate, useParams } from "react-router-dom";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

const typeOptions = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "lent", label: "Lent" },
  { value: "borrow", label: "Borrow" },
];

export default function AddTransaction() {
  const navigate = useNavigate();
  const { id } = useParams();
  const theme = useTheme();
  const user = useAppSelector((state) => state.auth.user);

  const [persons, setPersons] = useState<any[]>([]);
  const [personId, setPersonId] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [date, setDate] = useState(dayjs());
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    loadPersons();

    if (id) {
      loadTransaction();
    } else {
      setLoading(false);
    }
  }, [user, id]);

  if (!user) return null;

  const loadPersons = async () => {
    const data = await getPersons(user.uid);
    setPersons(data);
  };

  const loadTransaction = async () => {
    if (!id) return;
    const ref = doc(db, "transactions", id);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data: any = snap.data();
      setPersonId(data.personId ?? "");
      setAmount(String(data.amount ?? ""));
      setType(data.type ?? "expense");
      setCompleted(data.status === "completed");
      if (data.date?.seconds) {
        setDate(dayjs(new Date(data.date.seconds * 1000)));
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !personId || !amount.trim()) return;

    setSaving(true);
    try {
      const payload = {
        userId: user.uid,
        personId,
        amount: Number(amount),
        type,
        status: completed ? "completed" : "pending",
        date: date.toDate(),
      };

      if (id) {
        await updateTransaction(id, payload);
      } else {
        await addTransaction({
          ...payload,
          createdAt: new Date(),
        });
      }
      navigate("/transactions");
    } finally {
      setSaving(false);
    }
  };

  const canSave = personId && amount.trim() && !isNaN(Number(amount));

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      backgroundColor: theme.palette.background.paper,
    },
  };

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
        maxWidth: 560,
        mx: "auto",
        px: { xs: 2, sm: 3 },
        py: 3,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
        {id ? (
          <EditRoundedIcon sx={{ fontSize: 32, color: "primary.main" }} />
        ) : (
          <ReceiptLongRoundedIcon sx={{ fontSize: 32, color: "primary.main" }} />
        )}
        <Typography variant="h4" fontWeight={700} color="text.primary">
          {id ? "Edit transaction" : "Add transaction"}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {id
          ? "Update the transaction details below."
          : "Record income, expense, or money lent/borrowed."}
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(
            theme.palette.primary.main,
            theme.palette.mode === "light" ? 0.02 : 0.08
          ),
        }}
      >
        <Stack spacing={2.5}>
          <TextField
            select
            label="Person"
            fullWidth
            size="small"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            sx={inputSx}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">
              <em>Select person</em>
            </MenuItem>
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
            size="small"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
            sx={{
              ...inputSx,
              "& .MuiOutlinedInput-input": {
                fontVariantNumeric: "tabular-nums",
              },
            }}
            InputProps={{
              startAdornment: (
                <Typography
                  component="span"
                  sx={{ mr: 1, color: "text.secondary", fontWeight: 600 }}
                >
                  ₹
                </Typography>
              ),
            }}
          />

          <TextField
            select
            label="Type"
            fullWidth
            size="small"
            value={type}
            onChange={(e) => setType(e.target.value)}
            sx={inputSx}
          >
            {typeOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          <DatePicker
            label="Date"
            value={date}
            onChange={(newValue) => setDate(newValue ?? dayjs())}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                sx: {
                  ...inputSx,
                  "& .MuiOutlinedInput-root": {
                    ...inputSx["& .MuiOutlinedInput-root"],
                    backgroundColor: theme.palette.background.paper,
                  },
                },
              },
            }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                size="small"
                sx={{
                  "&.Mui-checked": {
                    color: theme.palette.primary.main,
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                Mark as completed
              </Typography>
            }
          />

          <Stack
            direction="row"
            spacing={2}
            sx={{ pt: 1 }}
            justifyContent="flex-end"
          >
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => navigate(-1)}
              disabled={saving}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!canSave || saving}
              startIcon={
                saving ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <SaveRoundedIcon />
                )
              }
              sx={{ borderRadius: 2, minWidth: 120 }}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
