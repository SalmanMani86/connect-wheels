import { store } from "./redux/store";
import { Provider } from "react-redux";
import "./App.css";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "./routes/protected-route";
import PublicRoute from "./routes/public-route";
import Layout from "./components/layout";
import LoginPage from "./auth-pages/login-page";
import SignupPage from "./auth-pages/sign-up-page";
import NotFoundPage from "./pages/not-found";
import DashboardPage from "./pages/dashboard";
import ChatPage from "./pages/chat";
import { ToastContainer } from "react-toastify";
import { SocketProvider } from "./contexts/SocketContext";
import UserDebug from "./components/debug/UserDebug";

// 🔹 Route configuration
const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: "/signup",
    element: (
      <PublicRoute>
        <SignupPage />
      </PublicRoute>
    ),
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "chat",
        element: <ChatPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

// App component - clean and simple
function App() {
  return (
    <Provider store={store}>
      <SocketProvider>
        <RouterProvider router={router} />
        <ToastContainer />
      </SocketProvider>
    </Provider>
  );
}

export default App;
