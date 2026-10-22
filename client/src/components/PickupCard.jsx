// After a price is accepted (session 37): a pickup checklist for this kind
// of item, and for big amounts a safety card. Ticks are kept on this
// device only (they are private notes, not shared with the other person).
import { useState } from 'react';
import { money } from '../api.js';
import { t } from '../i18n.jsx';
import { checklistFor, isBigDeal } from '../pickup.js';

const ITEMS = {
  imei: () => t('The IMEI in Settings matches the box (dial *#06#)'),
  unlocked: () => t('“Find My” / Google account is signed out, and it isn’t locked to a network'),
  battery: () => t('Battery health is OK and it charges'),
  screenCamera: () => t('Screen, cameras, speakers and buttons all work'),
  boxReceipt: () => t('Box, charger and receipt or warranty card (if promised)'),
  powerOn: () => t('Switch it on and try the main functions'),
  allParts: () => t('All parts, cables and remotes are there'),
  serial: () => t('The serial number matches the box or receipt'),
  specs: () => t('Processor, memory and storage match the offer'),
  signedOut: () => t('The old owner’s accounts are signed out'),
  measure: () => t('Measure it, and the door or space it must fit through'),
  damage: () => t('Look for damage, stains, rust or leaks'),
  transport: () => t('Plan how to carry it home (car size, helpers)'),
  partNumber: () => t('The part number matches what you need'),
  fits: () => t('It fits your make, model and year (check with your VIN)'),
  scope: () => t('Agree in the chat exactly what will be done'),
  timeAndPrice: () => t('Agree the time, the total price and what happens if it takes longer'),
  asDescribed: () => t('It matches the photos and description in the chat'),
  publicPlace: () => t('Meet in a busy public place, in daylight if you can'),
  payWhenHappy: () => t('Pay only when you have checked it and are happy'),
};

function readTicks(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

export default function PickupCard({ convId, category, price, currency }) {
  const key = `unc:pickup:${convId}`;
  const [ticks, setTicks] = useState(() => readTicks(key));
  const items = checklistFor(category);
  const toggle = (k) => {
    const next = ticks.includes(k) ? ticks.filter((x) => x !== k) : [...ticks, k];
    setTicks(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* private mode: ticks just aren't kept */ }
  };

  return (
    <div className="pickup">
      {isBigDeal(price, currency) && (
        <div className="big-deal" role="note">
          <b>{t('🛡️ Big deal: {price}', { price: money(price, currency) })}</b>
          <ul>
            <li>{t('Meet at a bank, a mall service desk or a police station’s safe meeting spot.')}</li>
            <li>{t('Check ID and papers (receipt, warranty, ownership) before paying.')}</li>
            <li>{t('Pay in a way that leaves a record, not cash in a car park.')}</li>
            <li>{t('Bring someone with you if you can.')}</li>
          </ul>
        </div>
      )}
      <details>
        <summary><b>{t('✅ Pickup checklist')}</b> <span className="muted small">{t('{done} of {total} checked', { done: items.filter((k) => ticks.includes(k)).length, total: items.length })}</span></summary>
        <p className="small muted" style={{ margin: '.3rem 0' }}>{t('Only you see these ticks, on this device.')}</p>
        {items.map((k) => (
          <label key={k} className="pickup-item">
            <input type="checkbox" checked={ticks.includes(k)} onChange={() => toggle(k)} />
            <span>{ITEMS[k]()}</span>
          </label>
        ))}
      </details>
    </div>
  );
}
