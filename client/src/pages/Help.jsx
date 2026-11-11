// Get Help (session 60, Siin idea #6). Siin sends people to WhatsApp for
// help; Unc keeps it in the app: answers to common questions, then
// "Contact the Unc team" for anything else. Questions go only to the Unc
// team (admins), never to other members, and replies arrive with a 🔔.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ago, api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ErrorBox } from '../components/ui.jsx';
import { useApi } from '../hooks.js';
import { t } from '../i18n.jsx';
import { art } from '../art.js';

const FAQ = () => [
  ['start', t('Getting started'), [
    [t('What is Unc?'), t('Unc turns shopping around: you post what you need, and verified shops and finders in Bahrain come to you with offers. You choose the best one.')],
    [t('Why do I need to verify my identity?'), t('So everyone you deal with is a real, checked person or shop. You need it to post requests and make offers; browsing is open to all.')],
    [t('How long does verification take?'), t('Usually within a day. You get a 🔔 when it is done. Clear photos of your ID and a selfie in good light make it faster.')],
  ]],
  ['offers', t('Offers and deals'), [
    [t('How do sellers contact me?'), t('Only about a request you posted, inside that request’s chat. Nobody can message you out of nowhere.')],
    [t('How do I choose an offer?'), t('Open your request and use Compare offers to see prices, ratings and reply times side by side. Then accept the one you like in its chat.')],
    [t('Why are phone numbers hidden in chat?'), t('Until a price is agreed, Unc hides phone numbers and links so deals stay safe and on record. After you agree, you can arrange the hand-over.')],
  ]],
  ['safety', t('Safety'), [
    [t('Something feels wrong. What do I do?'), t('Use ⚑ Report on the request or in the chat, and Block if you want no more contact. The Unc team reviews every report.')],
    [t('Should I pay before I see the item?'), t('Meet in a public place and check the item first, or use a plan agreed on Unc. Never send money to someone who pushes you to leave the app.')],
  ]],
  ['payments', t('Payments and paying in parts'), [
    [t('Why does Unc ask for a card?'), t('A card on file keeps fake accounts out. In this preview no money is taken.')],
    [t('Can I pay in parts?'), t('Yes, if the seller agrees: propose a plan in the chat after a price is agreed. Unc keeps the record and reminds you of each part.')],
  ]],
  ['account', t('Account and data'), [
    [t('How do I change my password?'), t('Go to Account. You can change your password there, or use “Forgot password?” on the sign-in page.')],
    [t('How do I download or delete my data?'), t('Go to Account → Your data. Deleting waits 7 days so you can change your mind.')],
  ]],
];

const TOPICS = ['account', 'verification', 'offers', 'payments', 'safety', 'other'];
export const topicLabel = (k) => ({
  account: t('My account'), verification: t('Identity check'), offers: t('Offers and deals'),
  payments: t('Payments'), safety: t('Safety or a report'), other: t('Something else'),
}[k]);
const STATUS = () => ({ open: t('Waiting for the team'), answered: t('Answered'), closed: t('Closed') });

function Ticket({ ticket, onChange }) {
  const [reply, setReply] = useState('');
  const [error, setError] = useState(null);
  async function send(e) {
    e.preventDefault();
    setError(null);
    try { onChange((await api(`/support/${ticket.id}/messages`, { method: 'POST', body: { message: reply } })).ticket); setReply(''); } catch (err) { setError(err); }
  }
  async function close() {
    try { onChange((await api(`/support/${ticket.id}/close`, { method: 'POST' })).ticket); } catch (err) { setError(err); }
  }
  return (
    <div className="card help-ticket">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong>{topicLabel(ticket.topic)}</strong>
        <span className={`badge ${ticket.status === 'answered' ? 'ok' : ''}`}>{STATUS()[ticket.status]}</span>
      </div>
      {ticket.messages.map((m, i) => (
        <div key={i} className={`help-msg ${m.fromTeam ? 'team' : ''}`}>
          <div className="small muted">{m.fromTeam ? t('Unc team') : t('You')} · {ago(m.createdAt)}</div>
          <div dir="auto" className="help-body">{m.body}</div>
        </div>
      ))}
      <ErrorBox error={error} />
      {ticket.status !== 'closed' && (
        <form onSubmit={send} className="stack" style={{ gap: '.5rem' }}>
          <textarea aria-label={t('Add a message')} rows={2} maxLength={2000} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t('Add a message')} />
          <div className="row">
            <button className="btn sm" disabled={reply.trim().length < 2}>{t('Send')}</button>
            <button type="button" className="btn sm secondary" onClick={close}>{t('My question is solved')}</button>
          </div>
        </form>
      )}
    </div>
  );
}

