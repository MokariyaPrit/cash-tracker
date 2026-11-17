import { useEffect, useState } from "react";
import {
  Box,
  Autocomplete,
  createFilterOptions,
  TextField,
  MenuItem,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Paper,
  Stack,
  useTheme,
  alpha,
  CircularProgress,
  Collapse,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";

import {
  addTransaction,
  updateTransaction,
} from "../services/transactionService";

import { addPerson, getPersons } from "../services/personService";
import { useAppSelector } from "../hooks/reduxHooks";

import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import { useAlert } from "../contexts/AlertContext";

const typeOptions = [
  { value: "expense", label: "Expense" },
  // { value: "salary", label: "Salary" },
  { value: "income", label: "Income" },
  { value: "advance", label: "Advance" },
];

const modeOptions = [
  { value: "cashed", label: "Cashed" },
  { value: "regular", label: "Regular" },
];

type PersonOption = {
  id?: string;
  name: string;
  inputValue?: string;
};

const filter = createFilterOptions<PersonOption>();

export default function AddTransaction() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const showAlert = useAlert();
  const user = useAppSelector((state) => state.auth.user);

  const [persons, setPersons] = useState<PersonOption[]>([]);
  const [mode, setMode] = useState<"regular" | "cashed">("cashed");
  const [selectedPerson, setSelectedPerson] = useState<PersonOption | null>(null);
  const [personInput, setPersonInput] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("income");
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [description, setDescription] = useState("");
  const [completed, setCompleted] = useState(false);
  const [completedDate, setCompletedDate] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const data = (await getPersons(user.uid)) as PersonOption[];
      setPersons(data);

      const presetId = searchParams.get("personId");
      if (presetId && !id) {
        const match = data.find((p) => p.id === presetId);
        if (match) {
          setSelectedPerson(match);
          setPersonInput(match.name);
        }
      }

      if (id) {
        const ref = doc(db, "transactions", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const tx: any = snap.data();
          setMode(tx.mode === "cashed" ? "cashed" : "regular");
          const match = data.find((p) => p.id === tx.personId);
          if (match) {
            setSelectedPerson(match);
            setPersonInput(match.name);
          }
          setAmount(String(tx.amount ?? ""));
          setType(tx.type ?? "income");
          setDescription(tx.description ?? "");
          setCompleted(tx.status === "completed");
          if (tx.date?.seconds) {
            setDate(dayjs(new Date(tx.date.seconds * 1000)));
          }
          if (tx.completedDate?.seconds) {
            setCompletedDate(dayjs(new Date(tx.completedDate.seconds * 1000)));
          }
        }
      }
      setLoading(false);
    })();
  }, [user, id]);

  if (!user) return null;

  const findPersonByName = (name: string, list: PersonOption[] = persons) =>
    list.find((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase());

  const createPerson = async (name: string): Promise<PersonOption> => {
    const trimmed = name.trim();
    const existing = findPersonByName(trimmed);
    if (existing?.id) return existing;

    const ref = await addPerson({
      name: trimmed,
      userId: user.uid,
      createdAt: new Date(),
    });
    const created: PersonOption = { id: ref.id, name: trimmed };
    setPersons((prev) => [...prev, created]);
    return created;
  };

  const resolvePersonId = async (): Promise<string | null> => {
    if (selectedPerson?.id) return selectedPerson.id;

    const nameFromSelection = selectedPerson?.inputValue?.trim()
      || selectedPerson?.name?.trim()
      || personInput.trim();

    if (!nameFromSelection) return null;

    const existing = findPersonByName(nameFromSelection);
    if (existing?.id) return existing.id;

    const created = await createPerson(nameFromSelection);
    setSelectedPerson(created);
    setPersonInput(created.name);
    return created.id ?? null;
  };

  const handleSave = async () => {
    if (!user || !amount.trim()) return;

    setSaving(true);
    try {
      const personId = await resolvePersonId();
      if (!personId) return;

      const payload: any = {
        userId: user.uid,
        personId,
        mode,
        amount: Number(amount),
        type,
        description: description.trim(),
        status: completed ? "completed" : "pending",
        date: date.toDate(),
        completedDate: completed ? completedDate.toDate() : null,
      };

      if (id) {
        await updateTransaction(id, payload);
        showAlert("Transaction updated", "success");
        navigate("/transactions");
      } else {
        await addTransaction({ ...payload, createdAt: new Date() });
        showAlert("Transaction saved", "success");
        // Stay on /transactions/add — reset form for next entry
        setAmount("");
        setType("income");
        setDescription("");
        setCompleted(false);
        setCompletedDate(dayjs());
        setDate(dayjs());
        // Keep mode + person for fast repeat entries
      }
    } finally {
      setSaving(false);
    }
  };

  const hasPerson =
    Boolean(selectedPerson?.id) ||
    Boolean(selectedPerson?.inputValue?.trim()) ||
    Boolean(personInput.trim());

  const canSave = hasPerson && amount.trim() && !isNaN(Number(amount));

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
    <Box sx={{ maxWidth: 560, mx: "auto", px: { xs: 2, sm: 3 }, py: 3 }}>
      {/* Page Title */}
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 1 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {id ? (
            <EditRoundedIcon sx={{ fontSize: 32, color: "primary.main" }} />
          ) : (
            <ReceiptLongRoundedIcon sx={{ fontSize: 32, color: "primary.main" }} />
          )}
          <Typography variant="h4" fontWeight={700} color="text.primary">
            {id ? "Edit transaction" : "Add transaction"}
          </Typography>
        </Stack>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ReceiptLongRoundedIcon />}
          onClick={() => navigate("/transactions")}
          sx={{ borderRadius: 2, fontWeight: 600, flexShrink: 0 }}
        >
          Transactions
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {id
          ? "Update the transaction details below."
          : "Record income, expense, or money advanceed."}
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
          {/* Mode — first */}
          <TextField
            select
            label="Mode"
            fullWidth
            size="small"
            value={mode}
            onChange={(e) => setMode(e.target.value as "regular" | "cashed")}
            sx={inputSx}
            helperText="Cashed = cash customer entries; Regular = other cashflow"
          >
            {modeOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Person — search existing or create new */}
          <Autocomplete
            freeSolo
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            options={persons}
            value={selectedPerson}
            inputValue={personInput}
            onInputChange={(_, value) => setPersonInput(value)}
            filterOptions={(options, params) => {
              const filtered = filter(options, params);
              const inputValue = params.inputValue.trim();
              if (!inputValue) return filtered;

              const exists = options.some(
                (opt) => opt.name.trim().toLowerCase() === inputValue.toLowerCase()
              );
              if (!exists) {
                filtered.push({
                  inputValue,
                  name: `Add "${inputValue}"`,
                });
              }
              return filtered;
            }}
            getOptionLabel={(option) => {
              if (typeof option === "string") return option;
              if (option.inputValue) return option.inputValue;
              return option.name;
            }}
            isOptionEqualToValue={(option, value) =>
              Boolean(option.id) && option.id === value.id
            }
            renderOption={(props, option) => (
              <li {...props} key={option.id ?? `new-${option.inputValue ?? option.name}`}>
                {option.name}
              </li>
            )}
            onChange={async (_, newValue) => {
              if (typeof newValue === "string") {
                const trimmed = newValue.trim();
                if (!trimmed) {
                  setSelectedPerson(null);
                  return;
                }
                const existing = findPersonByName(trimmed);
                if (existing) {
                  setSelectedPerson(existing);
                  setPersonInput(existing.name);
                  return;
                }
                const created = await createPerson(trimmed);
                setSelectedPerson(created);
                setPersonInput(created.name);
                return;
              }

              if (newValue?.inputValue) {
                const created = await createPerson(newValue.inputValue);
                setSelectedPerson(created);
                setPersonInput(created.name);
                return;
              }

              setSelectedPerson(newValue);
              setPersonInput(newValue?.name ?? "");
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Person"
                size="small"
                placeholder="Search or type a new name"
                helperText="Pick an existing person, or add a new one"
                sx={inputSx}
              />
            )}
          />

          {/* Amount */}
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

          {/* Type */}
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

          {/* Transaction Date */}
          <DatePicker
            label="Transaction Date"
            value={date}
              format="DD/MM/YYYY" 
            onChange={(newValue) => setDate(newValue ?? dayjs())}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                sx: inputSx,
              },
            }}
          />

          {/* Description */}
          <TextField
            label="Description"
            placeholder="e.g. Lunch split, rent payment, advanceed for groceries…"
            fullWidth
            size="small"
            multiline
            minRows={2}
            maxRows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={inputSx}
            inputProps={{ maxLength: 300 }}
            helperText={`${description.length}/300`}
          />

          {/* Mark as completed */}
          <Box
            sx={{
              borderRadius: 2,
              border: `1px solid ${
                completed ? theme.palette.success.light : theme.palette.divider
              }`,
              backgroundColor: completed
                ? alpha(theme.palette.success.main, 0.04)
                : "transparent",
              px: 2,
              py: 1,
              transition: "all 0.2s",
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={completed}
                  onChange={(e) => setCompleted(e.target.checked)}
                  size="small"
                  sx={{
                    "&.Mui-checked": { color: theme.palette.success.main },
                  }}
                  icon={<CheckCircleOutlineRoundedIcon />}
                  checkedIcon={<CheckCircleOutlineRoundedIcon />}
                />
              }
              label={
                <Typography
                  variant="body2"
                  fontWeight={completed ? 600 : 400}
                  color={completed ? "success.main" : "text.secondary"}
                >
                  Mark as completed
                </Typography>
              }
            />

            {/* Completed Date — slides in when checked */}
            <Collapse in={completed} unmountOnExit>
              <Box sx={{ mt: 1.5, mb: 0.5 }}>
                <DatePicker
                  label="Completion Date"
                  value={completedDate}
                    format="DD/MM/YYYY" 
                  onChange={(newValue) => setCompletedDate(newValue ?? dayjs())}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      helperText: "When was this transaction settled?",
                      sx: {
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          backgroundColor: theme.palette.background.paper,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Collapse>
          </Box>

          {/* Actions */}
          <Stack
            direction="row"
            spacing={2}
            sx={{ pt: 1 }}
            justifyContent="flex-end"
          >
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => navigate("/transactions")}
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