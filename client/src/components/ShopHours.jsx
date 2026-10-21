// Opening hours on a shop page, with "Open now" (session 24).
import { openState } from '../hours.js';
import { formatDate, t } from '../i18n.jsx';

// 18 Oct 2026 was a Sunday: day d of the week is 18 + d.
export const dayName = (d, style = 'long') => formatDate(new Date(2026, 9, 18 + d), { weekday: style });

export function OpenNow({ hours }) {
  const s = openState(hours);
  if (!s) return null;
  if (s.open) return <span className="open-now">{t('Open now · until {time}', { time: s.until })}</span>;
  if (!s.next) return <span className="closed-now">{t('Closed')}</span>;
  const today = new Date().getDay() === s.next.day;
  return (
    <span className="closed-now">
      {today ? t('Closed now · opens at {time}', { time: s.next.time }) : t('Closed now · opens {day} {time}', { day: dayName(s.next.day), time: s.next.time })}
    </span>
  );
}

export default function ShopHours({ hours }) {
  if (!Array.isArray(hours)) return null;
  const today = new Date().getDay();
  return (
    <div className="card shop-hours">
      <div className="row spread">
        <h2 style={{ margin: 0 }}>{t('Opening hours')}</h2>
        <OpenNow hours={hours} />
      </div>
      <table>
        <tbody>
          {hours.map((h, d) => (
            <tr key={d} className={d === today ? 'today' : ''}>
              <th scope="row">{dayName(d)}</th>
              <td className="ltr">{h ? `${h.open} – ${h.close}` : <span className="muted">{t('Closed')}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
