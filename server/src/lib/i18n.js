// Server-side translation of the messages the API sends back (errors and
// a few notices). Routes keep throwing plain English; errorHandler()
// translates at the very end, based on the request's language.
//
// The language comes from the Accept-Language header, which the website
// sets on every call to the language the person picked.
// See docs/Features/Arabic and RTL.md
export const LANGS = ['en', 'ar'];

export function langOf(req) {
  return /^ar\b/i.test(req.get?.('accept-language') || '') ? 'ar' : 'en';
}

// API field names -> words people understand, in each language.
const FIELDS = {
  en: {
    accountType: 'Account type', budgetMax: 'Maximum budget', budgetMin: 'Minimum budget', businessName: 'Business name',
    businessRegNumber: 'Registration number', category: 'Category', city: 'City', code: 'Code', comment: 'Comment',
    conversationId: 'Conversation', country: 'Country', currency: 'Currency', currentPassword: 'Current password',
    dateOfBirth: 'Date of birth', decision: 'Decision', description: 'Details', displayName: 'Name', email: 'Email',
    idNumber: 'ID number', idType: 'ID type', legalName: 'Full legal name', listingId: 'Request', message: 'Message',
    neededBy: 'Needed by', note: 'Note', offerPrice: 'Price', password: 'Password', reason: 'Reason', stars: 'Stars',
    status: 'Status', title: 'Title', token: 'Link', avatar: 'Profile photo', bio: 'About you', interests: 'Interests', docFront: 'Front of ID', docBack: 'Back of ID', selfie: 'Selfie',
    businessDoc: 'Business registration document', images: 'Photos', language: 'Language', banned: 'banned',
  },
  ar: {
    accountType: 'نوع الحساب', budgetMax: 'الحد الأقصى للميزانية', budgetMin: 'الحد الأدنى للميزانية', businessName: 'الاسم التجاري',
    businessRegNumber: 'رقم السجل التجاري', category: 'الفئة', city: 'المدينة', code: 'الرمز', comment: 'التعليق',
    conversationId: 'المحادثة', country: 'الدولة', currency: 'العملة', currentPassword: 'كلمة المرور الحالية',
    dateOfBirth: 'تاريخ الميلاد', decision: 'القرار', description: 'التفاصيل', displayName: 'الاسم', email: 'البريد الإلكتروني',
    idNumber: 'رقم الهوية', idType: 'نوع الهوية', legalName: 'الاسم الكامل', listingId: 'الطلب', message: 'الرسالة',
    neededBy: 'تاريخ الحاجة', note: 'الملاحظة', offerPrice: 'السعر', password: 'كلمة المرور', reason: 'السبب', stars: 'عدد النجوم',
    status: 'الحالة', title: 'العنوان', token: 'الرابط', avatar: 'الصورة الشخصية', bio: 'نبذة عنك', interests: 'الاهتمامات', docFront: 'الوجه الأمامي للهوية', docBack: 'الوجه الخلفي للهوية',
    selfie: 'الصورة الشخصية', businessDoc: 'مستند السجل التجاري', images: 'الصور', language: 'اللغة', banned: 'banned',
  },
};
const field = (lang, f) => FIELDS[lang][f] ?? f;

