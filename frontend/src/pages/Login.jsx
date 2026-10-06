import { Star, MessageCircle, Phone, Video, Heart, UserPlus, Sparkles, ShieldCheck, Lock, Zap, Send } from 'lucide-react';
import { assets } from '../assets/assets.js';
import { SignIn } from '@clerk/react';

const TICKER_ITEMS = ['Instant Messaging', 'Global Community', 'Live Events', 'Creator Studio', 'Stories & Reels', 'Private Groups'];

const Login = () => {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0a0a18] text-white overflow-hidden selection:bg-indigo-500/40">

      {/* Motion system */}
      <style>{`
        @keyframes float-y {
          0%, 100% { transform: translateY(0) rotate(var(--tilt, 0deg)); }
          50% { transform: translateY(-14px) rotate(var(--tilt, 0deg)); }
        }
        @keyframes blob-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, -40px) scale(1.18); }
        }
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(14px) scale(.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes rise-in {
          from { opacity: 0; transform: translateY(26px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: .35; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes ping-soft {
          0% { transform: scale(1); opacity: .7; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: .5; }
          50% { opacity: 1; }
        }
        .bg-noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; }
        }
      `}</style>

      {/* ============ LEFT: HERO ============ */}
      <div className="flex-[1.15] relative flex flex-col justify-between p-8 md:p-12 xl:p-16 overflow-hidden">

        {/* Ambient background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#12122b] via-[#0a0a18] to-[#160f2e]" />
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-indigo-600/25 rounded-full blur-3xl animate-[blob-drift_16s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-24 w-[24rem] h-[24rem] bg-fuchsia-600/20 rounded-full blur-3xl animate-[blob-drift_20s_ease-in-out_infinite]" style={{ animationDelay: '-8s' }} />
        <div className="absolute -bottom-32 left-1/3 w-[22rem] h-[22rem] bg-violet-500/15 rounded-full blur-3xl animate-[blob-drift_24s_ease-in-out_infinite]" style={{ animationDelay: '-14s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_40%,black,transparent)]" />
        <div className="absolute inset-0 bg-noise opacity-[0.05] pointer-events-none" />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between animate-[rise-in_.7s_ease-out_both]">
          <img src={assets.logo} alt="Kin-Link Logo" className="h-9 md:h-10 object-contain brightness-0 invert" />
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-300/80 border border-indigo-400/20 bg-indigo-400/10 rounded-full px-3.5 py-1.5">
            <Sparkles className="size-3.5" /> For creators
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10 max-w-xl mt-10 lg:mt-0">
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.08] animate-[rise-in_.7s_ease-out_both]" style={{ animationDelay: '.1s' }}>
            More than just
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">a social app.</span>
          </h1>
          <p className="mt-5 text-slate-400 text-base md:text-lg leading-relaxed max-w-md animate-[rise-in_.7s_ease-out_both]" style={{ animationDelay: '.22s' }}>
            Connect, share, and discover alongside millions of creators. Build your circle, grow your audience, turn moments into movements.
          </p>
        </div>

        {/* Live scene: chat card + orbiting notifications */}
        <div className="relative z-10 my-10 lg:my-6 max-w-md w-full mx-auto lg:mx-0 animate-[rise-in_.8s_ease-out_both]" style={{ animationDelay: '.35s' }}>

          {/* Chat card */}
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-5 shadow-[0_25px_60px_-15px_rgba(99,102,241,0.35)]">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="relative">
                <div className="size-10 rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-500 flex items-center justify-center text-xs font-bold">AC</div>
                <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-400 ring-2 ring-[#12122b]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Aria Chen</p>
                <p className="text-xs text-emerald-300/90">Active now</p>
              </div>
              <Phone className="size-4 text-slate-400" />
              <Video className="size-4 text-slate-400" />
            </div>

            <div className="py-4 space-y-3 text-sm">
              <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-white/10 px-4 py-2.5 text-slate-200 animate-[msg-in_.6s_ease-out_both]" style={{ animationDelay: '.9s' }}>
                Just posted my first tutorial — already 2k views!
              </div>
              <div className="max-w-[80%] ml-auto rounded-2xl rounded-tr-md bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-white animate-[msg-in_.6s_ease-out_both]" style={{ animationDelay: '1.7s' }}>
                That's amazing! The editing was so clean
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-white/10 px-4 py-2.5 text-slate-200 animate-[msg-in_.6s_ease-out_both]" style={{ animationDelay: '2.5s' }}>
                Dropping the behind-the-scenes reel tonight
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-md bg-white/10 px-4 py-3 animate-[msg-in_.6s_ease-out_both]" style={{ animationDelay: '3.2s' }}>
                {[0, 1, 2].map(i => (
                  <span key={i} className="size-1.5 rounded-full bg-slate-300 animate-[typing-dot_1.2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.18}s` }} />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 pl-4 pr-1.5 py-1.5">
              <span className="flex-1 text-sm text-slate-500">Message…</span>
              <span className="size-8 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center">
                <Send className="size-3.5" />
              </span>
            </div>
          </div>

          {/* Floating: new message */}
          <div className="hidden md:flex absolute -top-8 -right-6 lg:-right-12 items-center gap-3 rounded-2xl border border-white/10 bg-[#15152e]/90 backdrop-blur-md px-4 py-3 shadow-xl animate-[float-y_6s_ease-in-out_infinite]" style={{ '--tilt': '4deg' }}>
            <span className="size-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300"><MessageCircle className="size-4.5" /></span>
            <div>
              <p className="text-xs font-semibold">New message</p>
              <p className="text-[11px] text-slate-400">Aria sent you a reel</p>
            </div>
          </div>

          {/* Floating: likes */}
          <div className="hidden md:flex absolute top-1/2 -right-4 lg:-right-16 items-center gap-3 rounded-2xl border border-white/10 bg-[#15152e]/90 backdrop-blur-md px-4 py-3 shadow-xl animate-[float-y_7.5s_ease-in-out_infinite]" style={{ '--tilt': '-5deg', animationDelay: '1.2s' }}>
            <span className="relative size-9 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-300">
              <span className="absolute inset-0 rounded-xl bg-rose-400/40 animate-[ping-soft_2s_ease-out_infinite]" />
              <Heart className="size-4.5 fill-rose-400/30 relative" />
            </span>
            <div>
              <p className="text-xs font-semibold">+248 likes</p>
              <p className="text-[11px] text-slate-400">on your latest post</p>
            </div>
          </div>

          {/* Floating: new follower */}
          <div className="hidden md:flex absolute -bottom-8 -left-4 lg:-left-10 items-center gap-3 rounded-2xl border border-white/10 bg-[#15152e]/90 backdrop-blur-md px-4 py-3 shadow-xl animate-[float-y_8.5s_ease-in-out_infinite]" style={{ '--tilt': '3deg', animationDelay: '.6s' }}>
            <span className="size-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300"><UserPlus className="size-4.5" /></span>
            <div>
              <p className="text-xs font-semibold">Maya just followed you</p>
              <p className="text-[11px] text-slate-400">Say hello back</p>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="relative z-10 flex flex-wrap items-center gap-x-8 gap-y-4 animate-[rise-in_.7s_ease-out_both]" style={{ animationDelay: '.5s' }}>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {['from-indigo-400 to-blue-500|JK', 'from-fuchsia-400 to-rose-500|MR', 'from-amber-400 to-orange-500|TS', 'from-emerald-400 to-teal-500|AL', 'from-violet-400 to-purple-600|+9'].map(a => {
                const [grad, init] = a.split('|');
                return <span key={init} className={`size-9 rounded-full bg-gradient-to-br ${grad} ring-2 ring-[#0a0a18] flex items-center justify-center text-[10px] font-bold`}>{init}</span>;
              })}
            </div>
            <div>
              <div className="flex gap-0.5">{Array(5).fill(0).map((_, i) => <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />)}</div>
              <p className="text-xs text-slate-400 mt-1">Loved by <span className="text-white font-semibold">2M+ members</span></p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-8 text-center">
            <div><p className="text-xl font-extrabold">140+</p><p className="text-[11px] text-slate-500 uppercase tracking-wider">Countries</p></div>
            <div className="w-px h-10 bg-white/10" />
            <div><p className="text-xl font-extrabold">98%</p><p className="text-[11px] text-slate-500 uppercase tracking-wider">Stay active</p></div>
          </div>
        </div>

        {/* Ticker */}
        <div className="relative z-10 mt-10 -mx-8 md:-mx-12 xl:-mx-16 overflow-hidden border-t border-white/10 pt-5 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max gap-10 animate-[ticker_26s_linear_infinite] hover:[animation-play-state:paused]">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} aria-hidden={i >= TICKER_ITEMS.length} className="flex items-center gap-10 text-sm font-medium text-slate-400 whitespace-nowrap">
                {item} <Sparkles className="size-3.5 text-indigo-400/60" />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ============ RIGHT: AUTH ============ */}
      <div className="flex-1 relative flex flex-col items-center justify-center gap-6 p-6 sm:p-10 lg:p-14 bg-slate-50 text-slate-900">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-100/60 to-transparent pointer-events-none" />

        <div className="relative z-10 text-center max-w-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 mb-2">Get started</p>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Join the conversation</h2>
          <p className="text-sm text-slate-500 mt-2">One account. Every community. Zero friction.</p>
        </div>

        <div className="relative z-10 w-full max-w-md flex justify-center">
          <div className="absolute -inset-1 rounded-[1.75rem] bg-gradient-to-br from-indigo-400/40 via-violet-400/20 to-fuchsia-400/40 blur-lg opacity-70 pointer-events-none" />
          <SignIn
            appearance={{
              elements: {
                card: "relative shadow-2xl border border-white/60 rounded-3xl",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
              }
            }}
          />
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 max-w-sm">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-emerald-500" /> Bank-grade security</span>
          <span className="inline-flex items-center gap-1.5"><Lock className="size-3.5 text-indigo-500" /> Your data stays yours</span>
          <span className="inline-flex items-center gap-1.5"><Zap className="size-3.5 text-amber-500" /> Live in 30 seconds</span>
        </div>

        <p className="relative z-10 text-[11px] text-slate-400">&copy; {new Date().getFullYear()} Kin-Link Inc. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;
