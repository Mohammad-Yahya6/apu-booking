// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// @ts-ignore
const RESEND_API_KEY = (globalThis as any).Deno?.env.get("RESEND_API_KEY") ?? "";

function emailTemplate(data: {
  studentName: string;
  studentEmail: string;
  roomName: string;
  building: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#080808;font-family:'Roboto',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#0e0e0e;border-radius:12px;border:1px solid #1e1e1e;overflow:hidden;">

          <tr>
            <td style="background:#0e0e0e;padding:28px 36px 24px;border-bottom:1px solid #1a1a1a;">
              <p style="margin:0 0 4px;font-size:11px;color:#2a2a2a;letter-spacing:0.14em;text-transform:uppercase;">Asia Pacific University</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#f87171;letter-spacing:-0.02em;">Booking Cancelled</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 36px;">
              <p style="margin:0 0 20px;font-size:14px;color:#888;">Hi ${data.studentName},</p>
              <p style="margin:0 0 28px;font-size:14px;color:#888;line-height:1.6;">Your room booking has been cancelled by an administrator. Please see the details below.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;border-radius:8px;border:1px solid #1a1a1a;margin-bottom:20px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;color:#333;letter-spacing:0.1em;text-transform:uppercase;">Room</p>
                    <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#e4e4e4;">${data.roomName} · ${data.building}</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding-right:12px;">
                          <p style="margin:0 0 4px;font-size:11px;color:#333;letter-spacing:0.1em;text-transform:uppercase;">Date</p>
                          <p style="margin:0;font-size:14px;color:#e4e4e4;">${data.date}</p>
                        </td>
                        <td width="50%">
                          <p style="margin:0 0 4px;font-size:11px;color:#333;letter-spacing:0.1em;text-transform:uppercase;">Time</p>
                          <p style="margin:0;font-size:14px;color:#e4e4e4;">${data.startTime} – ${data.endTime}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a0808;border-radius:8px;border:1px solid #ef444433;margin-bottom:28px;">
                <tr>
                  <td style="padding:18px 24px;">
                    <p style="margin:0 0 6px;font-size:11px;color:#f87171;letter-spacing:0.1em;text-transform:uppercase;">Reason for cancellation</p>
                    <p style="margin:0;font-size:14px;color:#fca5a5;line-height:1.6;">${data.reason}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#333;line-height:1.6;text-align:center;">To make a new booking, visit the <a href="https://your-app-url.vercel.app" style="color:#3b82f6;text-decoration:none;">APU Bookings</a> portal.</p>
            </td>
          </tr>

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
    const { data } = await req.json();
    const html = emailTemplate(data);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "APU Bookings <onboarding@resend.dev>",
        to: data.studentEmail,
        subject: `Booking Cancelled — ${data.roomName}, ${data.date}`,
        html,
      }),
    });

    const result = await res.json();
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});