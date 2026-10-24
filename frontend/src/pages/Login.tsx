import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
  MessageCircle,
  Radio,
  Image as ImageIcon,
  Phone,
  Heart,
  Send,
  Video,
  Share2,
  Bell,
  ThumbsUp,
  Camera,
  Users,
} from 'lucide-react';
import { Mascot } from 'page-mascot';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const MASCOTS = [
  { id: 'fox', label: '🦊 Fox', dir: '/mascots/fox-directions.webp', react: '/mascots/fox-reactions.webp' },
  { id: 'cat', label: '🐱 Cat', dir: '/mascots/cat-directions.webp', react: '/mascots/cat-reactions.webp' },
  { id: 'panda', label: '🐼 Panda', dir: '/mascots/panda-directions.webp', react: '/mascots/panda-reactions.webp' },
];

const FLOATING_ICONS = [
  { icon: MessageCircle, color: 'text-indigo-400', glow: 'shadow-indigo-500/20', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', pos: 'top-[10%] left-[5%]', size: 'p-3', iconSize: 'w-5 h-5', anim: 'animate-[float-slow_7s_ease-in-out_infinite]' },
  { icon: Heart, color: 'text-rose-400', glow: 'shadow-rose-500/20', bg: 'bg-rose-500/10', border: 'border-rose-500/20', pos: 'top-[42%] left-[3%]', size: 'p-2.5', iconSize: 'w-4 h-4', anim: 'animate-[float-reverse_8.5s_ease-in-out_infinite]' },
  { icon: Phone, color: 'text-emerald-400', glow: 'shadow-emerald-500/20', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', pos: 'bottom-[12%] left-[8%]', size: 'p-3', iconSize: 'w-5 h-5', anim: 'animate-[float-drift_9s_ease-in-out_infinite]' },
  { icon: Send, color: 'text-sky-400', glow: 'shadow-sky-500/20', bg: 'bg-sky-500/10', border: 'border-sky-500/20', pos: 'top-[20%] left-[45%]', size: 'p-2.5', iconSize: 'w-4 h-4', anim: 'animate-[float-slow_10s_ease-in-out_infinite]' },
  { icon: Camera, color: 'text-pink-400', glow: 'shadow-pink-500/20', bg: 'bg-pink-500/10', border: 'border-pink-500/20', pos: 'bottom-[20%] left-[38%]', size: 'p-2.5', iconSize: 'w-4 h-4', anim: 'animate-[float-reverse_9.5s_ease-in-out_infinite]' },
  { icon: ThumbsUp, color: 'text-indigo-400', glow: 'shadow-indigo-500/20', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', pos: 'top-[7%] right-[7%]', size: 'p-3', iconSize: 'w-5 h-5', anim: 'animate-[float-drift_8s_ease-in-out_infinite]' },
  { icon: Share2, color: 'text-purple-400', glow: 'shadow-purple-500/20', bg: 'bg-purple-500/10', border: 'border-purple-500/20', pos: 'top-[45%] right-[3%]', size: 'p-2.5', iconSize: 'w-4 h-4', anim: 'animate-[float-slow_9s_ease-in-out_infinite]' },
  { icon: Bell, color: 'text-amber-400', glow: 'shadow-amber-500/20', bg: 'bg-amber-500/10', border: 'border-amber-500/20', pos: 'bottom-[10%] right-[8%]', size: 'p-3', iconSize: 'w-5 h-5', anim: 'animate-[float-reverse_8s_ease-in-out_infinite]' },
  { icon: Video, color: 'text-violet-400', glow: 'shadow-violet-500/20', bg: 'bg-violet-500/10', border: 'border-violet-500/20', pos: 'top-[28%] right-[42%]', size: 'p-2.5', iconSize: 'w-4 h-4', anim: 'animate-[float-drift_11s_ease-in-out_infinite]' },
  { icon: Users, color: 'text-teal-400', glow: 'shadow-teal-500/20', bg: 'bg-teal-500/10', border: 'border-teal-500/20', pos: 'bottom-[32%] right-[38%]', size: 'p-2.5', iconSize: 'w-4 h-4', anim: 'animate-[float-slow_8.5s_ease-in-out_infinite]' },
];

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [selectedMascot, setSelectedMascot] = useState(MASCOTS[0]);
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#080911] text-white selection:bg-indigo-500/40 relative overflow-x-hidden">
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(6deg); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(18px) rotate(-8deg); }
        }
        @keyframes float-drift {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
          33% { transform: translate(12px, -16px) rotate(5deg); }
          66% { transform: translate(-10px, -8px) rotate(-4deg); }
        }
      `}</style>

      {/* Background radial glow spots */}
      <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[36rem] h-[36rem] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Floating social media icons atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {FLOATING_ICONS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`absolute ${item.pos} ${item.size} rounded-2xl ${item.bg} border ${item.border} backdrop-blur-md shadow-lg ${item.glow} ${item.anim} transition-transform`}
            >
              <Icon className={`${item.iconSize} ${item.color}`} />
            </div>
          );
        })}
      </div>

      {/* ============ LEFT: BRAND HERO ============ */}
      <div className="flex-1 relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 z-10">
        {/* Top brand header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-lg shadow-indigo-500/30">
              <div className="w-full h-full bg-[#0d0f1f] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                LINK
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                Social Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>

          </div>
        </div>

        {/* Hero Copy */}
        <div className="my-12 lg:my-0 max-w-xl">


          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white">
            Connect without friction.{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Share in real-time.
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-400 leading-relaxed">
            Instant messaging, 24-hour stories, friends discovery, and rich media feeds designed for fast social connection.
          </p>
        </div>

        {/* Hero footer note */}
        <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} LINK Network. All rights reserved.</span>
          <span className="hidden sm:inline">v2.0 Obsidian Edition</span>
        </div>
      </div>

      {/* ============ RIGHT: AUTH CARD WITH MASCOT ============ */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10 lg:border-l lg:border-white/[0.08] bg-[#0c0d18]/70 backdrop-blur-2xl">
        <div className="w-full max-w-md">
          {/* Mascot Stage */}
          <div className="flex flex-col items-center justify-center -mb-4 relative z-20">
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl scale-75 group-hover:scale-100 transition-all duration-300" />
              <div className="relative cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95" title="Click or poke the mascot!">
                <Mascot
                  directions={selectedMascot.dir}
                  reactions={selectedMascot.react}
                  size={120}
                  label={`${selectedMascot.id} mascot`}
                />
              </div>
            </div>

            {/* Mascot Selector Pills */}
            <div className="flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">

              {MASCOTS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMascot(m)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition cursor-pointer ${selectedMascot.id === m.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Auth Card */}
          <div className="bg-[#111322] rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-2xl relative overflow-hidden mt-6">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            {/* Tabs Switcher */}
            <div className="flex p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'login'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'register'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Create Account
              </button>
            </div>

            {activeTab === 'login' ? (
              /* ===== SIGN IN FORM ===== */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Welcome back</h2>
                  <p className="text-xs text-slate-400 mt-1">Enter your credentials to access your account.</p>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Email or Username
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="john@example.com or john_doe"
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        className="pl-10 h-11 bg-white/[0.04] border-white/10 text-white text-xs placeholder:text-slate-500 focus:border-indigo-500 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 bg-white/[0.04] border-white/10 text-white text-xs placeholder:text-slate-500 focus:border-indigo-500 rounded-xl"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 h-11 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In to LINK
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <div className="pt-3 text-center border-t border-white/[0.06] flex items-center justify-center gap-1.5 text-[11px] text-slate-500">


                </div>
              </form>
            ) : (
              /* ===== REGISTER FORM ===== */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Create an account</h2>
                  <p className="text-xs text-slate-400 mt-1">Join LINK to connect, share moments, and chat.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="John Doe"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="pl-10 h-10 bg-white/[0.04] border-white/10 text-white text-xs placeholder:text-slate-500 focus:border-indigo-500 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-bold">@</span>
                      <Input
                        type="text"
                        placeholder="john_doe"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        className="pl-8 h-10 bg-white/[0.04] border-white/10 text-white text-xs placeholder:text-slate-500 focus:border-indigo-500 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="pl-10 h-10 bg-white/[0.04] border-white/10 text-white text-xs placeholder:text-slate-500 focus:border-indigo-500 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimum 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="pl-10 pr-10 h-10 bg-white/[0.04] border-white/10 text-white text-xs placeholder:text-slate-500 focus:border-indigo-500 rounded-xl"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 h-11 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all duration-200"
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
    </div>
  );
};

export default Login;
