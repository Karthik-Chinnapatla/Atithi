import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, MailCheck, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../utils/formatters';
import { AtithiLogo } from './AtithiLogo';

const formatCountdown = (totalSeconds) => {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export function OtpVerificationCard({
  email: initialEmail = '',
  expiresInMinutes = 10,
  onVerified,
  onBack,
  backLabel = 'Back',
}) {
  const { verifyOtp, resendOtp } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [expirySeconds, setExpirySeconds] = useState(expiresInMinutes * 60);
  const [resendCooldown, setResendCooldown] = useState(initialEmail ? 30 : 0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    setExpirySeconds(expiresInMinutes * 60);
  }, [expiresInMinutes]);

  useEffect(() => {
    if (expirySeconds <= 0 && resendCooldown <= 0) {
      return undefined;
    }
    const timer = setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [expirySeconds > 0, resendCooldown > 0]);

  const handleOtpChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(digitsOnly);
    if (errorMsg) {
      setErrorMsg('');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter the email address you registered with');
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setErrorMsg('Please enter the 6-digit verification code from your email');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const user = await verifyOtp({ email: trimmedEmail, otp });
      toast.success(
        `Email verified! Welcome to Atithi, ${user.name}. Confirmation email sent.`
      );
      if (onVerified) {
        await onVerified(user);
      }
    } catch (error) {
      const msg = extractErrorMessage(error, 'Verification failed');
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setErrorMsg('Enter your registered email first to resend OTP');
      return;
    }

    setResending(true);
    setErrorMsg('');
    try {
      const data = await resendOtp(trimmedEmail);
      setOtp('');
      setExpirySeconds((data.expiresInMinutes || 10) * 60);
      setResendCooldown(30);
      toast.success(data.message || 'A fresh 6-digit OTP has been sent to your email.');
    } catch (error) {
      const retryAfter = error?.response?.data?.retryAfterSeconds;
      if (retryAfter) {
        setResendCooldown(retryAfter);
      }
      const msg = extractErrorMessage(error, 'Could not resend OTP');
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  const isExpired = expirySeconds <= 0;

  return (
    <div className="card-surface p-8">
      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <AtithiLogo
            size="lg"
            subtitle="Verified Dining Reviews"
            hoverSubtitle="నిజమైన ఆహార సమీక్షలు"
          />
        </div>

        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
          <MailCheck size={24} />
        </div>
        <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
          Verify your email
        </h1>
        <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
          Enter the 6-digit verification code sent to{' '}
          {email ? (
            <span className="font-semibold text-stone-800 dark:text-stone-200">{email}</span>
          ) : (
            'your email inbox'
          )}
          .
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4" noValidate>
        {!initialEmail && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-400">
              Registered Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field"
              autoComplete="email"
            />
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="otp-code-input"
              className="block text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-400"
            >
              6-Digit OTP Code
            </label>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isExpired
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                  : expirySeconds <= 60
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                    : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
              }`}
            >
              <Clock size={12} />
              {isExpired ? 'Expired' : `Expires in ${formatCountdown(expirySeconds)}`}
            </span>
          </div>

          <input
            id="otp-code-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={handleOtpChange}
            placeholder="000000"
            className="input-field text-center font-mono text-2xl font-bold tracking-[0.55em] text-stone-900 placeholder:tracking-[0.55em] placeholder:text-stone-300 dark:text-stone-100 dark:placeholder:text-stone-600"
          />

          {errorMsg && (
            <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{errorMsg}</p>
          )}
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={submitting || otp.length !== 6}
          className="btn-primary w-full py-3 disabled:opacity-50"
        >
          <ShieldCheck size={17} />
          {submitting ? 'Verifying OTP...' : 'Verify & Complete Sign Up'}
        </motion.button>
      </form>

      <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-stone-200/80 pt-5 dark:border-stone-800 sm:flex-row">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 transition-colors hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
          >
            <ArrowLeft size={14} />
            {backLabel}
          </button>
        ) : (
          <span className="text-xs text-stone-400 dark:text-stone-500">Valid for 10 minutes</span>
        )}

        <button
          type="button"
          onClick={handleResend}
          disabled={resending || resendCooldown > 0}
          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
        >
          <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
          {resending
            ? 'Sending OTP...'
            : resendCooldown > 0
              ? `Resend OTP (${resendCooldown}s)`
              : 'Resend OTP'}
        </button>
      </div>
    </div>
  );
}
