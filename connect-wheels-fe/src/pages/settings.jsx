import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import { useSelector, useDispatch } from "react-redux";
import { useGetUserProfileQuery, useUpdateUserProfileMutation, useChangePasswordMutation } from "../redux/slices/apiSlice";
import { updateUser } from "../redux/slices/userSlice";
import { toast } from "react-toastify";

export default function SettingsPage() {
  const dispatch = useDispatch();
  const { user: storeUser } = useSelector((state) => state.user);
  const [nameData, setNameData] = useState({ firstName: "", lastName: "" });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { data: profile, isLoading } = useGetUserProfileQuery(undefined, {
    skip: !storeUser?.id,
  });
  const [updateProfile, { isLoading: updating }] = useUpdateUserProfileMutation();
  const [changePassword, { isLoading: changingPassword }] = useChangePasswordMutation();

  const displayUser = profile || storeUser;
  const isGoogleUser = displayUser?.googleId || !displayUser?.password;

  const handleUpdateName = async () => {
    if (!nameData.firstName?.trim() && !nameData.lastName?.trim()) {
      toast.error("Enter at least first or last name");
      return;
    }
    try {
      const result = await updateProfile({
        firstName: nameData.firstName.trim() || undefined,
        lastName: nameData.lastName.trim() || undefined,
      }).unwrap();
      dispatch(updateUser(result));
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!isGoogleUser && !passwordData.currentPassword) {
      toast.error("Enter your current password");
      return;
    }
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }).unwrap();
      toast.success("Password updated");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err?.data?.message || "Failed to change password");
    }
  };

  if (isLoading && !displayUser) {
    return (
      <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "white" }} />
      </Box>
    );
  }

  const inputSx = {
    mb: 2,
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#1e293b",
      color: "white",
      "& fieldset": { borderColor: "rgba(255,255,255,0.25)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
      "&.Mui-focused fieldset": { borderColor: "#38bdf8" },
    },
    "& .MuiInputLabel-root": { color: "#94a3b8" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#38bdf8" },
    "& .MuiFormHelperText-root": { color: "#64748b" },
  };

  return (
    <Box sx={{ py: 3, px: 2, minHeight: "100%", background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)" }}>
      <Container maxWidth="sm">
        <Typography variant="h4" sx={{ color: "white", mb: 3, fontWeight: 700 }}>
          Settings
        </Typography>

        {/* Profile / Name */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            background: "linear-gradient(145deg, #334155 0%, #1e293b 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
            <PersonIcon sx={{ color: "#38bdf8", fontSize: 28 }} />
            <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
              Profile
            </Typography>
          </Box>
          <TextField
            fullWidth
            label="First Name"
            placeholder="Enter first name"
            value={nameData.firstName || displayUser?.firstName || ""}
            onChange={(e) => setNameData((p) => ({ ...p, firstName: e.target.value }))}
            slotProps={{ input: { sx: { color: "white" } } }}
            sx={inputSx}
          />
          <TextField
            fullWidth
            label="Last Name"
            placeholder="Enter last name"
            value={nameData.lastName || displayUser?.lastName || ""}
            onChange={(e) => setNameData((p) => ({ ...p, lastName: e.target.value }))}
            slotProps={{ input: { sx: { color: "white" } } }}
            sx={inputSx}
          />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              py: 1.5,
              px: 2,
              mb: 2,
              borderRadius: 1.5,
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <EmailIcon sx={{ color: "#64748b", fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              {displayUser?.email}
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={handleUpdateName}
            disabled={updating}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              backgroundColor: "#38bdf8",
              "&:hover": { backgroundColor: "#0ea5e9" },
            }}
          >
            {updating ? <CircularProgress size={24} color="inherit" /> : "Save Changes"}
          </Button>
        </Paper>

        {/* Password */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            background: "linear-gradient(145deg, #334155 0%, #1e293b 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
            <LockIcon sx={{ color: "#38bdf8", fontSize: 28 }} />
            <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
              Password
            </Typography>
          </Box>
          {isGoogleUser && (
            <Alert
              severity="info"
              sx={{
                mb: 2,
                backgroundColor: "rgba(56, 189, 248, 0.15)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                "& .MuiAlert-message": { color: "#e2e8f0" },
                "& .MuiAlert-icon": { color: "#38bdf8" },
              }}
            >
              You signed in with Google. You can set a password to also sign in with email.
            </Alert>
          )}
          {!isGoogleUser && (
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              placeholder="Enter current password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))}
              slotProps={{ input: { sx: { color: "white" } } }}
              sx={inputSx}
            />
          )}
          <TextField
            fullWidth
            type="password"
            label="New Password"
            placeholder="At least 6 characters"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
            helperText="At least 6 characters"
            slotProps={{ input: { sx: { color: "white" } } }}
            sx={inputSx}
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm New Password"
            placeholder="Confirm your new password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))}
            slotProps={{ input: { sx: { color: "white" } } }}
            sx={inputSx}
          />
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={changingPassword}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              backgroundColor: "#38bdf8",
              "&:hover": { backgroundColor: "#0ea5e9" },
            }}
          >
            {changingPassword ? <CircularProgress size={24} color="inherit" /> : "Change Password"}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
