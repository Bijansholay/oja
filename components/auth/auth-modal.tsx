"use client";

import React, { useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { DEMO_PROFILES } from "@/lib/demo/store";
import { normalizePhoneNumber } from "@/lib/validation/schemas";
import { X, Smartphone, Mail, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: "buyer" | "seller";
}

export function AuthModal({ isOpen, onClose, defaultRole = "buyer" }: AuthModalProps) {
  const {
    user,
    profile,
    sendPhoneOtp,
    verifyPhoneOtp,
    sendEmailOtp,
    verifyEmailOtp,
    logout,
    loginAsDemoUser,
    isDemoMode,
  } = useAuth();
  const { t } = useI18n();

  const [authMethod, setAuthMethod] = useState<"phone" | "email">("email");
  const [step, setStep] = useState<"input" | "verify">("input");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (authMethod === "phone") {
        const raw = phoneNumber.trim();
        if (!raw) {
          throw new Error("Please enter your mobile phone number");
        }
        const normalized = normalizePhoneNumber(raw);
        if (!normalized || normalized.length < 10) {
          throw new Error("Please enter a valid phone number (e.g. 08012345678 or +2348012345678)");
        }
        const res = await sendPhoneOtp(normalized);
        setPendingUserId(res.userId);
        setStep("verify");
      } else {
        if (!email || !email.includes("@")) {
          throw new Error("Please enter a valid email address");
        }
        const res = await sendEmailOtp(email.trim());
        setPendingUserId(res.userId);
        setStep("verify");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send verification code. Please check your details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (!otpCode || otpCode.length < 4) {
        throw new Error("Enter the 6-digit code received via SMS/Email");
      }

      if (authMethod === "phone") {
        await verifyPhoneOtp(pendingUserId, otpCode.trim(), defaultRole);
      } else {
        await verifyEmailOtp(pendingUserId, otpCode.trim(), defaultRole);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid or expired verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-parchment rounded-xl border border-hairline shadow-dropdown p-6 sm:p-8 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 text-charcoal-muted hover:text-charcoal rounded-full hover:bg-parchment-soft transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {user ? (
          /* Logged In View */
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-forest text-parchment font-serif text-xl font-bold flex items-center justify-center">
                {user.name ? user.name[0] : "Ọ"}
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-forest">
                  {profile?.name || user.name || "Produce Member"}
                </h3>
                <p className="text-xs text-charcoal-muted">
                  {profile?.phone || user.phone || user.email} • {profile?.areaName || "Lagos, Nigeria"}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-parchment-soft border border-hairline space-y-2 text-xs text-charcoal">
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Role:</span>
                <span className="font-semibold capitalize">{profile?.role || "Buyer"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Registered area:</span>
                <span className="font-semibold">{profile?.areaName || "Not set"}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  onClose();
                }}
                className="w-full py-2.5 rounded-lg border border-hairline bg-white hover:bg-parchment-soft text-charcoal font-medium text-xs transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Flow */
          <div>
            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-forest-light text-forest text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Hyperlocal Farmers Network</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-forest">
                Welcome to {t.appName}
              </h2>
              <p className="text-xs text-charcoal-muted mt-1">
                {authMethod === "email"
                  ? "Enter your email address to receive an instant 6-digit code. No password needed."
                  : "Enter your phone or test number for a 6-digit verification code."}
              </p>
            </div>

            {/* Auth Method Tabs */}
            <div className="flex border-b border-hairline mb-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("email");
                  setErrorMessage(null);
                }}
                className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  authMethod === "email"
                    ? "border-forest text-forest"
                    : "border-transparent text-charcoal-muted hover:text-charcoal"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Code</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMethod("phone");
                  setErrorMessage(null);
                }}
                className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  authMethod === "phone"
                    ? "border-forest text-forest"
                    : "border-transparent text-charcoal-muted hover:text-charcoal"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone Number</span>
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                {errorMessage}
              </div>
            )}

            {step === "input" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                {authMethod === "email" ? (
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-charcoal-muted absolute left-3 top-3.5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoFocus
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-hairline bg-white text-sm text-charcoal placeholder:text-charcoal-subtle focus:border-forest focus:ring-1 focus:ring-forest outline-none transition-all"
                      />
                    </div>
                    <span className="text-[11px] text-charcoal-muted mt-1 block">
                      A 6-digit one-time code will be sent to your inbox.
                    </span>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Phone Number (or Appwrite Test Number)
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-charcoal-muted absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="08012345678 or +234..."
                        required
                        autoFocus
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-hairline bg-white text-sm text-charcoal placeholder:text-charcoal-subtle focus:border-forest focus:ring-1 focus:ring-forest outline-none transition-all"
                      />
                    </div>
                    <span className="text-[11px] text-charcoal-muted mt-1 block">
                      Local mobile (080...) or international format (+234...)
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg bg-forest hover:bg-forest-hover text-parchment font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-subtle disabled:opacity-60"
                >
                  {isLoading ? (
                    <span>Sending code...</span>
                  ) : (
                    <>
                      <span>{authMethod === "email" ? "Send Email Code" : "Continue with SMS Code"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Enter 6-digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    autoFocus
                    required
                    className="w-full text-center tracking-widest font-mono text-xl py-2.5 rounded-lg border border-hairline bg-white text-charcoal focus:border-forest outline-none transition-all"
                  />
                  <span className="text-[11px] text-charcoal-muted mt-1 block">
                    Sent to {authMethod === "phone" ? phoneNumber : email}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg bg-forest hover:bg-forest-hover text-parchment font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-subtle disabled:opacity-60"
                >
                  {isLoading ? "Verifying..." : "Verify & Sign In"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("input")}
                  className="w-full text-xs text-charcoal-muted hover:text-charcoal text-center"
                >
                  Change {authMethod === "phone" ? "phone number" : "email"}
                </button>
              </form>
            )}

            {/* Quick Demo Switcher (only in demo mode) */}
            {isDemoMode && (
              <div className="mt-6 pt-4 border-t border-hairline">
                <div className="flex items-center gap-1.5 text-xs font-bold text-charcoal-muted mb-2">
                  <UserCheck className="w-3.5 h-3.5 text-forest" />
                  <span>Instant Demo Switcher</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_PROFILES.slice(0, 4).map((p) => (
                    <button
                      key={p.userId}
                      type="button"
                      onClick={() => {
                        loginAsDemoUser(p.userId);
                        onClose();
                      }}
                      className="p-2 rounded-lg border border-hairline bg-white hover:bg-parchment-soft text-left transition-colors"
                    >
                      <p className="text-xs font-bold text-forest truncate">{p.name}</p>
                      <p className="text-[10px] text-charcoal-muted capitalize">
                        {p.role} ({p.areaName.split(",")[0].trim()})
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
