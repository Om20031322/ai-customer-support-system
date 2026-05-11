import asyncio
import json
import time
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from .ai import process_ticket
from .config import settings
from .models import ProcessedTicket, TicketCreated

MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 5

producer: AIOKafkaProducer | None = None
consumer: AIOKafkaConsumer | None = None
consumer_task: asyncio.Task | None = None


async def start_kafka_worker() -> None:
    global producer, consumer, consumer_task

    producer = AIOKafkaProducer(bootstrap_servers=settings.kafka_brokers)
    consumer = AIOKafkaConsumer(
        settings.ticket_created_topic,
        settings.ticket_retry_topic,
        bootstrap_servers=settings.kafka_brokers,
        group_id="customer-support-ai-service",
        auto_offset_reset="latest",
        enable_auto_commit=True,
    )

    await producer.start()
    await consumer.start()
    print(
        f"[Kafka] AI service producer connected to brokers: {', '.join(settings.kafka_brokers)}",
        flush=True,
    )
    print(
        f"[Kafka] AI service consumer connected to brokers: {', '.join(settings.kafka_brokers)}",
        flush=True,
    )
    print(
        f'[Kafka] AI service consumer subscribed to ticket-created topic "{settings.ticket_created_topic}"',
        flush=True,
    )
    print(
        f'[Kafka] AI service consumer subscribed to retry topic "{settings.ticket_retry_topic}"',
        flush=True,
    )
    consumer_task = asyncio.create_task(_consume_tickets())
    print("[Kafka] AI service Kafka worker started", flush=True)


async def stop_kafka_worker() -> None:
    global producer, consumer, consumer_task

    if consumer_task:
        consumer_task.cancel()
        try:
            await consumer_task
        except asyncio.CancelledError:
            pass

    if consumer:
        await consumer.stop()

    if producer:
        await producer.stop()


async def process_ticket_once(ticket: TicketCreated):
    started_at = time.perf_counter()
    processed = await process_ticket(ticket)
    processed.retryCount = ticket.retryCount
    processed.lastError = ticket.lastError
    processed.correlationId = ticket.correlationId

    await publish_processed_ticket(ticket.id, processed)
    elapsed_ms = round((time.perf_counter() - started_at) * 1000)
    print(f"[AI] Processed ticket {ticket.id} in {elapsed_ms}ms", flush=True)

    return processed


async def publish_processed_ticket(ticket_id: str, processed: ProcessedTicket) -> None:
    if producer:
        await producer.send_and_wait(
            settings.ticket_processed_topic,
            processed.model_dump_json().encode("utf-8"),
            key=ticket_id.encode("utf-8"),
            headers=[("correlationId", (processed.correlationId or ticket_id).encode("utf-8"))],
        )


async def publish_retry_ticket(ticket: TicketCreated, error: Exception) -> None:
    if not producer:
        return

    next_retry_count = ticket.retryCount + 1
    retry_payload = ticket.model_dump()
    retry_payload["retryCount"] = next_retry_count
    retry_payload["lastError"] = str(error)

    print("[Retry] Retrying ticket processing", flush=True)
    print(f"[Retry] Attempt {next_retry_count}/{MAX_RETRIES}", flush=True)

    await producer.send_and_wait(
        settings.ticket_retry_topic,
        json.dumps(retry_payload).encode("utf-8"),
        key=ticket.id.encode("utf-8"),
        headers=[("correlationId", (ticket.correlationId or ticket.id).encode("utf-8"))],
    )


async def publish_dead_letter_ticket(ticket: TicketCreated, error: Exception) -> None:
    if not producer:
        return

    dlq_payload = ticket.model_dump()
    dlq_payload["ticketId"] = ticket.id
    dlq_payload["retryCount"] = MAX_RETRIES
    dlq_payload["lastError"] = str(error)
    dlq_payload["status"] = "FAILED"
    dlq_payload["aiResponse"] = "AI processing failed after all retry attempts."

    print("[Retry] Max retries reached", flush=True)
    print("[DLQ] Ticket moved to dead letter queue", flush=True)

    await producer.send_and_wait(
        settings.ticket_dead_letter_topic,
        json.dumps(dlq_payload).encode("utf-8"),
        key=ticket.id.encode("utf-8"),
        headers=[("correlationId", (ticket.correlationId or ticket.id).encode("utf-8"))],
    )


async def _consume_tickets() -> None:
    assert consumer is not None

    async for message in consumer:
        ticket: TicketCreated | None = None
        try:
            payload = json.loads(message.value.decode("utf-8"))
            ticket = TicketCreated(**payload)
            if message.topic == settings.ticket_retry_topic:
                await asyncio.sleep(RETRY_DELAY_SECONDS)
            print(
                f'[Kafka] AI service consumer received ticket event for ticket {ticket.id} from topic "{message.topic}"',
                flush=True,
            )
            await process_ticket_once(ticket)
        except Exception as exc:
            print(f"[AI] Failed to process ticket event: {exc}", flush=True)
            if ticket is not None:
                try:
                    if ticket.retryCount >= MAX_RETRIES:
                        await publish_dead_letter_ticket(ticket, exc)
                    else:
                        await publish_retry_ticket(ticket, exc)
                except Exception as publish_exc:
                    print(f"[Kafka] Failed to publish failure ticket event: {publish_exc}", flush=True)
