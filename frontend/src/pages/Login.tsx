import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Heart,
  UserPlus,
  Sparkles,
  ShieldCheck,
  Lock,
  Zap,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const TICKER_ITEMS = [
  'Instant Messaging',
  'Global Community',
  'Stories & My Day',
  'Real-Time Chat',
  'Friend Connections',
  'Media Sharing',
];

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Login Form State
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput || !loginPassword) return;
    const success = await login(loginInput, loginPassword);
    if (success) {
      navigate('/');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regUsername || !regEmail || !regPassword) return;
    const success = await register(regEmail, regPassword, regFullName, regUsername);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0a0a18] text-white overflow-hidden selection:bg-indigo-500/40">
      <style>{`
        @keyframes float-y {
          0%, 100% { transform: translateY(0) rotate(var(--tilt, 0deg)); }
          50% { transform: translateY(-14px) rotate(var(--tilt, 0deg)); }
        }
        @keyframes blob-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, -40px) scale(1.18); }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      {/* ============ LEFT: HERO ============ */}
      <div className="flex-[1.15] relative flex flex-col justify-between p-8 md:p-12 xl:p-16 overflow-hidden">
        {/* Ambient background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#12122b] via-[#0a0a18] to-[#160f2e]" />
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-indigo-600/25 rounded-full blur-3xl animate-[blob-drift_16s_ease-in-out_infinite]" />
        <div
          className="absolute top-1/3 -right-24 w-[24rem] h-[24rem] bg-fuchsia-600/20 rounded-full blur-3xl animate-[blob-drift_20s_ease-in-out_infinite]"
          style={{ animationDelay: '-8s' }}
        />
        <div
          className="absolute -bottom-32 left-1/3 w-[22rem] h-[22rem] bg-violet-500/15 rounded-full blur-3xl animate-[blob-drift_24s_ease-in-out_infinite]"
          style={{ animationDelay: '-14s' }}
        />

        {/* Brand header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-lg shadow-indigo-500/30">
              <div className="w-full h-full bg-[#0d0d21] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                Kin-Link
              </span>
              <span className="block text-[11px] font-medium uppercase tracking-widest text-indigo-400/80">
                Next-Gen Social Network
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-xs text-zinc-300 font-medium">Live Feed Online</span>
          </div>
        </div>

        {/* Hero copy & cards */}
        <div className="relative z-10 my-10 lg:my-14 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 mb-6 text-xs text-indigo-300 font-medium">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            Connect, Share, and Discover Without Limits
          </div>

          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.08]">
            Stay connected with the people who matter most.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-lg">
            Share posts, post 24-hour stories, meet friends, and chat in real-time on a modern, ultra-fast platform.
          </p>

          {/* Social Proof badges */}
          <div className="mt-8 flex flex-wrap gap-4 items-center pt-6 border-t border-white/10">
            <div className="flex -space-x-2">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                alt="User"
                className="w-9 h-9 rounded-full border-2 border-[#0a0a18] object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
                alt="User"
                className="w-9 h-9 rounded-full border-2 border-[#0a0a18] object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80"
                alt="User"
                className="w-9 h-9 rounded-full border-2 border-[#0a0a18] object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Join thousands connecting daily</p>
              <p className="text-xs text-zinc-400">Posts, Stories, Real-time Chat & Reactions</p>
            </div>
          </div>
        </div>

        {/* Ticker bar */}
        <div className="relative z-10 w-full overflow-hidden py-3 border-t border-white/10">
          <div className="flex w-max animate-[ticker_25s_linear_infinite] gap-8">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
              <span key={idx} className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-400">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ============ RIGHT: AUTH FORMS ============ */}
      <div className="flex-1 relative flex items-center justify-center p-6 md:p-12 bg-[#0d0d21] border-l border-white/10">
        <div className="w-full max-w-md">
          {/* Tabs switch */}
          <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {activeTab === 'login' ? (
            /* ===== LOGIN FORM ===== */
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
                <p className="text-sm text-zinc-400 mt-1">Enter your credentials to access your feed and messages.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                    Email or Username
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                    <Input
                      type="text"
                      placeholder="e.g. john@example.com or john_doe"
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500" />
                  <span>Remember me for 7 days</span>
                </label>
                <span className="text-indigo-400 hover:underline cursor-pointer">Forgot password?</span>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl transition duration-200 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In to Kin-Link
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="pt-4 text-center text-xs text-zinc-500 border-t border-white/5">
                Protected with JWT access & refresh tokens with bcrypt security.
              </div>
            </form>
          ) : (
            /* ===== REGISTER FORM ===== */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Create an account</h2>
                <p className="text-sm text-zinc-400 mt-1">Join Kin-Link to share moments and chat with friends.</p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-400 text-sm">@</span>
                    <Input
                      type="text"
                      placeholder="john_doe"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl transition duration-200 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Free Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
