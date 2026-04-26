import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { store } from "./redux/store";
import { loginSuccess } from "./redux/slices/userSlice";
// Process token BEFORE React renders
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");
const userId = urlParams.get("userId");
const email = urlParams.get("email");

// Only auto-login when coming from Google OAuth callback,
// which includes token + userId/email on the root path.
if (
  token &&
  (userId || email) &&
  window.location.pathname === "/"
) {
  const user = { id: userId, email };
  store.dispatch(loginSuccess({ user, token }));
  window.history.replaceState({}, document.title, "/");
}
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
