// Text messages (session 102, ADR-082): phone codes for casual sellers.
// Which transport is used comes from SMS_TRANSPORT (config.js):
//
//   console -> print the text in the server terminal (development and the
//              test site, where the code is also shown on screen)
//   memory  -> keep it in `smsOutbox` (automated tests read it)
//   twilio  -> send through Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
//              TWILIO_FROM): see docs/Features/Phone Codes.md
//
// sendSms() throws if the provider refuses the message.
import { config } from '../config.js';

export const smsOutbox = [];

async function sendViaTwilio(to, body) {
  const { sid, token, from } = config.sms.twilio;
  if (!sid || !token || !from) throw new Error('TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM must be set');
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
  if (!res.ok) throw new Error(`Twilio refused the text (${res.status}): ${await res.text()}`);
}

export async function sendSms(to, body) {
  switch (config.sms.transport) {
    case 'memory':
      smsOutbox.push({ to, body });
      return;
    case 'console':
      console.log(`\n[sms] to=${to}\n${body}\n`);
      return;
    case 'twilio':
      await sendViaTwilio(to, body);
      return;
    default:
      throw new Error(`Unknown SMS_TRANSPORT "${config.sms.transport}"`);
  }
}

// The text itself, in the member's language.
export const phoneCodeText = (code, language) => (language === 'ar'
  ? `رمز Unc الخاص بك: ${code}. لا تشاركه مع أحد.`
  : `Your Unc code is ${code}. Don't share it with anyone.`);
