import { Suspense, lazy } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import { NotFound, PageLoader } from "@/components/TitleHero";
import HomePage from "@/pages/HomePage";

const BrowsePage = lazy(() => import("@/pages/BrowsePage"));
const TitlePage = lazy(() => import("@/pages/TitlePage"));
const AnimeTitlePage = lazy(() => import("@/pages/AnimeTitlePage"));
const WatchPage = lazy(() => import("@/pages/WatchPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const MyListPage = lazy(() => import("@/pages/MyListPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const ClerkShell = lazy(() => import("@/pages/AuthPages").then((m) => ({ default: m.ClerkShell })));
const SignInPage = lazy(() => import("@/pages/AuthPages").then((m) => ({ default: m.SignInPage })));
const SignUpPage = lazy(() => import("@/pages/AuthPages").then((m) => ({ default: m.SignUpPage })));

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="movies" element={<BrowsePage type="movie" />} />
              <Route path="tv" element={<BrowsePage type="tv" />} />
              <Route path="anime" element={<BrowsePage type="anime" />} />
              <Route path="movie/:id/:slug?" element={<TitlePage key="movie" type="movie" />} />
              <Route path="tv/:id/:slug?" element={<TitlePage key="tv" type="tv" />} />
              <Route path="anime/:id/:slug?" element={<AnimeTitlePage />} />
              <Route path="watch/movie/:id" element={<WatchPage key="wm" type="movie" />} />
              <Route path="watch/tv/:id" element={<WatchPage key="wt" type="tv" />} />
              <Route path="watch/anime/:id" element={<WatchPage key="wa" type="anime" />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="my-list" element={<MyListPage />} />
              <Route element={<ClerkShell />}>
                <Route path="admin" element={<AdminPage />} />
                <Route path="sign-in/*" element={<SignInPage />} />
                <Route path="sign-up/*" element={<SignUpPage />} />
              </Route>
              <Route path="*" element={<NotFound text="This page doesn't exist." />} />
            </Route>
          </Routes>
        </Suspense>
        <Toaster position="top-center" theme="dark" richColors />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
