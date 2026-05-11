import os


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings:
    kafka_brokers: list[str] = _split_csv(os.getenv("KAFKA_BROKERS", "localhost:29092"))
    ticket_created_topic: str = os.getenv("KAFKA_TICKET_CREATED_TOPIC", "tickets.created")
    ticket_processed_topic: str = os.getenv("KAFKA_TICKET_PROCESSED_TOPIC", "tickets.processed")
    ticket_retry_topic: str = os.getenv("KAFKA_TICKET_RETRY_TOPIC", "tickets.retry")
    ticket_dead_letter_topic: str = os.getenv("KAFKA_TICKET_DEAD_LETTER_TOPIC", "tickets.dead-letter")
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY") or None
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


settings = Settings()
