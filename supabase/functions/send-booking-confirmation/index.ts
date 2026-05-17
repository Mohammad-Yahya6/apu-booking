// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// @ts-ignore
const RESEND_API_KEY = (globalThis as any).Deno?.env.get("RESEND_API_KEY") ?? "";

function generateQRData(booking: {
  id: string;
  roomName: string;
  building: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  email: string;
}) {
  return `APU ROOM BOOKING
─────────────────────
Room: ${booking.roomName}
Building: ${booking.building}
Date: ${booking.date}
Time: ${booking.startTime} – ${booking.endTime}
Purpose: ${booking.purpose}
Booked by: ${booking.email}
Booking ID: ${booking.id}
─────────────────────
Asia Pacific University`;
}

function emailTemplate(booking: {
  id: string;
  roomName: string;
  building: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  email: string;
  name: string;
}) {
  const qrData = encodeURIComponent(generateQRData(booking));
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&bgcolor=0e0e0e&color=ffffff&margin=10`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#080808;font-family:'Roboto',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#0e0e0e;border-radius:12px;border:1px solid #1e1e1e;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#0e0e0e;padding:28px 36px 24px;border-bottom:1px solid #1a1a1a;">
              <p style="margin:0 0 4px;font-size:11px;color:#2a2a2a;letter-spacing:0.14em;text-transform:uppercase;">Asia Pacific University</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#f0f0f0;letter-spacing:-0.02em;">Booking Confirmed</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 36px;">
              <p style="margin:0 0 20px;font-size:14px;color:#888;">Hi ${booking.name},</p>
              <p style="margin:0 0 28px;font-size:14px;color:#888;line-height:1.6;">Your room booking has been confirmed. Show the QR code below at the room entrance as proof of booking.</p>

              <!-- Booking details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;border-radius:8px;border:1px solid #1a1a1a;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;color:#333;letter-spacing:0.1em;text-transform:uppercase;">Room</p>
                    <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#e4e4e4;">${booking.roomName} · ${booking.building}</p>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding-right:12px;">
                          <p style="margin:0 0 4px;font-size:11px;color:#333;letter-spacing:0.1em;text-transform:uppercase;">Date</p>
                          <p style="margin:0;font-size:14px;color:#e4e4e4;">${booking.date}</p>
                        </td>
                        <td width="50%">
                          <p style="margin:0 0 4px;font-size:11px;color:#333;letter-spacing:0.1em;text-transform:uppercase;">Time</p>
                          <p style="margin:0;font-size:14px;color:#e4e4e4;">${booking.startTime} – ${booking.endTime}</p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:16px 0 4px;font-size:11px;color:#333;letter-spacing:0.1em;text-transform:uppercase;">Purpose</p>
                    <p style="margin:0;font-size:14px;color:#e4e4e4;">${booking.purpose}</p>
                  </td>
                </tr>
              </table>

              <!-- QR Code -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 14px;font-size:11px;color:#333;letter-spacing:0.1em;text-transform:uppercase;">Booking QR Code</p>
                    <img src="${qrUrl}" width="180" height="180" alt="Booking QR Code" style="border-radius:8px;display:block;"/>
                    <p style="margin:10px 0 0;font-size:10px;color:#252525;font-family:monospace;">${booking.id.slice(0,8).toUpperCase()}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#333;line-height:1.6;text-align:center;">If you need to cancel or edit this booking, visit the <a href="https://your-app-url.vercel.app/bookings" style="color:#3b82f6;text-decoration:none;">APU Bookings</a> portal.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #1a1a1a;">
              <p style="margin:0;font-size:11px;color:#252525;text-align:center;">APU Room Booking System · Asia Pacific University · Kuala Lumpur</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const body = await req.json();
    const { booking } = body;

    const html = emailTemplate(booking);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "APU Bookings <onboarding@resend.dev>",
        to: booking.email,
        subject: `Booking Confirmed — ${booking.roomName}, ${booking.date}`,
        html,
      }),
    });

      const data = await res.json();
      console.log("Resend response:", JSON.stringify(data));
      return new Response(JSON.stringify(data), {
        headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});