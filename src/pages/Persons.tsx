import { useEffect, useState } from "react";
import { addPerson, getPersons, deletePerson } from "../services/personService";
import { useAppSelector } from "../hooks/reduxHooks";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  Stack,
  CircularProgress,
} from "@mui/material";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { useNavigate } from "react-router-dom";
import { useConfirm } from "../contexts/ConfirmContext";

export default function Persons() {
  const [name, setName] = useState("");
  const [persons, setPersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const user = useAppSelector((state: any) => state.auth.user);
  const theme = useTheme();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const loadPersons = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getPersons(user.uid);
      setPersons(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersons();
  }, [user]);

  const handleAdd = async () => {
    if (!name.trim() || !user) return;
    setAdding(true);
    try {
      await addPerson({
        name: name.trim(),
        userId: user.uid,
        createdAt: new Date(),
      });
      setName("");
      await loadPersons();
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string, personName: string) => {
    const ok = await confirm({
      title: "Delete person?",
      message: `"${personName}" will be removed. This cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      confirmColor: "error",
    });
    if (!ok) return;
    await deletePerson(id);
    loadPersons();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  return (
    <Box
      sx={{
        maxWidth: 720,
        mx: "auto",
        px: { xs: 2, sm: 3 },
        py: 3,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mb: 1,
          color: "text.primary",
        }}
      >
        Persons
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Add people to track balances and ledgers with.
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(
            theme.palette.primary.main,
            theme.palette.mode === "light" ? 0.02 : 0.08
          ),
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "flex-end" }}
        >
          <TextField
            label="Person name"
            placeholder="e.g. John, Roommate"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            fullWidth
            size="small"
            disabled={adding}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: theme.palette.background.paper,
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!name.trim() || adding}
            startIcon={
              adding ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <PersonAddRoundedIcon />
              )
            }
            sx={{
              borderRadius: 2,
              minWidth: { xs: "100%", sm: 120 },
              py: 1.25,
            }}
          >
            {adding ? "Adding…" : "Add person"}
          </Button>
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : persons.length === 0 ? (
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
          <PersonOutlineRoundedIcon
            sx={{ fontSize: 56, color: "text.disabled", mb: 1 }}
          />
          <Typography color="text.secondary" variant="body1" gutterBottom>
            No persons yet
          </Typography>
          <Typography color="text.disabled" variant="body2">
            Add someone above to start tracking balances and view their ledger.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {persons.map((p) => (
            <Paper
              key={p.id}
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1.5,
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
              <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                {p.name}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Tooltip title="Open ledger">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/persons/ledger/${p.id}`)}
                    startIcon={<MenuBookRoundedIcon fontSize="small" />}
                    sx={{ borderRadius: 2 }}
                  >
                    Ledger
                  </Button>
                </Tooltip>
                <Tooltip title="Delete person">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(p.id, p.name)}
                    sx={{
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.error.main, 0.08),
                      },
                    }}
                    aria-label={`Delete ${p.name}`}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
