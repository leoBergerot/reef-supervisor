import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ParameterProvider } from "./context/ParameterContext";
import { TankProvider } from "./context/TankContext";
import { ToastProvider } from "./context/ToastContext";
import "./i18n";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <TankProvider>
            <ParameterProvider>
              <App />
            </ParameterProvider>
          </TankProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
