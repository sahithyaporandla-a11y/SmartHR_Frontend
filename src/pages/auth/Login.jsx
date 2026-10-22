import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';

import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Briefcase, Lock, Mail, KeyRound, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';

// ─── Tab: Password Login ──────────────────────────────────────────────────────
function PasswordTab({ onSuccess }) {
  const toast = useToast();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const userData = await login(data.email, data.password);
      toast.success('Welcome back!');
      onSuccess(userData.role);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="form-group">
        <label htmlFor="pw-email">Email address</label>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="pw-email"
            type="email"
            placeholder="you@company.com"
            className="pl-9"
            autoComplete="email"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
            })}
          />
        </div>
        {errors.email && <p className="form-error">{errors.email.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="pw-password">Password</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="pw-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="pl-9 pr-10"
            autoComplete="current-password"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Min 6 characters' },
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            id="toggle-password-btn"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="form-error">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full justify-center py-2.5"
        id="login-submit-btn"
      >
        {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
      </button>
    </form>
  );
}

// ─── Tab: OTP Login ───────────────────────────────────────────────────────────
function OTPTab({ onSuccess }) {
  const toast = useToast();
  const { loginWithData } = useAuth();

  // step: 'email' | 'otp'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [devOTP, setDevOTP] = useState('');
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  const startCountdown = () => {
    setCountdown(60);
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email.');
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) return toast.error('Invalid email address.');

    setSendingOTP(true);
    try {
      const res = await api.post('/auth/send-otp', { email });
      // Dev mode: backend returns OTP in response for easy testing
      if (res.data?.data?.devOTP) {
        setDevOTP(res.data.data.devOTP);
        setOtp(res.data.data.devOTP); // auto-fill the input
        toast.success('OTP ready — auto-filled below (dev mode).');
      } else {
        toast.success('OTP sent! Check your email.');
      }
      setStep('otp');
      startCountdown();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return toast.error('Please enter the 6-digit OTP.');

    setVerifying(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      const { token, user: userData } = res.data.data;
      // Update both localStorage AND React context state so ProtectedRoute sees user immediately
      loginWithData(token, userData);
      toast.success('Login successful!');
      onSuccess(userData.role);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setVerifying(false);
    }
  };


  if (step === 'email') {
    return (
      <form onSubmit={handleSendOTP} noValidate className="space-y-4">
        <div className="form-group">
          <label htmlFor="otp-email">Email address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="otp-email"
              type="email"
              placeholder="you@company.com"
              className="pl-9"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            A 6-digit code will be sent to your registered email.
          </p>
        </div>

        <button
          type="submit"
          disabled={sendingOTP}
          className="btn-primary w-full justify-center py-2.5"
          id="send-otp-btn"
        >
          {sendingOTP
            ? <><span className="spinner" /> Sending OTP...</>
            : <><Send size={16} /> Send OTP</>}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOTP} noValidate className="space-y-4">
      {/* Email display + back */}
      <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl">
        <Mail size={15} className="text-indigo-600 flex-shrink-0" />
        <p className="text-sm text-indigo-700 flex-1 truncate">{email}</p>
        <button
          type="button"
          onClick={() => { setStep('email'); setOtp(''); }}
          className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 flex-shrink-0"
          id="change-email-btn"
        >
          <ArrowLeft size={12} /> Change
        </button>
      </div>

      <div className="form-group">
        <label htmlFor="otp-code">Enter 6-digit OTP</label>
        <div className="relative">
          <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="otp-code"
            type="text"
            placeholder="123456"
            className="pl-9 text-center text-2xl font-bold tracking-[0.5em] letter-spacing-widest"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {countdown > 0
            ? `Resend available in ${countdown}s`
            : <button
                type="button"
                onClick={handleSendOTP}
                disabled={sendingOTP}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
                id="resend-otp-btn"
              >
                {sendingOTP ? 'Sending...' : 'Resend OTP'}
              </button>
          }
        </p>
      </div>

      <button
        type="submit"
        disabled={verifying || otp.length !== 6}
        className="btn-primary w-full justify-center py-2.5"
        id="verify-otp-btn"
      >
        {verifying ? <><span className="spinner" /> Verifying...</> : 'Verify & Sign In'}
      </button>

      {/* Dev banner: shows OTP right on the page in development */}
      {devOTP ? (
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="text-xs text-emerald-700 font-semibold mb-1">⚙️ Dev Mode — Your OTP</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold tracking-[0.3em] text-emerald-800">{devOTP}</span>
            <button
              type="button"
              onClick={() => setOtp(devOTP)}
              className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700"
              id="autofill-otp-btn"
            >
              Auto-fill
            </button>
          </div>
          <p className="text-xs text-emerald-600 mt-1">OTP is visible here because NODE_ENV=development</p>
        </div>
      ) : (
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
          <p className="text-xs text-amber-700 font-medium">⚙️ Dev Mode</p>
          <p className="text-xs text-amber-600 mt-0.5">
            OTP is printed in the <strong>backend terminal</strong> where <code>npm run dev</code> is running.
          </p>
        </div>
      )}
    </form>
  );
}


// ─── Main Login Page ──────────────────────────────────────────────────────────
export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('password'); // 'password' | 'otp'

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/my-profile'} replace />;
  }


  const handleSuccess = (role) => {
    navigate(role === 'admin' ? '/dashboard' : '/my-profile', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0f1f3d] to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
            <Briefcase size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">SmartHR</h1>
          <p className="text-slate-400 text-sm mt-1">Human Resource Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-slate-500 text-sm mb-5">Choose how you'd like to sign in</p>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'password'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              id="tab-password"
            >
              <Lock size={14} /> Password
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('otp')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'otp'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              id="tab-otp"
            >
              <KeyRound size={14} /> Email OTP
            </button>
          </div>

          {/* Tab content */}
          <div className="fade-in" key={activeTab}>
            {activeTab === 'password'
              ? <PasswordTab onSuccess={handleSuccess} />
              : <OTPTab onSuccess={handleSuccess} />
            }
          </div>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-700 mb-2">🔑 Demo Credentials</p>
            <div className="space-y-1.5 text-xs text-indigo-600">
              <div className="flex justify-between">
                <span className="font-medium">Admin:</span>
                <span>admin@smarthr.com / Admin@123</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Employee:</span>
                <span>john.doe@smarthr.com / Employee@123</span>
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-indigo-200 text-indigo-500">
                💡 OTP tab: OTP prints in backend terminal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
