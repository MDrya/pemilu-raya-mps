import { createBrowserRouter } from 'react-router'
import RequireRole from './components/RequireRole'
import BilikPage from './pages/BilikPage'
import BoothPickerPage from './pages/BoothPickerPage'
import ErrorPage from './pages/ErrorPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import PanitiaPage from './pages/PanitiaPage'
import PublicPage from './pages/PublicPage'

export const router = createBrowserRouter([
  {
    // Pathless parent so every page shares the friendly error screen.
    errorElement: <ErrorPage />,
    children: [
      { path: '/', element: <PublicPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/panitia', element: <RequireRole role="panitia"><PanitiaPage /></RequireRole> },
      { path: '/bilik', element: <RequireRole role="bilik"><BoothPickerPage /></RequireRole> },
      { path: '/bilik/:id', element: <RequireRole role="bilik"><BilikPage /></RequireRole> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
