import { Link } from "react-router-dom";

const brandLogo = "/logo/indian-profiles-logo.png";

const PublicFooter = () => {
  return (
    <footer className="bg-brand-navy text-white" data-testid="public-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & About */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="bg-white rounded-lg p-1">
                <img src={brandLogo} alt="Indian Profiles" className="h-12 w-auto object-contain" />
              </div>
              <div className="leading-tight">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-orange">The</div>
                <div>
                  <span className="text-2xl font-extrabold text-white">Indian</span>
                  <span className="text-2xl font-extrabold text-brand-magenta ml-1">Profiles</span>
                </div>
              </div>
            </Link>
            <p className="text-blue-100/80 leading-relaxed max-w-md">
              Connecting citizens with their representatives. Building a stronger nation through transparency and grassroots leadership.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-blue-100/70 hover:text-brand-orange transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/get-involved" className="text-blue-100/70 hover:text-brand-orange transition-colors">Get Involved</Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-blue-100/70 hover:text-brand-orange transition-colors">Admin Login</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact</h4>
            <ul className="space-y-2 text-blue-100/70">
              <li>Email: contact@indianprofiles.com</li>
              <li>Phone: +91-XXXXXXXXXX</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-blue-100/60">
          <p>&copy; {new Date().getFullYear()} Indian Profiles. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
