import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useResetPasswordMutation } from "../redux/slices/apiSlice";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [redirectSeconds, setRedirectSeconds] = useState(null);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  useEffect(() => {
    if (redirectSeconds === null) {
      return undefined;
    }
    if (redirectSeconds <= 0) {
      navigate("/login", { replace: true });
      return undefined;
    }

    const timer = setTimeout(() => {
      setRedirectSeconds((seconds) => (seconds === null ? null : seconds - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectSeconds, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Missing reset token. Please request a new reset link.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await resetPassword({ token, password }).unwrap();
      setMessage(res?.message || "Password reset successfully.");
      setRedirectSeconds(5);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.message ||
          "We could not reset your password. Please request a new link."
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.100",
        p: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 420,
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" fontWeight={700} textAlign="center" gutterBottom>
          Connect Wheels
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
          Secure your account with a new password
        </Typography>

        <Typography variant="h6" fontWeight={700} gutterBottom>
          Set new password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose a strong password to get back into your Connect Wheels account.
        </Typography>

        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
            {redirectSeconds !== null
              ? ` Redirecting to login in ${redirectSeconds}s.`
              : ""}{" "}
            <Link to="/login" style={{ color: "inherit", fontWeight: 700 }}>
              Go to login
            </Link>
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            required
            type="password"
            label="New password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            required
            type="password"
            label="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            sx={{ mb: 2.5 }}
          />
          <Button
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            disabled={isLoading || !token}
            sx={{
              py: 1.15,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            {isLoading ? "Resetting..." : "Reset password"}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>
          Need a fresh link?{" "}
          <Link
            to="/forgot-password"
            style={{ color: "#1976d2", textDecoration: "none" }}
          >
            Request again
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
