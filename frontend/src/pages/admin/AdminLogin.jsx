import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, formatApiError } from "../../App";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "../../components/ui/input";

const brandLogo = "/logo/indian-profiles-logo.png";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // Redirect if already logged in
  if (user) {
    navigate("/admin");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-stone-50 via-white to-brand-orange/5 relative overflow-hidden" data-testid="admin-login-page">
      {/* Decorative background shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-magenta/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <img src={brandLogo} alt="Indian Profiles" className="h-20 w-auto object-contain" />
            <div className="leading-tight text-center">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-orange">The</div>
              <div>
                <span className="text-2xl font-extrabold text-brand-navy">Indian</span>
                <span className="text-2xl font-extrabold text-brand-magenta ml-1.5">Profiles</span>
              </div>
              <p className="text-xs text-stone-500 mt-1 uppercase tracking-wider">Admin Dashboard</p>
            </div>
          </Link>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-stone-200">
          <h1 className="text-2xl font-bold text-brand-navy mb-2">Welcome Back</h1>
          <p className="text-stone-500 mb-8">Sign in to access the admin dashboard</p>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6" data-testid="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Email Address</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@indianprofiles.com"
                className="w-full"
                data-testid="login-email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pr-10"
                  data-testid="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-orange to-brand-magenta hover:brightness-110 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition-all shadow-md"
              data-testid="login-submit"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Back to Home */}
        <p className="text-center mt-6 text-stone-500">
          <Link to="/" className="text-brand-navy hover:text-brand-orange transition-colors font-medium">
            &larr; Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
