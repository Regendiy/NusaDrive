import { Response } from 'express';
import crypto from 'node:crypto';
import { insertWhatsappNotification } from '../db/queries.ts';
import {
  buildWhatsappMessage,
  parseValidGatewayUrl,
  WhatsappEventType,
} from '../utils/rentalLogic.ts';

interface SseClient {
  id: string;
  res: Response;
}

const clients = new Set<SseClient>();

export function registerSseClient(res: Response): () => void {
  const client: SseClient = {
    id: crypto.randomUUID(),
    res,
  };
  clients.add(client);

  return () => {
    clients.delete(client);
  };
}

export function broadcastRealtimeEvent(event: string, payload: unknown) {
  const serialized = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    try {
      client.res.write(serialized);
    } catch {
      clients.delete(client);
    }
  }
}

export async function dispatchWhatsappNotification(params: {
  bookingId: number | null;
  bookingCode: string;
  recipientPhone: string;
  recipientName: string;
  eventType: WhatsappEventType;
  vehicleName: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  pickupLocation: string;
  paymentMethod?: string;
}) {
  const messageBody = buildWhatsappMessage(params.eventType, {
    customerName: params.recipientName,
    bookingCode: params.bookingCode,
    vehicleName: params.vehicleName,
    startDate: params.startDate,
    endDate: params.endDate,
    totalAmount: params.totalAmount,
    pickupLocation: params.pickupLocation,
    paymentMethod: params.paymentMethod,
  });

  let deliveryStatus = 'delivered';
  let providerRef = `WA-RT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  // Optional live WhatsApp gateway integration (e.g. Fonnte or Meta Cloud API) if configured via env
  const validGatewayUrl = parseValidGatewayUrl(process.env.WHATSAPP_GATEWAY_URL);
  const gatewayToken = process.env.WHATSAPP_API_TOKEN?.trim();
  if (validGatewayUrl && gatewayToken) {
    try {
      const response = await fetch(validGatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: gatewayToken,
        },
        body: JSON.stringify({
          target: params.recipientPhone,
          message: messageBody,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) {
        deliveryStatus = 'queued_retry';
      }
    } catch (err) {
      console.warn(
        'External WhatsApp gateway unavailable, falling back to queue:',
        err instanceof Error ? err.message : String(err)
      );
      deliveryStatus = 'queued_retry';
    }
  }

  const saved = await insertWhatsappNotification({
    bookingId: params.bookingId,
    bookingCode: params.bookingCode,
    recipientPhone: params.recipientPhone,
    recipientName: params.recipientName,
    eventType: params.eventType,
    messageBody,
    deliveryStatus,
    providerRef,
  });

  broadcastRealtimeEvent('whatsapp_notification', saved);
  return saved;
}
