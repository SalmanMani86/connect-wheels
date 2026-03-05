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
            backgroundColor: "#0f172a",
            position: "relative",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}