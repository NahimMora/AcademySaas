import type { WhatsAppMessage, WhatsAppProvider, WhatsAppResult } from "@/lib/communications/types";
export class DisabledWhatsAppProvider implements WhatsAppProvider {
  async send(message: WhatsAppMessage): Promise<WhatsAppResult> { void message; return { status: "disabled" }; }
}
