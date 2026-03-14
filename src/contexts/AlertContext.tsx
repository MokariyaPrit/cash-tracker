import React, { createContext, useCallback, useState } from "react";
import { Snackbar, Alert as MuiAlert } from "@mui/material";

export type AlertSeverity = "success" | "error" | "warning" | "info";

interface AlertContextValue {
  showAlert: (message: string, severity?: AlertSeverity) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<AlertSeverity>("info");

  const showAlert = useCallback((msg: string, sev: AlertSeverity = "info") => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  const handleClose = useCallback(
    (_?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === "clickaway") return;
      setOpen(false);
    },
    []
  );

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{
          "& .MuiSnackbar-root": { bottom: 24 },
        }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={handleClose}
          severity={severity}
          sx={{
            borderRadius: 2,
            boxShadow: (theme) => theme.shadows[4],
            fontWeight: 500,
            "&.MuiAlert-filledSuccess": {
              bgcolor: (theme) => theme.palette.success.main,
              color: (theme) => theme.palette.success.contrastText,
            },
            "&.MuiAlert-filledError": {
              bgcolor: (theme) => theme.palette.error.main,
              color: (theme) => theme.palette.error.contrastText,
            },
            "&.MuiAlert-filledWarning": {
              bgcolor: (theme) => theme.palette.warning.main,
              color: (theme) => theme.palette.warning.contrastText,
            },
            "&.MuiAlert-filledInfo": {
              bgcolor: (theme) => theme.palette.info.main,
              color: (theme) => theme.palette.info.contrastText,
            },
          }}
        >
          {message}
        </MuiAlert>
      </Snackbar>
    </AlertContext.Provider>
  );
}

export function useAlert(): AlertContextValue["showAlert"] {
  const ctx = React.useContext(AlertContext);
  if (!ctx) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return ctx.showAlert;
}
