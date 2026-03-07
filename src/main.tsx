import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { GoogleOAuthProvider } from "@react-oauth/google"
import App from "./App"
import "./index.css"

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ""

if (!GOOGLE_CLIENT_ID) {
  console.warn("[GSI_LOGGER]: VITE_GOOGLE_CLIENT_ID is missing. Google Login will be disabled.")
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {GOOGLE_CLIENT_ID ? (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </BrowserRouter>
      </GoogleOAuthProvider>
    ) : (
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    )}
  </React.StrictMode>,
)
