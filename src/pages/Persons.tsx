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
  Avatar,
  Chip,
} from "@mui/material";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import { useNavigate } from "react-router-dom";
import { useConfirm } from "../contexts/ConfirmContext";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Simple color from name
function getAvatarColor(name: string, theme: any) {
  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

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

  useEffect(() => { loadPersons(); }, [user]);

  const handleAdd = async () => {
    if (!name.trim() || !user) return;
    setAdding(true);
    try {
      await addPerson({ name: name.trim(), userId: user.uid, createdAt: new Date() });
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
    <Box sx={{ maxWidth: 720, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>

      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <Typography variant="h5" fontWeight={800} color="text.primary" letterSpacing="-0.5px">
            Persons
          </Typography>
          {!loading && persons.length > 0 && (
            <Chip
              icon={<GroupRoundedIcon sx={{ fontSize: "14px !important" }} />}
              label={persons.length}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 700, height: 22, fontSize: 11 }}
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">
          Add people to track balances and ledgers with.
        </Typography>
      </Box>

      {/* ── Add person form ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          borderRadius: 2.5,
          border: `1.5px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "light" ? 0.02 : 0.06),
        }}
      >
        <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform: "uppercase", letterSpacing: 0.8, mb: 1.5, display: "block" }}>
          Add New Person
        </Typography>
        {/* Input + Button always stacked: input full width, button full width below */}
        <Stack spacing={1.5}>
          <TextField
            label="Person name"
            placeholder="e.g. Rahul, Roommate, John…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            fullWidth
            size="small"
            disabled={adding}
            autoComplete="off"
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
            fullWidth
            startIcon={
              adding
                ? <CircularProgress size={16} color="inherit" />
                : <PersonAddRoundedIcon />
            }
            sx={{ borderRadius: 2, py: 1.25, fontWeight: 700 }}
          >
            {adding ? "Adding…" : "Add Person"}
          </Button>
        </Stack>
      </Paper>

      {/* ── List ── */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : persons.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 5 },
            textAlign: "center",
            borderRadius: 2.5,
            border: `1.5px dashed ${theme.palette.divider}`,
            backgroundColor: alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.02 : 0.04),
          }}
        >
          <PersonOutlineRoundedIcon sx={{ fontSize: 52, color: "text.disabled", mb: 1.5 }} />
          <Typography color="text.secondary" variant="body1" fontWeight={600} gutterBottom>
            No persons yet
          </Typography>
          <Typography color="text.disabled" variant="body2" sx={{ maxWidth: 260, mx: "auto" }}>
            Add someone above to start tracking balances and view their ledger.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.25}>
          {persons.map((p) => {
            const avatarColor = getAvatarColor(p.name, theme);
            return (
              <Paper
                key={p.id}
                elevation={0}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 1.25, sm: 1.5 },
                  borderRadius: 2.5,
                  border: `1.5px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    borderColor: alpha(theme.palette.primary.main, 0.35),
                    boxShadow: theme.shadows[2],
                  },
                }}
              >
                {/* Left: Avatar + Name */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      fontSize: 13,
                      fontWeight: 800,
                      backgroundColor: alpha(avatarColor, 0.15),
                      color: avatarColor,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(p.name)}
                  </Avatar>
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    color="text.primary"
                    noWrap
                  >
                    {p.name}
                  </Typography>
                </Box>

                {/* Right: Actions */}
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0, ml: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/persons/ledger/${p.id}`)}
                    startIcon={<MenuBookRoundedIcon sx={{ fontSize: "15px !important" }} />}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: 12,
                      px: { xs: 1.25, sm: 1.5 },
                      height: 32,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Ledger
                  </Button>
                  <Tooltip title="Delete person">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(p.id, p.name)}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        border: `1.5px solid ${alpha(theme.palette.error.main, 0.3)}`,
                        "&:hover": {
                          backgroundColor: alpha(theme.palette.error.main, 0.08),
                          borderColor: theme.palette.error.main,
                        },
                      }}
                      aria-label={`Delete ${p.name}`}
                    >
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}