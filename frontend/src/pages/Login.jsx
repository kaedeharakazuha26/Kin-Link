import { Star, MessageCircle, Phone, Heart, Share2, UserPlus, Sparkles } from 'lucide-react';
import { assets } from '../assets/assets.js';
import { SignIn } from '@clerk/react';

const Login = () => {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50 text-slate-900 overflow-hidden">
      
      {/* Left Side: Hero Branding with Floating Icons & Ambient Background */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-14 lg:p-20 relative bg-gradient-to-br from-indigo-50/70 via-white to-slate-100 overflow-hidden">
        
        {/* Ambient Blurred Light Blobs */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-300/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* --- FLOATING BACKGROUND ICONS --- */}
        {/* Floating Message Icon - Top Right */}
        <div className="absolute top-16 right-12 md:right-20 bg-white/80 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-slate-200/60 animate-bounce duration-1000 hidden sm:flex items-center justify-center text-indigo-600">
          <MessageCircle className="size-6 md:size-7 fill-indigo-100" />
        </div>

        {/* Floating Phone Icon - Mid Right */}
        <div className="absolute top-1/2 right-8 lg:right-16 -translate-y-1/2 bg-white/80 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-slate-200/60 animate-pulse hidden sm:flex items-center justify-center text-indigo-500">
          <Phone className="size-6 md:size-7" />
        </div>

        {/* Floating Heart Icon - Bottom Left Area */}
        <div className="absolute bottom-24 left-10 md:left-16 bg-white/80 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-slate-200/60 animate-bounce hidden lg:flex items-center justify-center text-rose-500">
          <Heart className="size-6 fill-rose-100" />
        </div>

        {/* Floating Share Icon - Top Middle */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-white/70 backdrop-blur-md p-2.5 rounded-xl shadow-md border border-slate-200/50 hidden md:flex items-center justify-center text-indigo-400">
          <Share2 className="size-5" />
        </div>

        {/* Floating Sparkles Icon - Mid Left */}
        <div className="absolute top-1/3 left-6 lg:left-12 bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-md border border-slate-200/60 hidden sm:flex items-center justify-center text-amber-500">
          <Sparkles className="size-5 fill-amber-100" />
        </div>
        {/* --------------------------------- */}

        {/* Top Logo */}
        <div className="relative z-10 mb-8 md:mb-0">
          <img 
            src={assets.logo} 
            alt="Kin-Link Logo" 
            className="h-10 md:h-12 object-contain" 
          />
        </div>

        {/* Middle Hero Content */}
        <div className="relative z-10 max-w-xl my-auto py-8">
          
          {/* Social Proof Badge */}
          <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/80 shadow-sm mb-6 transition-transform hover:scale-105">
            <img 
              src={assets.group_users} 
              alt="Community Users" 
              className="h-7 md:h-8 object-contain" 
            />
            <div className="flex flex-col">
              <div className="flex gap-0.5">
                {Array(5).fill(0).map((_, i) => (
                  <Star 
                    key={i} 
                    className="size-3.5 md:size-4 fill-amber-400 text-amber-400" 
                  />
                ))}
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">
                Used by <span className="text-indigo-600 font-bold">12k+</span> Developers
              </p>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] mb-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-800 bg-clip-text text-transparent">
            More Than Just a Social App.
          </h1>

          {/* Subtitle */}
          <p className="text-slate-600 text-base md:text-lg leading-relaxed">
            Connect, share, and discover with our social platform. Join a vibrant community of creators and experience the power of meaningful digital connections.
          </p>

          {/* Feature Highlights Pills */}
          <div className="mt-8 flex flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-700">
              <MessageCircle className="size-3.5" /> Instant Messaging
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-100 text-xs font-medium text-purple-700">
              <UserPlus className="size-3.5" /> Connect Worldwide
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-100 text-xs font-medium text-rose-700">
              <Heart className="size-3.5" /> Share Moments
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-slate-400 pt-4">
          &copy; {new Date().getFullYear()} Kin-Link Inc. All rights reserved.
        </div>
      </div>

      {/* Right Side: Clerk SignIn Container */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-slate-100/60 border-t md:border-t-0 md:border-l border-slate-200/80 relative z-10">
        <div className="w-full max-w-md flex justify-center drop-shadow-sm">
          <SignIn 
            appearance={{
              elements: {
                card: "shadow-lg border border-slate-200/80 rounded-2xl",
              }
            }}
          />
        </div>
      </div>

    </div>
  );
};

export default Login;