import axios from "axios";
import {
  AnalyticsSummary,
  AuthResponse,
  AuthUser,
  FailedTicket,
  SystemHealth,
  SystemMetrics,
  Ticket,
  TicketCreateInput,
  TicketStatus
} from "../types/ticket";

export const AUTH_TOKEN_KEY = "ai-support-auth-token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000"
});

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error?.message ??
      error.response?.data?.message ??
      error.message ??
      "Request failed";

    return Promise.reject(new Error(message));
  }
);

export function storeAuthToken(token: string) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function getStoredAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearAuthToken() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
}) {
  const response = await api.post<{ data: AuthResponse }>("/api/auth/register", input);
  return response.data.data;
}

export async function login(input: { email: string; password: string }) {
  const response = await api.post<{ data: AuthResponse }>("/api/auth/login", input);
  return response.data.data;
}

export async function googleLogin(input: { credential: string }) {
  const response = await api.post<{ data: AuthResponse }>("/api/auth/google", input);
  return response.data.data;
}

export async function forgotPassword(input: { email: string }) {
  const response = await api.post<{ data: { message: string } }>(
    "/api/auth/forgot-password",
    input
  );
  return response.data.data;
}

export async function resetPassword(input: { token: string; newPassword: string }) {
  const response = await api.post<{ data: { message: string } }>(
    "/api/auth/reset-password",
    input
  );
  return response.data.data;
}

export async function fetchMe() {
  const response = await api.get<{ data: AuthUser }>("/api/auth/me");
  return response.data.data;
}

export async function createTicket(input: TicketCreateInput) {
  const response = await api.post<{ data: Ticket }>("/api/tickets", input);
  return response.data.data;
}

export async function fetchTickets() {
  const response = await api.get<{ data: Ticket[] }>("/api/tickets");
  return response.data.data;
}

export async function fetchTicket(id: string) {
  const response = await api.get<{ data: Ticket }>(`/api/tickets/${id}`);
  return response.data.data;
}

export async function fetchAnalyticsSummary() {
  const response = await api.get<{ data: AnalyticsSummary }>("/api/analytics/summary");
  return response.data.data;
}

export async function fetchFailedTickets() {
  const response = await api.get<{ data: FailedTicket[] }>("/api/admin/dlq");
  return response.data.data;
}

export async function fetchSystemHealth() {
  const response = await api.get<SystemHealth>("/health");
  return response.data;
}

export async function fetchSystemMetrics() {
  const response = await api.get<SystemMetrics>("/metrics");
  return response.data;
}

export async function updateTicketStatus(id: string, status: TicketStatus) {
  const response = await api.patch<{ data: Ticket }>(`/api/tickets/${id}/status`, {
    status
  });
  return response.data.data;
}