// Exact messages -> Arabic.
const AR = {
  'Please log in first.': 'يُرجى تسجيل الدخول أولًا.',
  'This account has been suspended.': 'تم إيقاف هذا الحساب.',
  'Please verify your email address first.': 'يُرجى تأكيد بريدك الإلكتروني أولًا.',
  'You need to complete identity verification (KYC) first.': 'يجب عليك إكمال التحقق من الهوية أولًا.',
  'Admins only.': 'للمشرفين فقط.',
  'An account with this email already exists.': 'يوجد حساب بهذا البريد الإلكتروني بالفعل.',
  'Wrong email or password.': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'Email is already verified.': 'البريد الإلكتروني مؤكَّد بالفعل.',
  'This code has expired. Request a new one.': 'انتهت صلاحية هذا الرمز. اطلب رمزًا جديدًا.',
  'Too many wrong codes. Request a new one.': 'أدخلت رموزًا خاطئة كثيرة. اطلب رمزًا جديدًا.',
  'That code is not correct.': 'هذا الرمز غير صحيح.',
  "We couldn't send the email right now. Please try again in a minute.": 'تعذّر إرسال البريد الآن. يُرجى المحاولة بعد دقيقة.',
  'This reset link is invalid or has expired. Please request a new one.': 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يُرجى طلب رابط جديد.',
  'Your current password is not correct.': 'كلمة المرور الحالية غير صحيحة.',
  'Too many attempts. Please wait a few minutes.': 'محاولات كثيرة. يُرجى الانتظار بضع دقائق.',
  'If an account exists for that email, a reset link is on its way.': 'إذا كان هناك حساب بهذا البريد فسيصله رابط إعادة التعيين.',
  'Verify your email before identity verification.': 'أكّد بريدك الإلكتروني قبل التحقق من الهوية.',
  'Your verification is already being reviewed.': 'طلب التحقق الخاص بك قيد المراجعة بالفعل.',
  'You are already verified.': 'حسابك موثَّق بالفعل.',
  'This ID document is already linked to another account.': 'هذه الهوية مرتبطة بحساب آخر بالفعل.',
  'Minimum budget cannot be higher than maximum budget.': 'لا يمكن أن يكون الحد الأدنى للميزانية أعلى من الحد الأقصى.',
  'Only open requests can be edited.': 'يمكن تعديل الطلبات المفتوحة فقط.',
  'Only the person who posted this request can change it.': 'فقط صاحب هذا الطلب يمكنه تغييره.',
  'That conversation is not about this request.': 'هذه المحادثة لا تخص هذا الطلب.',
  'This deal has already been rated, so it can no longer be changed.': 'تم تقييم هذه الصفقة بالفعل، لذا لم يعد بالإمكان تغييرها.',
  'This request is no longer accepting offers.': 'هذا الطلب لم يعد يستقبل عروضًا.',
  'You cannot make an offer on your own request.': 'لا يمكنك تقديم عرض على طلبك.',
  'You already contacted this buyer about this request.': 'لقد تواصلت مع هذا المشتري بخصوص هذا الطلب بالفعل.',
  'This request is closed, so the conversation is read-only.': 'هذا الطلب مغلق، لذا المحادثة للقراءة فقط.',
  "This member's account has been suspended, so you can't message them.": 'تم إيقاف حساب هذا العضو، لذا لا يمكنك مراسلته.',
  'Say what you are reporting.': 'حدّد ما الذي تُبلغ عنه.',
  'You already rated this deal.': 'لقد قيّمت هذه الصفقة بالفعل.',
  'This submission was already reviewed.': 'تمت مراجعة هذا الطلب بالفعل.',
  'You cannot ban yourself.': 'لا يمكنك حظر نفسك.',
  'Choose up to 8 interests from the list.': 'اختر حتى 8 اهتمامات من القائمة.',
  "You can't save your own request.": 'لا يمكنك حفظ طلبك أنت.',
  'This browser sent an invalid notification subscription.': 'أرسل هذا المتصفح اشتراك إشعارات غير صالح.',
  'emailOffers must be true or false.': 'قيمة رسائل العروض يجب أن تكون true أو false.',
  'Notifications are not turned on for any of your devices yet.': 'الإشعارات غير مفعّلة على أي من أجهزتك بعد.',
  'banned must be true or false.': 'قيمة الحظر يجب أن تكون true أو false.',
  'Please enter a valid email address.': 'يُرجى إدخال بريد إلكتروني صحيح.',
  'Password needs at least 8 characters with letters and numbers.': 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل وتتضمن حروفًا وأرقامًا.',
  'Conversation not found.': 'المحادثة غير موجودة.',
  'Deal not found.': 'الصفقة غير موجودة.',
  'Member not found.': 'العضو غير موجود.',
  'Request not found.': 'الطلب غير موجود.',
  'This request does not exist or is no longer open.': 'هذا الطلب غير موجود أو لم يعد مفتوحًا.',
  'Not found': 'غير موجود',
  'File not found': 'الملف غير موجود',
  'Unknown API route': 'مسار غير معروف',
  'File is too large (max 5 MB).': 'الملف كبير جدًا (الحد الأقصى 5 ميغابايت).',
  'Too many files.': 'عدد الملفات كبير جدًا.',
  'Too many files, or an unexpected file field.': 'عدد الملفات كبير جدًا، أو أن هناك ملفًا غير متوقع.',
  'Too many form fields.': 'عدد الحقول كبير جدًا.',
  'A form field is too long.': 'أحد الحقول طويل جدًا.',
  'The request could not be read. Please try again.': 'تعذّرت قراءة الطلب. يُرجى المحاولة مرة أخرى.',
  'Something went wrong on our side.': 'حدث خطأ من جهتنا.',
};

