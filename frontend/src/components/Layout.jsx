import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Search, Home, Film, Tv, Sparkles, Heart } from "lucide-react";
import { LiveCounter } from "@/components/LiveCounter";
import { ShareButton } from "@/components/ShareButton";
import { AdSlot } from "@/components/AdSlot";

const NAV = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/movies", label: "Movies", icon: Film },
  { to: "/tv", label: "TV Shows", icon: Tv },
  { to: "/anime", label: "Anime", icon: Sparkles },
  { to: "/my-list", label: "My List", icon: Heart },
];

export const Logo = () => (
  <Link to="/" className="font-display text-xl font-black tracking-tight sm:text-2xl" data-testid="logo-link">
    <span className="text-[var(--brand)]">CINE</span>STREAM
  </Link>
);

const Header = () => {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 30);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-[background-color,backdrop-filter] duration-300 ${solid ? "bg-[#0a0a0c]/85 backdrop-blur-xl" : "bg-gradient-to-b from-black/80 to-transparent"}`} data-testid="site-header">
      <div className="flex h-14 items-center gap-6 px-4 sm:h-16 sm:px-8 lg:px-14">
        <Logo />
        <nav className="hidden items-center gap-5 md:flex">
          {[...NAV.slice(0, 4), { to: "/discover", label: "Discover" }, NAV[4]].map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} data-testid={`nav-${label.toLowerCase().replace(/\s/g, "-")}`}
              className={({ isActive }) => `text-sm transition-colors ${isActive ? "font-semibold text-white" : "text-gray-400 hover:text-gray-200"}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <LiveCounter />
          <Link to="/search" aria-label="Search" className="rounded-full p-2 transition-colors hover:bg-white/10" data-testid="header-search-button">
            <Search size={20} />
          </Link>
          <ShareButton iconOnly url={window.location.origin} testId="header-share-site" className="hidden rounded-full p-2 transition-colors hover:bg-white/10 sm:block" />
        </div>
      </div>
    </header>
  );
};

const BottomNav = () => (
  <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-[#0a0a0c]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" data-testid="bottom-nav">
    <div className="grid grid-cols-5">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} data-testid={`bottom-nav-${label.toLowerCase().replace(/\s/g, "-")}`}
          className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${isActive ? "text-white" : "text-gray-500"}`}>
          {({ isActive }) => (
            <>
              <Icon size={20} className={isActive ? "text-[var(--brand)]" : ""} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
);

const Footer = () => (
  <>
  <AdSlot placement="footer" className="mt-16 px-4 sm:px-8 lg:px-14" />
  <footer className="mt-16 border-t border-white/5 px-4 pb-24 pt-10 text-sm text-gray-500 sm:px-8 md:pb-10 lg:px-14" data-testid="site-footer">
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
      <div className="max-w-sm space-y-3">
        <Logo />
        <p className="text-xs leading-relaxed">CineStream does not host any files. All videos are embedded from third-party servers.</p>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {NAV.slice(1).map(({ to, label }) => <Link key={to} to={to} className="hover:text-white">{label}</Link>)}
        <Link to="/search" className="hover:text-white">Search</Link>
        <Link to="/discover" className="hover:text-white">Discover</Link>
      </div>
      <div className="flex items-center gap-3">
        <LiveCounter />
        <ShareButton url={window.location.origin} label="Share site" testId="footer-share-site"
          className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-xs text-gray-300 transition-colors hover:bg-white/5" />
      </div>
    </div>
    <p className="mt-8 text-xs">© {new Date().getFullYear()} CineStream</p>
  </footer>
  </>
);

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="grain min-h-screen">
      <Header />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
