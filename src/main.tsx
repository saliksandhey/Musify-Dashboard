import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import "./index.css";
import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";
import PageLoader from "@/components/ui/PageLoader";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

// Lazy load exact pages
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ArtistsPage = lazy(() => import("@/pages/ArtistsPage"));
const AlbumsPage = lazy(() => import("@/pages/AlbumsPage"));
const SongsPage = lazy(() => import("@/pages/SongsPage"));
const PlaylistsPage = lazy(() => import("@/pages/PlaylistsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const BrowseArtistPage = lazy(() => import("@/pages/BrowseArtistPage"));
const BulkUploadPage = lazy(() => import("@/pages/BulkUploadPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/login",
    errorElement: <ErrorBoundary />,
    element: (
      <AuthLayout>
        <Suspense fallback={<PageLoader />}>
          <LoginPage />
        </Suspense>
      </AuthLayout>
    ),
  },
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: "dashboard",
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: "artists",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ArtistsPage />
          </Suspense>
        ),
      },
      {
        path: "albums",
        element: (
          <Suspense fallback={<PageLoader />}>
            <AlbumsPage />
          </Suspense>
        ),
      },
      {
        path: "songs",
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <SongsPage />
              </Suspense>
            ),
          },
          {
            path: "bulk-upload",
            element: (
              <Suspense fallback={<PageLoader />}>
                <BulkUploadPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "playlists",
        element: (
          <Suspense fallback={<PageLoader />}>
            <PlaylistsPage />
          </Suspense>
        ),
      },
      {
        path: "browse",
        element: (
          <Suspense fallback={<PageLoader />}>
            <BrowseArtistPage />
          </Suspense>
        ),
      },
      {
        path: "settings",
        element: (
          <Suspense fallback={<PageLoader />}>
            <SettingsPage />
          </Suspense>
        ),
      },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#16161F",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#f1f1f5",
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>
);
