import nodemailer from "nodemailer";
import { Ticket } from "@prisma/client";
import { env } from "../config/env";

type TicketEmailType = "submitted" | "processed" | "failed";

let consoleModeLogged = false;

function hasSmtpConfig() {
  return Boolean(
    env.emailHost &&
      env.emailPort &&
      env.emailUser &&
      env.emailPass &&
      env.emailFrom
  );
}

function createTransporter() {
  if (!hasSmtpConfig()) {
    if (!consoleModeLogged) {
      console.log("[Email] Console mode enabled");
      consoleModeLogged = true;
    }

    return null;
  }

  return nodemailer.createTransport({
    host: env.emailHost,
    port: env.emailPort,
    secure: env.emailPort === 465,
    auth: {
      user: env.emailUser,
      pass: env.emailPass
    }
  });
}

export async function sendTicketSubmittedEmail(ticket: Ticket) {
  await sendTicketEmail(ticket, "submitted");
  console.log("[Email] Ticket submitted email sent");
}

export async function sendTicketProcessedEmail(ticket: Ticket) {
  await sendTicketEmail(ticket, "processed");
  console.log("[Email] Ticket processed email sent");
}

export async function sendTicketFailedEmail(ticket: Ticket) {
  await sendTicketEmail(ticket, "failed");
  console.log("[Email] Ticket failed email sent");
}

async function sendTicketEmail(ticket: Ticket, type: TicketEmailType) {
  const transporter = createTransporter();
  const subject = buildSubject(ticket, type);
  const text = buildBody(ticket);

  if (!transporter) {
    console.log(`[Email] To: ${ticket.email}`);
    console.log(`[Email] Subject: ${subject}`);
    console.log(`[Email] Body:\n${text}`);
    return;
  }

  await transporter.sendMail({
    from: env.emailFrom,
    to: ticket.email,
    subject,
    text
  });
}

function buildSubject(ticket: Ticket, type: TicketEmailType) {
  const label =
    type === "submitted"
      ? "submitted"
      : type === "processed"
        ? "processed"
        : "failed";

  return `Your support ticket was ${label}: ${ticket.subject}`;
}

function buildBody(ticket: Ticket) {
  return [
    `Customer: ${ticket.name}`,
    `Subject: ${ticket.subject}`,
    `Status: ${ticket.status}`,
    `Category: ${ticket.category}`,
    `Priority: ${ticket.priority}`,
    `AI response: ${ticket.aiResponse ?? "Not available"}`
  ].join("\n");
}
