// The text of every email the app sends, in one place. Each returns
// { subject, text, html }. Keep the HTML simple: many email apps strip CSS.
import { config } from '../config.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function layout(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#16181d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid #e3e6eb;border-radius:12px" cellpadding="24"><tr><td>
<div style="font-size:22px;font-weight:800">un<span style="color:#2f6fed">c</span></div>
<h1 style="font-size:20px;margin:16px 0 8px">${esc(title)}</h1>
${bodyHtml}
<p style="color:#5d6573;font-size:12px;margin-top:24px">You received this because of activity on your Unc account. If this wasn't you, you can ignore this email.</p>
</td></tr></table></td></tr></table></body></html>`;
}

export function verificationCodeEmail(code) {
  return {
    subject: `${code} is your Unc verification code`,
    text: `Your Unc verification code is ${code}.\nIt expires in 15 minutes.\n\nIf you didn't create an account, ignore this email.`,
    html: layout('Confirm your email', `<p>Enter this code to confirm your email address:</p>
<p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:16px 0">${esc(code)}</p>
<p style="color:#5d6573">It expires in 15 minutes.</p>`),
  };
}

export function passwordResetEmail(token) {
  const url = `${config.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const mins = config.resetTokenMinutes;
  return {
    url,
    subject: 'Reset your Unc password',
    text: `Someone (hopefully you) asked to reset your Unc password.\n\nOpen this link to choose a new one (valid for ${mins} minutes, works once):\n${url}\n\nIf you didn't ask for this, ignore this email - your password stays the same.`,
    html: layout('Reset your password', `<p>Someone (hopefully you) asked to reset your Unc password.</p>
<p style="margin:20px 0"><a href="${esc(url)}" style="background:#2f6fed;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Choose a new password</a></p>
<p style="color:#5d6573">This link works once and expires in ${mins} minutes. If you didn't ask for this, ignore this email &mdash; your password stays the same.</p>
<p style="color:#5d6573;font-size:12px;word-break:break-all">Button not working? Copy this link: ${esc(url)}</p>`),
  };
}

export function passwordChangedEmail() {
  return {
    subject: 'Your Unc password was changed',
    text: `Your Unc password was just changed and all devices were logged out.\n\nIf this wasn't you, reset your password now: ${config.appUrl}/forgot-password`,
    html: layout('Your password was changed', `<p>Your Unc password was just changed and you were logged out on all devices.</p>
<p><b>Wasn't you?</b> <a href="${esc(config.appUrl)}/forgot-password">Reset your password now</a>.</p>`),
  };
}
