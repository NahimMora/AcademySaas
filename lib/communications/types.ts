export interface EmailMessage { to: string; subject: string; text: string; html?: string; correlationId?: string }
export interface EmailResult { providerId?: string; status: "sent" | "queued" | "failed"; error?: string }
export interface EmailProvider { send(message: EmailMessage): Promise<EmailResult> }
export interface WhatsAppMessage { to: string; template: string; variables: Record<string, string>; consentId: string }
export interface WhatsAppResult { providerId?: string; status: "sent" | "queued" | "disabled" | "failed" }
export interface WhatsAppProvider { send(message: WhatsAppMessage): Promise<WhatsAppResult> }
