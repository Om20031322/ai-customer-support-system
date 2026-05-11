import json
from openai import AsyncOpenAI
from .config import settings
from .models import ProcessedTicket, TicketCreated


client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None


async def process_ticket(ticket: TicketCreated) -> ProcessedTicket:
    if should_force_fail(ticket):
        raise RuntimeError("FORCE_FAIL requested for retry/DLQ testing")

    if client:
        processed = await process_with_openai(ticket)
        if processed:
            return processed

    return process_with_mock_logic(ticket)


def should_force_fail(ticket: TicketCreated) -> bool:
    return "FORCE_FAIL" in ticket.subject or "FORCE_FAIL" in ticket.description


async def process_with_openai(ticket: TicketCreated) -> ProcessedTicket | None:
    prompt = f"""
Classify this customer support ticket.

Return only JSON with:
- category: billing, technical, account, product, or general
- priority: low, medium, high, or urgent
- aiResponse: a helpful support reply in 2-4 sentences

Subject: {ticket.subject}
Description: {ticket.description}
"""

    try:
        response = await client.responses.create(
            model=settings.openai_model,
            input=prompt,
            temperature=0.2,
        )
        parsed = json.loads(response.output_text)

        return ProcessedTicket(
            ticketId=ticket.id,
            status="PROCESSED",
            category=normalize_category(parsed.get("category")),
            priority=normalize_priority(parsed.get("priority")),
            aiResponse=str(parsed.get("aiResponse", "")).strip()
            or build_default_response(ticket),
        )
    except Exception as exc:
        print(f"OpenAI processing failed, using mock logic: {exc}")
        return None


def process_with_mock_logic(ticket: TicketCreated) -> ProcessedTicket:
    text = f"{ticket.subject} {ticket.description}".lower()

    if any(word in text for word in ["invoice", "billing", "payment", "charge", "refund"]):
        category = "billing"
    elif any(word in text for word in ["login", "password", "account", "access"]):
        category = "account"
    elif any(word in text for word in ["bug", "error", "broken", "crash", "cannot", "failed"]):
        category = "technical"
    elif any(word in text for word in ["feature", "pricing", "plan", "product"]):
        category = "product"
    else:
        category = "general"

    if any(word in text for word in ["urgent", "critical", "down", "blocked", "security"]):
        priority = "urgent"
    elif any(word in text for word in ["cannot", "failed", "broken", "refund"]):
        priority = "high"
    elif any(word in text for word in ["question", "help", "how"]):
        priority = "medium"
    else:
        priority = "low"

    return ProcessedTicket(
        ticketId=ticket.id,
        status="PROCESSED",
        category=category,
        priority=priority,
        aiResponse=build_default_response(ticket),
    )


def build_default_response(ticket: TicketCreated) -> str:
    return (
        f"Hi {ticket.name}, thanks for contacting support about \"{ticket.subject}\". "
        "We have reviewed your request and routed it to the right support queue. "
        "A specialist will follow up with the next steps shortly."
    )


def normalize_category(value: object) -> str:
    category = str(value or "general").lower().strip()
    return category if category in {"billing", "technical", "account", "product", "general"} else "general"


def normalize_priority(value: object) -> str:
    priority = str(value or "medium").lower().strip()
    return priority if priority in {"low", "medium", "high", "urgent"} else "medium"
