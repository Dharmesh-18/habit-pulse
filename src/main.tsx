import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App.tsx";
import "./index.css";
import { ToastProvider } from "./context/ToastContext.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
const googleClientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || "missing-client-id";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <ConvexProvider client={convex}>
        <ThemeProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeProvider>
      </ConvexProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
