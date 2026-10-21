// Translations and right-to-left support.
//
//   t('Post a request')                      -> "أضف طلبًا" in Arabic
//   t('Posted {time}', { time })             -> fills in {time}
//   tn(count, '{n} offer', '{n} offers')     -> correct plural in each language
//
// The ENGLISH text is the key: if an Arabic translation is missing, English
// is shown instead of a blank. `server/test/i18n-coverage.test.js` fails if
// any t()/tn() text in client/src has no Arabic entry in locales/ar.js.
// See docs/Features/Arabic and RTL.md
import { createContext, Fragment, useContext, useEffect, useState } from 'react';
import ar from './locales/ar.js';

export const LANGUAGES = { en: 'English', ar: 'العربية' };
const STORAGE_KEY = 'unc.language';

let current = 'en';
export const getLang = () => current;

// Locale for dates and numbers. Arabic keeps Western digits (123), which is
// what Bahraini apps and price tags normally use (see ADR-017).
export const locale = () => (current === 'ar' ? 'ar-BH-u-nu-latn' : undefined);

function fill(text, vars) {
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : text;
}

export function t(text, vars) {
  const translated = current === 'ar' && typeof ar[text] === 'string' ? ar[text] : text;
  return fill(translated, vars);
}

// Like t(), but {placeholders} can be React elements (links, bold text):
//   tj('{login} or {register} to continue', { login: <Link…/>, register: <Link…/> })
// Needed because word order differs between languages, so a sentence can't
// be glued together from separately translated pieces.
export function tj(text, parts) {
  const translated = current === 'ar' && typeof ar[text] === 'string' ? ar[text] : text;
  return translated.split(/(\{\w+\})/).map((piece, i) => {
    const m = piece.match(/^\{(\w+)\}$/);
    return m && m[1] in parts ? <Fragment key={i}>{parts[m[1]]}</Fragment> : piece;
  });
}

// Plurals. English has 2 forms; Arabic has up to 6 (zero, one, two, few,
// many, other), chosen by Intl.PluralRules. ar.js stores them as an object
// under the English plural text.
export function tn(n, one, other, vars = {}) {
  const all = { n, ...vars };
  if (current === 'ar' && ar[other] && typeof ar[other] === 'object') {
    const forms = ar[other];
    const form = forms[new Intl.PluralRules('ar').select(n)] ?? forms.other;
    return fill(form, all);
  }
  return fill(n === 1 ? one : other, all);
}

// Has the person picked a language on THIS device (vs. the browser default)?
export function hasSavedChoice() {
  try {
    return localStorage.getItem(STORAGE_KEY) in LANGUAGES;
  } catch {
    return false;
  }
}

function initialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved in LANGUAGES) return saved;
  } catch {
    // storage can be blocked (private mode); fall through
  }
  return navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

function apply(lang) {
  current = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = t('Unc — Ask for it. Get offers.');
}

const LanguageContext = createContext({ lang: 'en', setLang: () => {} });

export function LanguageProvider({ children, onChange }) {
  const [lang, setLangState] = useState(() => {
    const l = initialLanguage();
    apply(l); // before the first render, so the first paint is already right
    return l;
  });

  useEffect(() => apply(lang), [lang]);

  function setLang(next) {
    if (!(next in LANGUAGES) || next === lang) return;
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // not remembered, but still switched
    }
    setLangState(next);
    onChange?.(next);
  }

  // key={lang}: switching language re-creates the page so every t() call
  // runs again in the new language. Simpler than making each component
  // subscribe; switching is rare. (Forms being filled are reset.)
  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <Fragment key={lang}>{children}</Fragment>
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);

// Date helpers in the current language.
export const formatDate = (d, opts) => d.toLocaleDateString(locale(), opts);
export const formatDateTime = (d, opts) => d.toLocaleString(locale(), opts);
