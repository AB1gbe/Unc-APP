import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { RequireAdmin, RequireAuth, RequireVerified } from './components/ui.jsx';
import Browse from './pages/Browse.jsx';
import Home from './pages/Home.jsx';
import { useAuth } from './auth.jsx';
import ListingDetail from './pages/ListingDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import NotFound from './pages/NotFound.jsx';

// Pages most visitors never open (admin, chat, forms) are split into their
// own files and only downloaded when first visited. The loading fallback is
// in Layout.jsx so the header stays visible meanwhile.
const NewListing = lazy(() => import('./pages/NewListing.jsx'));
const MyListings = lazy(() => import('./pages/MyListings.jsx'));
const Inbox = lazy(() => import('./pages/Inbox.jsx'));
const Conversation = lazy(() => import('./pages/Conversation.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail.jsx'));
const Verification = lazy(() => import('./pages/Verification.jsx'));
const Account = lazy(() => import('./pages/Account.jsx'));
const Welcome = lazy(() => import('./pages/Welcome.jsx'));
const Notifications = lazy(() => import('./pages/Notifications.jsx'));
const Alerts = lazy(() => import('./pages/Alerts.jsx'));
const Saved = lazy(() => import('./pages/Saved.jsx'));
const MemberProfile = lazy(() => import('./pages/MemberProfile.jsx'));
const AdminHome = lazy(() => import('./pages/admin/AdminHome.jsx'));
const KycReview = lazy(() => import('./pages/admin/KycReview.jsx'));

// Members land on their personal home; visitors see the request list.
function HomeOrBrowse() {
  const { user } = useAuth();
  return user ? <Home /> : <Browse />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomeOrBrowse />} />
        <Route path="browse" element={<Browse />} />
        <Route path="requests/new" element={<RequireAuth><RequireVerified action="post"><NewListing /></RequireVerified></RequireAuth>} />
        <Route path="requests/:id" element={<ListingDetail />} />
        <Route path="requests/:id/edit" element={<RequireAuth><RequireVerified action="edit"><NewListing /></RequireVerified></RequireAuth>} />
        <Route path="my-requests" element={<RequireAuth><MyListings /></RequireAuth>} />
        <Route path="notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
        <Route path="alerts" element={<RequireAuth><Alerts /></RequireAuth>} />
        <Route path="saved" element={<RequireAuth><Saved /></RequireAuth>} />
        <Route path="messages" element={<RequireAuth><Inbox /></RequireAuth>} />
        <Route path="messages/:id" element={<RequireAuth><Conversation /></RequireAuth>} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="verify-email" element={<RequireAuth><VerifyEmail /></RequireAuth>} />
        <Route path="welcome" element={<RequireAuth><Welcome /></RequireAuth>} />
        <Route path="verification" element={<RequireAuth><Verification /></RequireAuth>} />
        <Route path="members/:id" element={<MemberProfile />} />
        <Route path="account" element={<RequireAuth><Account /></RequireAuth>} />
        <Route path="admin" element={<RequireAdmin><AdminHome /></RequireAdmin>} />
        <Route path="admin/kyc/:id" element={<RequireAdmin><KycReview /></RequireAdmin>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
