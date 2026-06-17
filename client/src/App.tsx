import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { PostsPage } from './pages/PostsPage';
import { CalendarPage } from './pages/CalendarPage';
import { PostEditorPage } from './pages/PostEditorPage';
import { BulkUploadPage } from './pages/BulkUploadPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { HelpPage } from './pages/HelpPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { BlogPage } from './pages/BlogPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { ProtectedRoute } from './lib/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />

      <Route path="/app" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/app/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/app/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/app/channels" element={<ProtectedRoute><ChannelsPage /></ProtectedRoute>} />
      <Route path="/app/posts" element={<ProtectedRoute><PostsPage /></ProtectedRoute>} />
      <Route path="/app/posts/new" element={<ProtectedRoute><PostEditorPage /></ProtectedRoute>} />
      <Route path="/app/posts/:id" element={<ProtectedRoute><PostEditorPage /></ProtectedRoute>} />
      <Route path="/app/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/app/bulk-upload" element={<ProtectedRoute><BulkUploadPage /></ProtectedRoute>} />
      <Route path="/app/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
