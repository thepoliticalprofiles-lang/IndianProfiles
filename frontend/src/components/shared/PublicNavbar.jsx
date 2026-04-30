import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const brandLogo = "/logo/indian-profiles-logo.png";

const PublicNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="glass-header fixed top-0 left-0 right-0 z-50 border-b border-stone-200" data-testid="public-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3" data-testid="navbar-logo">
            <img src={brandLogo} alt="Indian Profiles" className="h-10 w-auto object-contain" />
            <div className="hidden sm:block leading-tight">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-orange">The</div>
              <div>
                <span className="text-xl font-extrabold text-brand-navy">Indian</span>
                <span className="text-xl font-extrabold text-brand-magenta ml-1">Profiles</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-stone-700 hover:text-brand-navy font-medium transition-colors" data-testid="nav-home">
              Home
            </Link>
            <Link to="/get-involved" className="text-stone-700 hover:text-brand-navy font-medium transition-colors" data-testid="nav-get-involved">
              Get Involved
            </Link>
            <Link to="/admin/login" className="bg-gradient-to-r from-brand-orange to-brand-magenta hover:brightness-110 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-sm" data-testid="nav-admin-login">
              Admin Login
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-stone-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-button"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-stone-200">
            <div className="flex flex-col gap-4">
              <Link to="/" className="text-stone-700 hover:text-brand-navy font-medium" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/get-involved" className="text-stone-700 hover:text-brand-navy font-medium" onClick={() => setMobileMenuOpen(false)}>
                Get Involved
              </Link>
              <Link to="/admin/login" className="bg-gradient-to-r from-brand-orange to-brand-magenta text-white px-4 py-2 rounded-lg font-semibold text-center" onClick={() => setMobileMenuOpen(false)}>
                Admin Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default PublicNavbar;
