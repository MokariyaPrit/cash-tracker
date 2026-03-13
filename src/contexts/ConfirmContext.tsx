import React, { createContext, useCallback, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: "primary" | "error" | "warning";
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const defaultOptions: ConfirmOptions = {
  title: "Are you sure?",
  message: "This action cannot be undone.",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  confirmColor: "error",
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>(defaultOptions);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions({ ...defaultOptions, ...opts });
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleClose = useCallback((confirmed: boolean) => {
    setOpen(false);
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog
        open={open}
        onClose={() => handleClose(false)}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 320 },
        }}
      >
        <DialogTitle id="confirm-dialog-title">{options.title}</DialogTitle>
        {options.message && (
          <DialogContent>
            <DialogContentText id="confirm-dialog-description">
              {options.message}
            </DialogContentText>
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
          <Button onClick={() => handleClose(false)} variant="outlined" color="inherit">
            {options.cancelLabel}
          </Button>
          <Button
            onClick={() => handleClose(true)}
            color={options.confirmColor ?? "error"}
            variant="contained"
            autoFocus
          >
            {options.confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue["confirm"] {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx.confirm;
}
