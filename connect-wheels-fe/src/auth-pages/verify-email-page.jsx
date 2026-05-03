import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, Button, Paper } from "@mui/material";
import { CheckCircleOutline, ErrorOutline } from "@mui/icons-material";
import { useVerifyEmailMutation } from "../redux/slices/apiSlice";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [verifyEmail] = useVerifyEmailMutation();
  const hasRequestedRef = useRef(false);
  const [state, setState] = useState({
    loading: true,
    success: false,
    message: "",
  });
  const [redirectSeconds, setRedirectSeconds] = useState(null);

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
        setRedirectSeconds(5);
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
          width: "100%",
          maxWidth: 480,
          textAlign: "center",
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" fontWeight={700} textAlign="center" gutterBottom>
          Connect Wheels
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
          Account verification
        </Typography>

        <Box
          sx={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            mx: "auto",
            mb: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: state.success
              ? "rgba(34, 197, 94, 0.18)"
              : "rgba(248, 113, 113, 0.18)",
            color: state.success ? "#4ade80" : "#f87171",
          }}
        >
          {state.success ? (
            <CheckCircleOutline sx={{ fontSize: 38 }} />
          ) : (
            <ErrorOutline sx={{ fontSize: 38 }} />
          )}
        </Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {state.success ? "Email Verified" : "Verification Error"}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {state.message}
          {state.success && redirectSeconds !== null
            ? ` Redirecting to login in ${redirectSeconds}s.`
            : ""}
        </Typography>
        <Button
          component={Link}
          to={state.success ? "/login" : "/signup"}
          variant="contained"
          sx={{
            px: 3,
            py: 1.1,
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          {state.success ? "Go to Login" : "Create a new account"}
        </Button>
      </Paper>
    </Box>
  );
}