function Contact() {
  const { data, error, reload } = useApi('/support');
  const [topic, setTopic] = useState('other');
  const [message, setMessage] = useState('');
  const [sendError, setSendError] = useState(null);
  const [sent, setSent] = useState(false);
  const tickets = data?.tickets ?? [];
  const update = () => reload();

  async function submit(e) {
    e.preventDefault();
    setSendError(null);
    try {
      await api('/support', { method: 'POST', body: { topic, message } });
      reload();
      setMessage('');
      setSent(true);
    } catch (err) { setSendError(err); }
  }

  return (
    <>
      <form className="card stack" onSubmit={submit} id="contact">
        <div className="help-team">
          <img src={art('help-team.jpg')} alt="" width="72" height="72" />
          <div>
            <h2 style={{ margin: 0 }}>{t('Contact the Unc team')}</h2>
            <p className="muted small" style={{ margin: 0 }}>{t('Only the Unc team sees your question. We usually answer within a day, and you get a 🔔 when we do.')}</p>
          </div>
        </div>
        <label htmlFor="helpTopic">{t('What is it about?')}</label>
        <select id="helpTopic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          {TOPICS.map((k) => <option key={k} value={k}>{topicLabel(k)}</option>)}
        </select>
        <label htmlFor="helpMessage">{t('Your question')}</label>
        <textarea id="helpMessage" rows={4} maxLength={2000} value={message} onChange={(e) => { setMessage(e.target.value); setSent(false); }}
          placeholder={t('Tell us what happened. Add the request title if it is about one.')} />
        <ErrorBox error={sendError} />
        {sent && <p className="badge ok" role="status">{t('Sent ✓ The Unc team will answer here.')}</p>}
        <div><button className="btn" disabled={message.trim().length < 10}>{t('Send to the Unc team')}</button></div>
      </form>
      <ErrorBox error={error} />
      {tickets.length > 0 && <h2>{t('Your questions')}</h2>}
      {tickets.map((tk) => <Ticket key={tk.id} ticket={tk} onChange={update} />)}
    </>
  );
}

export default function Help() {
  const { user } = useAuth();
  return (
    <div className="narrow stack" style={{ maxWidth: 680 }}>
      <div className="hero hero-art help-hero">
        <div className="hero-text">
          <h1>{t('❓ Get help')}</h1>
          <p>{t('Answers to common questions. Can’t find yours? Ask the Unc team below, right here in the app.')}</p>
          <a className="btn" href="#contact">{t('Contact the Unc team')}</a>
        </div>
      </div>
      <nav className="help-topics" aria-label={t('Help topics')}>
        {FAQ().map(([slug, section]) => (
          <a key={slug} href={`#help-${slug}`} className="help-topic">
            <img src={art(`help-${slug}.jpg`)} alt="" loading="lazy" width="360" height="270" />
            <span>{section}</span>
          </a>
        ))}
      </nav>
      {FAQ().map(([slug, section, items]) => (
        <section key={slug} id={`help-${slug}`} className="card help-faq">
          <div className="help-faq-head">
            <img src={art(`help-${slug}.jpg`)} alt="" loading="lazy" width="96" height="72" />
            <h2>{section}</h2>
          </div>
          {items.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
      ))}
      {user ? <Contact /> : (
        <div className="card" id="contact">
          <div className="help-team">
            <img src={art('help-team.jpg')} alt="" width="72" height="72" />
            <h2 style={{ margin: 0 }}>{t('Contact the Unc team')}</h2>
          </div>
          <p>{t('Sign in to ask the Unc team a question. Locked out? Use “Forgot password?” on the sign-in page.')}</p>
          <Link className="btn" to="/login">{t('Log in')}</Link>
        </div>
      )}
    </div>
  );
}
