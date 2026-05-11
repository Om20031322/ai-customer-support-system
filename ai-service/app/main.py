from contextlib import asynccontextmanager
from fastapi import FastAPI
from .ai import process_ticket
from .kafka_worker import start_kafka_worker, stop_kafka_worker
from .models import TicketCreated


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await start_kafka_worker()
    print("[Docker] Service healthy", flush=True)
    yield
    print("[Docker] Service restarting", flush=True)
    await stop_kafka_worker()


app = FastAPI(title="AI Customer Support Service", lifespan=lifespan)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/process-ticket")
async def process_ticket_endpoint(ticket: TicketCreated):
    processed = await process_ticket(ticket)
    return {"data": processed}
