import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import Home from './pages/Home'
import WelcomePage, { WELCOMED_KEY } from './pages/WelcomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SearchPage from './pages/SearchPage'
import MapPage from './pages/MapPage'
import GovernoratePage from './pages/GovernoratePage'
import PlacePage from './pages/PlacePage'
import CollectPage from './pages/CollectPage'
import PassportPage from './pages/PassportPage'
import RewardPage from './pages/RewardPage'
import GuidesPage from './pages/GuidesPage'
import GuideDetailPage from './pages/GuideDetailPage'
import BookGuidePage from './pages/BookGuidePage'
import GuideInboxPage from './pages/GuideInboxPage'
import GuideProfilePage from './pages/GuideProfilePage'
import InsightsPage from './pages/InsightsPage'
import PracticalPage from './pages/PracticalPage'
import TripsPage from './pages/TripsPage'
import TripDetailPage from './pages/TripDetailPage'
import TripBuilderPage from './pages/TripBuilderPage'
import BookingsPage from './pages/BookingsPage'
import ReviewPage from './pages/ReviewPage'
import GroupsPage from './pages/GroupsPage'
import GroupDetailPage from './pages/GroupDetailPage'
import CreateGroupPage from './pages/CreateGroupPage'
import UpdatesPage from './pages/UpdatesPage'
import ProfilePage from './pages/ProfilePage'
import AdminSetupPage from './pages/AdminSetupPage'
import AdminPlacePage from './pages/AdminPlacePage'
import NotFoundPage from './pages/NotFoundPage'

// First visit as a guest shows the welcome screen once; after that Discover opens directly.
function FirstRun({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated && !localStorage.getItem(WELCOMED_KEY)) return <Navigate to="/welcome" replace />
  return children
}

function LegacyGovernorate() {
  const { id } = useParams()
  return <Navigate to={`/cities/${id}`} replace />
}

const tourist = (el) => <ProtectedRoute roles={['Tourist']}>{el}</ProtectedRoute>

export default function App() {
  return (
    <Routes>
      {/* Pages with the tab bar */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<FirstRun><Home /></FirstRun>} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/cities/:id" element={<GovernoratePage />} />
        <Route path="/governorates/:id" element={<LegacyGovernorate />} />
        <Route path="/passport" element={<PassportPage />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/bookings" element={tourist(<BookingsPage />)} />
        <Route path="/guide/bookings" element={<ProtectedRoute roles={['Guide']}><GuideInboxPage /></ProtectedRoute>} />
        <Route path="/practical" element={<PracticalPage />} />
        <Route path="/updates" element={<ProtectedRoute><UpdatesPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin/setup" element={<AdminSetupPage />} />
        <Route path="/admin/places/new" element={<ProtectedRoute roles={['Admin']}><AdminPlacePage /></ProtectedRoute>} />
        <Route path="/admin/insights" element={<ProtectedRoute roles={['Admin']}><InsightsPage /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute roles={['Admin']}><GuideInboxPage mode="trips" /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Focused pages: their own bottom action bar replaces the tab bar on phones */}
      <Route element={<MainLayout tabs={false} />}>
        <Route path="/places/:id" element={<PlacePage />} />
        <Route path="/guides/:id" element={<GuideDetailPage />} />
        <Route path="/guides/:id/book" element={tourist(<BookGuidePage />)} />
        <Route path="/guide/profile" element={<ProtectedRoute roles={['Guide']}><GuideProfilePage /></ProtectedRoute>} />
        <Route path="/trips/new" element={tourist(<TripBuilderPage />)} />
        <Route path="/trips/:id" element={<TripDetailPage />} />
        <Route path="/groups/new" element={<ProtectedRoute roles={['Tourist', 'Agency']}><CreateGroupPage /></ProtectedRoute>} />
        <Route path="/groups/:id" element={<GroupDetailPage />} />
        <Route path="/bookings/:id/review" element={tourist(<ReviewPage />)} />
      </Route>

      {/* Full-screen pages */}
      <Route element={<AuthLayout />}>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/places/:id/collect" element={tourist(<CollectPage />)} />
        <Route path="/rewards/:id" element={tourist(<RewardPage />)} />
      </Route>
    </Routes>
  )
}
