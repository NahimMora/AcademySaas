import "server-only";
import nodemailer from "nodemailer";
import type { EmailMessage, EmailProvider, EmailResult } from "@/lib/communications/types";
import { log } from "@/lib/observability/logger";

export class DevelopmentEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<EmailResult> {
    log("info", "email.dev_queued", { toDomain: message.to.split("@")[1], subjectLength: message.subject.length, correlationId: message.correlationId });
    return { providerId: `dev-${crypto.randomUUID()}`, status: "queued" };
  }
}

export class SmtpEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<EmailResult> {
    const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), secure: process.env.SMTP_SECURE === "true", auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined, disableFileAccess: true, disableUrlAccess: true });
    try {
      const result = await transport.sendMail({ from: process.env.EMAIL_FROM, to: message.to, subject: message.subject.replace(/[\r\n]/g, " "), text: message.text, html: message.html });
      return { providerId: result.messageId, status: "sent" };
    } catch (error) { log("error", "email.smtp_failed", { error: error instanceof Error ? error.message : "unknown", correlationId: message.correlationId }); return { status: "failed", error: "No se pudo entregar el correo" }; }
  }
}

export const emailProvider = (): EmailProvider => process.env.SMTP_HOST ? new SmtpEmailProvider() : new DevelopmentEmailProvider();