// Messages built from a template (validators, uploads): [English pattern,
// function(lang, ...captured parts) -> message]. English output is also
// improved here (field labels instead of API names like "legalName").
const PATTERNS = [
  [/^(\w+) is required\.$/, (l, f) => (l === 'ar' ? `${field(l, f)} مطلوب.` : `${field(l, f)} is required.`)],
  [/^(\w+) must be at least (\d+) characters\.$/, (l, f, n) => (l === 'ar' ? `${field(l, f)}: ${n} أحرف على الأقل.` : `${field(l, f)} must be at least ${n} characters.`)],
  [/^(\w+) must be at most (\d+) characters\.$/, (l, f, n) => (l === 'ar' ? `${field(l, f)}: ${n} حرفًا كحد أقصى.` : `${field(l, f)} must be at most ${n} characters.`)],
  [/^(\w+) must be a whole number between (\d+) and (\d+)\.$/, (l, f, a, b) => (l === 'ar' ? `${field(l, f)} يجب أن يكون رقمًا صحيحًا بين ${a} و${b}.` : `${field(l, f)} must be a whole number between ${a} and ${b}.`)],
  [/^(\w+) must be one of: (.+)\.$/, (l, f, list) => (l === 'ar' ? `قيمة ${field(l, f)} غير صالحة.` : `${field(l, f)} must be one of: ${list}.`)],
  [/^(\w+) must be a date like 2026-01-31\.$/, (l, f) => (l === 'ar' ? `${field(l, f)} يجب أن يكون تاريخًا صحيحًا.` : `${field(l, f)} must be a valid date.`)],
  [/^Please upload (\w+)\.$/, (l, f) => (l === 'ar' ? `يُرجى رفع: ${field(l, f)}.` : `Please upload: ${field(l, f)}.`)],
  [/^"(\w+)" must be a JPG, PNG or WEBP image( or a PDF)?\.$/, (l, f, pdf) => (l === 'ar'
    ? `${field(l, f)}: يجب أن يكون صورة JPG أو PNG أو WEBP${pdf ? ' أو ملف PDF' : ''}.`
    : `${field(l, f)} must be a JPG, PNG or WEBP image${pdf ? ' or a PDF' : ''}.`)],
  [/^You must be at least (\d+) years old\.$/, (l, n) => (l === 'ar' ? `يجب أن يكون عمرك ${n} عامًا على الأقل.` : `You must be at least ${n} years old.`)],
  [/^A request can have at most (\d+) photos\.$/, (l, n) => (l === 'ar' ? `يمكن أن يحتوي الطلب على ${n} صور كحد أقصى.` : `A request can have at most ${n} photos.`)],
  [/^Ratings can only be left within (\d+) days of the deal\.$/, (l, n) => (l === 'ar' ? `لا يمكن التقييم إلا خلال ${n} يومًا من الصفقة.` : `Ratings can only be left within ${n} days of the deal.`)],
];

export function translateMessage(message, lang) {
  if (typeof message !== 'string') return message;
  for (const [re, make] of PATTERNS) {
    const m = message.match(re);
    if (m) return make(lang, ...m.slice(1));
  }
  return lang === 'ar' ? AR[message] ?? message : message;
}

// For tests: every exact message has an Arabic version.
export const _arabicMessages = AR;
