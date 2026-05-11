export type TicketStatus = "NEW" | "PROCESSING" | "PROCESSED" | "FAILED" | string;
export type TicketPriority = "urgent" | "high" | "medium" | "low" | string;
export type TicketCategory = string;
export type UserRole = "USER" | "ADMIN";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type Ticket = {
  id: string;
  name: string;
  email: string;
  subject: string;
  description: string;
  status: TicketStatus;
  category: TicketCategory;
  priority: TicketPriority;
  aiResponse: string | null;
  retryCount: number;
  lastError: string | null;
  processedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  userId?: string | null;
};

export type TicketCreateInput = {
  name: string;
  email: string;
  subject: string;
  description: string;
};

export type ChartDatum = {
  name: string;
  value: number;
};

export type AnalyticsSummary = {
  totalTickets: number;
  byStatus: ChartDatum[];
  byCategory: ChartDatum[];
  byPriority: ChartDatum[];
  recentTickets: Ticket[];
};

export type FailedTicket = {
  id: string;
  ticketId: string;
  originalPayload: Record<string, unknown>;
  errorMessage: string;
  retryCount: number;
  createdAt: string;
};

export type DependencyHealth = {
  status: "ok" | "degraded" | "down";
  error?: string;
};

export type SystemHealth = {
  status: "ok" | "degraded" | "down";
  backend: string;
  postgres: DependencyHealth;
  redis: DependencyHealth;
  kafka: DependencyHealth;
  aiService: DependencyHealth;
  uptime: number;
};

export type SystemMetrics = {
  totalTickets: number;
  processedTickets: number;
  failedTickets: number;
  retryCount: number;
  dlqCount: number;
  redis: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  api: {
    averageResponseMs: number;
    samples: number;
  };
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};
