import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slices/userSlice";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: "linear-gradient(90deg, #0f172a 0%, #1e293b 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Box sx={{ px: { xs: 2, sm: 3 }, maxWidth: "100%" }}>
        <Toolbar
          disableGutters
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            minHeight: 64,
            py: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DirectionsCarIcon sx={{ color: "#38bdf8", fontSize: 28 }} />
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                color: "white",
                textDecoration: "none",
                fontWeight: 700,
                display: { xs: "none", sm: "block" },
                "&:hover": { color: "#38bdf8" },
              }}
            >
              Connect Wheels
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255,255,255,0.9)",
                    fontWeight: 500,
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  Welcome, {user?.firstName || user?.email?.split("@")[0] || "User"}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleLogout}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    borderColor: "#64748b",
                    color: "#94a3b8",
                    "&:hover": { borderColor: "#f87171", color: "#f87171" },
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  to="/login"
                  sx={{
                    color: "rgba(255,255,255,0.9)",
                    textTransform: "none",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
                  }}
                >
                  Login
                </Button>
                <Button
                  component={Link}
                  to="/signup"
                  variant="contained"
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    backgroundColor: "#38bdf8",
                    "&:hover": { backgroundColor: "#0ea5e9" },
                    px: 3,
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Box>
    </AppBar>
  );
}
