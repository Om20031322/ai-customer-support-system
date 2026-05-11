from pydantic import BaseModel, EmailStr

class TicketCreated(BaseModel):
    id: str
    name: str
    email: EmailStr
    subject: str
    description: str
    status: str = "NEW"
    category: str = "general"
    priority: str = "medium"
    createdAt: str
    retryCount: int = 0
    lastError: str | None = None
    correlationId: str | None = None

class ProcessedTicket(BaseModel):
    ticketId: str
    status: str = "PROCESSED"
    category: str
    priority: str
    aiResponse: str
    retryCount: int = 0
    lastError: str | None = None
    correlationId: str | None = None
