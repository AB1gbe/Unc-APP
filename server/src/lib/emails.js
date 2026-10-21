// The text of every email the app sends, in one place, in English and
// Arabic. Each returns { subject, text, html }; `lang` is the member's
// language (users.language). Keep the HTML simple: many email apps strip
// CSS. Arabic emails are laid out right-to-left (dir="rtl").
import { config } from '../config.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Member-written text (names, titles, messages) keeps its own direction
// inside the email. Email apps don't reliably support dir="auto" or <bdi>,
// so the direction is worked out here from the first letter: Arabic → rtl.
export const textDir = (s) => {
  const m = String(s).match(/[A-Za-z\u00C0-\u024F]|[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/);
  return m && !/[A-Za-z\u00C0-\u024F]/.test(m[0]) ? 'rtl' : 'ltr';
};
const member = (s) => `<span dir="${textDir(s)}">${esc(s)}</span>`;
// Plain text and subject lines: Unicode "isolate" marks do the same job.
const iso = (s) => `\u2068${s}\u2069`;

const FOOTER = {
  en: "You received this because of activity on your Unc account. If this wasn't you, you can ignore this email.",
  ar: 'وصلتك هذه الرسالة بسبب نشاط على حسابك في Unc. إن لم تكن أنت، يمكنك تجاهلها.',
};

function layout(lang, title, bodyHtml, footer = FOOTER[lang]) {
  const rtl = lang === 'ar';
  const dir = rtl ? 'rtl' : 'ltr';
  return `<!doctype html><html lang="${lang}" dir="${dir}"><body dir="${dir}" style="margin:0;background:#f6f7f9;font-family:Tahoma,Arial,Helvetica,sans-serif;color:#16181d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table role="presentation" width="100%" dir="${dir}" style="max-width:520px;background:#ffffff;border:1px solid #e3e6eb;border-radius:12px;text-align:${rtl ? 'right' : 'left'}" cellpadding="24"><tr><td>
<div dir="ltr" style="font-size:22px;font-weight:800;text-align:${rtl ? 'right' : 'left'}">un<span style="color:#2f6fed">c</span></div>
<h1 style="font-size:20px;margin:16px 0 8px">${esc(title)}</h1>
${bodyHtml}
<p style="color:#5d6573;font-size:12px;margin-top:24px">${footer}</p>
</td></tr></table></td></tr></table></body></html>`;
}

const pick = (lang) => (lang === 'ar' ? 'ar' : 'en');

export function verificationCodeEmail(code, language) {
  const lang = pick(language);
  const codeHtml = `<p dir="ltr" style="font-size:32px;letter-spacing:8px;font-weight:700;margin:16px 0">${esc(code)}</p>`;
  if (lang === 'ar') {
    return {
      subject: `${code} رمز التحقق الخاص بك في Unc`,
      text: `رمز التحقق الخاص بك في Unc هو ${code}.\nينتهي خلال 15 دقيقة.\n\nإن لم تنشئ حسابًا، تجاهل هذه الرسالة.`,
      html: layout(lang, 'أكّد بريدك الإلكتروني', `<p>أدخل هذا الرمز لتأكيد بريدك الإلكتروني:</p>${codeHtml}<p style="color:#5d6573">ينتهي خلال 15 دقيقة.</p>`),
    };
  }
  return {
    subject: `${code} is your Unc verification code`,
    text: `Your Unc verification code is ${code}.\nIt expires in 15 minutes.\n\nIf you didn't create an account, ignore this email.`,
    html: layout(lang, 'Confirm your email', `<p>Enter this code to confirm your email address:</p>${codeHtml}<p style="color:#5d6573">It expires in 15 minutes.</p>`),
  };
}

export function passwordResetEmail(token, language) {
  const lang = pick(language);
  const url = `${config.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const mins = config.resetTokenMinutes;
  const button = (label) => `<p style="margin:20px 0"><a href="${esc(url)}" style="background:#2f6fed;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">${label}</a></p>`;
  const rawLink = (label) => `<p style="color:#5d6573;font-size:12px;word-break:break-all">${label} <span dir="ltr">${esc(url)}</span></p>`;
  if (lang === 'ar') {
    return {
      url,
      subject: 'إعادة تعيين كلمة المرور في Unc',
      text: `طلب أحدهم (نأمل أنه أنت) إعادة تعيين كلمة المرور لحسابك في Unc.\n\nافتح هذا الرابط لاختيار كلمة مرور جديدة (صالح لمدة ${mins} دقيقة ولمرة واحدة):\n${url}\n\nإن لم تطلب ذلك، تجاهل هذه الرسالة — ستبقى كلمة المرور كما هي.`,
      html: layout(lang, 'إعادة تعيين كلمة المرور', `<p>طلب أحدهم (نأمل أنه أنت) إعادة تعيين كلمة المرور لحسابك في Unc.</p>
${button('اختر كلمة مرور جديدة')}
<p style="color:#5d6573">يعمل هذا الرابط مرة واحدة وتنتهي صلاحيته خلال ${mins} دقيقة. إن لم تطلب ذلك، تجاهل هذه الرسالة &mdash; ستبقى كلمة المرور كما هي.</p>
${rawLink('الزر لا يعمل؟ انسخ هذا الرابط:')}`),
    };
  }
  return {
    url,
    subject: 'Reset your Unc password',
    text: `Someone (hopefully you) asked to reset your Unc password.\n\nOpen this link to choose a new one (valid for ${mins} minutes, works once):\n${url}\n\nIf you didn't ask for this, ignore this email - your password stays the same.`,
    html: layout(lang, 'Reset your password', `<p>Someone (hopefully you) asked to reset your Unc password.</p>
${button('Choose a new password')}
<p style="color:#5d6573">This link works once and expires in ${mins} minutes. If you didn't ask for this, ignore this email &mdash; your password stays the same.</p>
${rawLink('Button not working? Copy this link:')}`),
  };
}

