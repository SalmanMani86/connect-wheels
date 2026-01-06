import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Navbar from "./navbar";
import Sidebar from "./sidebar";

export default function Layout() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <Navbar />
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: "auto",
            backgroundColor: "#f5f5f5",
            position: "relative", // Added for absolute positioning of children
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}