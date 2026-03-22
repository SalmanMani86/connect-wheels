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
import VerifyEmailPage from "./auth-pages/verify-email-page";
import NotFoundPage from "./pages/not-found";
import DashboardPage from "./pages/dashboard";
import ChatPage from "./pages/chat";
import SettingsPage from "./pages/settings";
import GaragesPage from "./pages/garages";
import FeedPage from "./pages/feed";
import GarageDetailPage from "./pages/garage-detail";
import CarDetailPage from "./pages/car-detail";
import PostDetailPage from "./pages/post-detail";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
    path: "/verify-email",
    element: (
      <PublicRoute>
        <VerifyEmailPage />
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
        element: <Navigate to="/feed" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "feed",
        element: <FeedPage />,
      },
      {
        path: "feed/trending",
        element: <FeedPage trending />,
      },
      {
        path: "garages",
        element: <GaragesPage />,
      },
      {
        path: "garages/:garageId",
        element: <GarageDetailPage />,
      },
      {
        path: "garages/:garageId/cars/:carId",
        element: <CarDetailPage />,
      },
      {
        path: "posts/:postId",
        element: <PostDetailPage />,
      },
      {
        path: "chat",
        element: <ChatPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      { path: "profile", element: <Navigate to="/settings" replace /> },
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
        <ToastContainer theme="dark" position="top-right" limit={3} />
      </SocketProvider>
    </Provider>
  );
}

export default App;
