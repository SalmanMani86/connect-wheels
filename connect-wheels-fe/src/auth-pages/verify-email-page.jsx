import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Box, Typography, CircularProgress, Button, Paper } from "@mui/material";
import { useVerifyEmailMutation } from "../redux/slices/apiSlice";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [verifyEmail] = useVerifyEmailMutation();
  const hasRequestedRef = useRef(false);
  const [state, setState] = useState({
    loading: true,
    success: false,
    message: "",
  });

  useEffect(() => {
    if (hasRequestedRef.current) {
      return;
    }
    hasRequestedRef.current = true;

    const verify = async () => {
      console.log("[VerifyEmailPage] token from URL:", token);
      if (!token) {
        setState({
          loading: false,
          success: false,
          message: "Missing verification token.",
        });
        return;
      }
      try {
        console.log("[VerifyEmailPage] Calling verifyEmail mutation");
        const res = await verifyEmail(token).unwrap();
        console.log("[VerifyEmailPage] Verify response:", res);
        setState({
          loading: false,
          success: true,
          message: res?.message || "Email verified successfully.",
        });
      } catch (err) {
        console.error("[VerifyEmailPage] Verify error:", err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Email verification failed.";
        setState({
          loading: false,
          success: false,
          message: msg,
        });
      }
    };
    void verify();
  }, [token]);

  if (state.loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "grey.100",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {state.success ? "Email Verified" : "Verification Error"}
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          {state.message}
        </Typography>
        <Button component={Link} to="/login" variant="contained">
          Go to Login
        </Button>
      </Paper>
    </Box>
  );
}

