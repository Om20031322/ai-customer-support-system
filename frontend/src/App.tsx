import { useEffect } from "react";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Analytics } from "./pages/Analytics";
import { Dashboard } from "./pages/Dashboard";
import { DeadLetterQueue } from "./pages/DeadLetterQueue";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Login } from "./pages/Login";
import { NotFound } from "./pages/NotFound";
import { Register } from "./pages/Register";
import { ResetPassword } from "./pages/ResetPassword";
import { SubmitTicket } from "./pages/SubmitTicket";
import { SystemStatus } from "./pages/SystemStatus";
import { TicketDetails } from "./pages/TicketDetails";
import { socket } from "./services/socket";
import type { Ticket } from "./types/ticket";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/submit" replace /> },
      { path: "submit", element: <SubmitTicket /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "status", element: <SystemStatus /> },
      { path: "tickets/:id", element: <TicketDetails /> },
      {
        path: "analytics",
        element: (
          <ProtectedRoute adminOnly>
            <Analytics />
          </ProtectedRoute>
        )
      },
      {
        path: "admin/dlq",
        element: (
          <ProtectedRoute adminOnly>
            <DeadLetterQueue />
          </ProtectedRoute>
        )
      },
      { path: "*", element: <NotFound /> }
    ]
  }
]);

export default function App() {
  return (
    <>
      <AuthProvider>
        <RouterProvider router={router} />
        <RealtimeToasts />
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </AuthProvider>
    </>
  );
}

function RealtimeToasts() {
  useEffect(() => {
    function handleCreated(ticket: Ticket) {
      toast.success(`Realtime update: ${ticket.subject} was created.`);
    }

    function handleUpdated(ticket: Ticket) {
      toast(`Realtime update: ${ticket.subject} is ${formatStatus(ticket.status)}.`);
    }

    function handleProcessed(ticket: Ticket) {
      toast.success(`AI processing complete: ${ticket.subject}`);
    }

    function handleFailed(ticket: Ticket) {
      toast.error(`Ticket failed: ${ticket.subject}`);
    }

    function handleRetried(ticket: Ticket) {
      toast(`Retrying ticket: ${ticket.subject}`);
    }

    function handleDlq(ticket: Ticket) {
      toast.error(`Moved to DLQ: ${ticket.subject}`);
    }

    socket.on("ticket:created", handleCreated);
    socket.on("ticket:updated", handleUpdated);
    socket.on("ticket:processed", handleProcessed);
    socket.on("ticket:failed", handleFailed);
    socket.on("ticket:retried", handleRetried);
    socket.on("ticket:dlq", handleDlq);

    return () => {
      socket.off("ticket:created", handleCreated);
      socket.off("ticket:updated", handleUpdated);
      socket.off("ticket:processed", handleProcessed);
      socket.off("ticket:failed", handleFailed);
      socket.off("ticket:retried", handleRetried);
      socket.off("ticket:dlq", handleDlq);
    };
  }, []);

  return null;
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ").toLowerCase();
}
