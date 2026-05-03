import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useForgotPasswordMutation } from "../redux/slices/apiSlice";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await forgotPassword(email.trim()).unwrap();
      setMessage(res?.message || "If an account exists, a reset link has been sent.");
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.message ||
          "We could not send the reset email. Please try again."
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
          Reset your password and get back to your garage
        </Typography>

        <Typography variant="h6" fontWeight={700} gutterBottom>
          Forgot password?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter your account email and we will send you a secure reset link.
        </Typography>

        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}{" "}
            <Link to="/login" style={{ color: "inherit", fontWeight: 700 }}>
              Back to login
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
            type="email"
            label="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            sx={{ mb: 2.5 }}
          />
          <Button
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            disabled={isLoading}
            sx={{
              py: 1.15,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            {isLoading ? "Sending..." : "Send reset link"}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>
          Remembered it?{" "}
          <Link to="/login" style={{ color: "#1976d2", textDecoration: "none" }}>
            Back to login
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
