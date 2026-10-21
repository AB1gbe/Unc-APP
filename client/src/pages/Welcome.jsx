// Welcome step after confirming the email: add a photo, a few words and
// interests, so the member isn't just a name. Skippable; either way it is
// not shown again (POST /auth/onboarded).
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import ProfileEditor from '../components/ProfileEditor.jsx';
import { t, tj } from '../i18n.jsx';
import { Steps } from './VerifyEmail.jsx';

export default function Welcome() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  if (!user.emailVerified) return <Navigate to="/verify-email" replace />;

  async function finish() {
    const { user: u } = await api('/auth/onboarded', { method: 'POST' });
    setUser(u);
    navigate(u.kycStatus === 'approved' ? '/' : '/verification');
  }

  return (
    <div className="narrow" style={{ maxWidth: 680 }}>
      <Steps current={2} />
      <div className="card">
        <h1>{tj('Welcome, {name}!', { name: <bdi>{user.displayName}</bdi> })}</h1>
        <p className="muted">{t('Members with a photo and a few words get more replies. It takes a minute, and you can change it any time.')}</p>
        <ProfileEditor
          onSaved={finish}
          submitLabel={t('Save and continue')}
          extraButton={<button type="button" className="btn secondary" onClick={finish}>{t('Skip for now')}</button>}
        />
      </div>
    </div>
  );
}