export function passwordChangedEmail(language) {
  const lang = pick(language);
  const resetUrl = `${config.appUrl}/forgot-password`;
  if (lang === 'ar') {
    return {
      subject: 'تم تغيير كلمة المرور لحسابك في Unc',
      text: `تم تغيير كلمة المرور لحسابك في Unc للتو، وتم تسجيل الخروج من جميع الأجهزة.\n\nإن لم تكن أنت، أعد تعيين كلمة المرور الآن: ${resetUrl}`,
      html: layout(lang, 'تم تغيير كلمة المرور', `<p>تم تغيير كلمة المرور لحسابك في Unc للتو، وتم تسجيل خروجك من جميع الأجهزة.</p>
<p><b>لست أنت؟</b> <a href="${esc(resetUrl)}">أعد تعيين كلمة المرور الآن</a>.</p>`),
    };
  }
  return {
    subject: 'Your Unc password was changed',
    text: `Your Unc password was just changed and all devices were logged out.\n\nIf this wasn't you, reset your password now: ${resetUrl}`,
    html: layout(lang, 'Your password was changed', `<p>Your Unc password was just changed and you were logged out on all devices.</p>
<p><b>Wasn't you?</b> <a href="${esc(resetUrl)}">Reset your password now</a>.</p>`),
  };
}

// To the buyer when a seller makes an offer on their request (session 17).
// Only sent while the buyer's "Email me about new offers" switch is on;
// the footer says where to turn it off.
export function newOfferEmail({ sellerName, title, message, offerPrice, currency, conversationId }, language) {
  const lang = pick(language);
  const url = `${config.appUrl}/messages/${conversationId}`;
  const settingsUrl = `${config.appUrl}/account`;
  const price = offerPrice == null ? null : new Intl.NumberFormat(lang === 'ar' ? 'ar-BH-u-nu-latn' : 'en-US', {
    style: 'currency', currency, currencyDisplay: lang === 'ar' ? 'code' : 'symbol', maximumFractionDigits: 0,
  }).format(offerPrice);
  const snippet = message.length > 300 ? `${message.slice(0, 300)}…` : message;
  const quote = `<blockquote dir="${textDir(snippet)}" style="margin:16px 0;padding:12px 16px;background:#f6f7f9;border-radius:8px;white-space:pre-wrap;text-align:${textDir(snippet) === 'rtl' ? 'right' : 'left'}">${esc(snippet)}</blockquote>`;
  const button = (label) => `<p style="margin:20px 0"><a href="${esc(url)}" style="background:#2f6fed;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">${label}</a></p>`;
  if (lang === 'ar') {
    return {
      subject: `عرض جديد على «${iso(title)}»`,
      text: `قدّم ${iso(sellerName)} عرضاً على طلبك «${iso(title)}»${price ? ` بسعر ${price}` : ''}:\n\n${snippet}\n\nاطّلع على العرض ورُدّ عليه: ${url}\n\nلإيقاف رسائل العروض الجديدة: ${settingsUrl}`,
      html: layout(lang, 'عرض جديد على طلبك', `<p>قدّم <b>${member(sellerName)}</b> عرضاً على طلبك «${member(title)}»${price ? ` بسعر <b>${esc(price)}</b>` : ''}:</p>
${quote}
${button('اطّلع على العرض')}`, `وصلتك هذه الرسالة لأنك نشرت هذا الطلب في Unc. <a href="${esc(settingsUrl)}">أوقف رسائل العروض الجديدة</a> من صفحة حسابك.`),
    };
  }
  return {
    subject: `New offer on “${iso(title)}”`,
    text: `${iso(sellerName)} made an offer on your request “${iso(title)}”${price ? ` for ${price}` : ''}:\n\n${snippet}\n\nSee the offer and reply: ${url}\n\nTo stop new-offer emails: ${settingsUrl}`,
    html: layout(lang, 'New offer on your request', `<p><b>${member(sellerName)}</b> made an offer on your request “${member(title)}”${price ? ` for <b>${esc(price)}</b>` : ''}:</p>
${quote}
${button('See the offer')}`, `You received this because you posted this request on Unc. <a href="${esc(settingsUrl)}">Turn off new-offer emails</a> in your account.`),
  };
}

