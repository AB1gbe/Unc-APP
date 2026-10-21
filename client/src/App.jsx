import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { RequireAdmin, RequireAuth, RequireVerified } from './components/ui.jsx';
import Browse from './pages/Browse.jsx';
import ListingDetail from './pages/ListingDetail.jsx';
import NewListing from './pages/NewListing.jsx';
import MyListings from './pages/MyListings.jsx';
import Inbox from './pages/Inbox.jsx';
import Conversation from './pages/Conversation.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import Verification from './pages/Verification.jsx';
import Account from './pages/Account.jsx';
import AdminHome from './pages/admin/AdminHome.jsx';
import KycReview from './pages/admin/KycReview.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Browse />} />
        <Route path="requests/new" element={<RequireAuth><RequireVerified action="post a request"><NewListing /></RequireVerified></RequireAuth>} />
        <Route path="requests/:id" element={<ListingDetail />} />
        <Route path="requests/:id/edit" element={<RequireAuth><RequireVerified action="edit a request"><NewListing /></RequireVerified></RequireAuth>} />
        <Route path="my-requests" element={<RequireAuth><MyListings /></RequireAuth>} />
        <Route path="messages" element={<RequireAuth><Inbox /></RequireAuth>} />
        <Route path="messages/:id" element={<RequireAuth><Conversation /></RequireAuth>} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="verify-email" element={<RequireAuth><VerifyEmail /></RequireAuth>} />
        <Route path="verification" element={<RequireAuth><Verification /></RequireAuth>} />
        <Route path="account" element={<RequireAuth><Account /></RequireAuth>} />
        <Route path="admin" element={<RequireAdmin><AdminHome /></RequireAdmin>} />
        <Route path="admin/kyc/:id" element={<RequireAdmin><KycReview /></RequireAdmin>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
