import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { Provider } from "react-redux";
import { store } from "./store/store";

import { ThemeProvider, CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import theme from "./theme/theme";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import { AlertProvider } from "./contexts/AlertContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AlertProvider>
        <ConfirmProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <App />
          </LocalizationProvider>
        </ConfirmProvider>
        </AlertProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);