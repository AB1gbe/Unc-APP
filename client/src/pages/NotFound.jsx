import { Link } from 'react-router-dom';
import { t } from '../i18n.jsx';

export default function NotFound() {
  return (
    <div className="card empty">
      <h1>{t('Page not found')}</h1>
      <Link to="/">{t('Back to browsing')}</Link>
    </div>
  );
}
