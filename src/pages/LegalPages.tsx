// src/pages/LegalPages.tsx
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Mail, MapPin, Phone } from "lucide-react";
import { NeuCard } from "../components/ui/NeuCard";
import { NeuButton } from "../components/ui/NeuButton";

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

const LegalLayout: React.FC<LegalLayoutProps> = ({
  title,
  lastUpdated,
  children,
}) => {
  return (
    <div className="min-h-dvh bg-neu-bg text-neu-dark px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Link to="/">
            <NeuButton size="sm" className="flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Habit Pulse</span>
            </NeuButton>
          </Link>
          <span className="text-xs font-semibold text-neu-muted">
            Updated: {lastUpdated}
          </span>
        </div>

        <NeuCard className="p-6 sm:p-10 flex flex-col gap-6">
          <div className="border-b border-black/5 pb-4">
            <div className="flex items-center gap-2 text-neu-accent text-xs font-extrabold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Habit Pulse Official Policy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-neu-dark">
              {title}
            </h1>
          </div>

          <div className="space-y-5 text-sm leading-relaxed text-neu-dark/90">
            {children}
          </div>

          <div className="pt-6 border-t border-black/5 flex flex-wrap items-center justify-between gap-3 text-xs text-neu-muted">
            <span>© {new Date().getFullYear()} Habit Pulse. All rights reserved.</span>
            <div className="flex flex-wrap gap-4 font-semibold text-neu-accent">
              <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
              <Link to="/terms" className="hover:underline">Terms & Conditions</Link>
              <Link to="/refunds" className="hover:underline">Refund Policy</Link>
              <Link to="/contact" className="hover:underline">Contact Us</Link>
            </div>
          </div>
        </NeuCard>
      </div>
    </div>
  );
};

export const PrivacyPolicyPage: React.FC = () => (
  <LegalLayout title="Privacy Policy" lastUpdated="November 20, 2026">
    <p>
      Habit Pulse (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our web application.
    </p>
    <h2 className="text-base font-extrabold text-neu-dark">1. Information We Collect</h2>
    <ul className="list-disc pl-5 space-y-1.5">
      <li><strong>Account Details:</strong> Name, email address, and profile avatar when you register or sign in via Google OAuth.</li>
      <li><strong>Habit & Gamification Data:</strong> Habits created, daily completion logs, streak milestones, XP, and virtual coin balances.</li>
      <li><strong>Payment Metadata:</strong> When you purchase virtual coin packs, transactions are processed securely via Razorpay. We store only order IDs, payment IDs, and coin credit records—never your card, UPI PIN, or bank credentials.</li>
    </ul>
    <h2 className="text-base font-extrabold text-neu-dark">2. How We Use Your Information</h2>
    <p>
      We use your information strictly to operate Habit Pulse, send optional habit reminders (email/push notifications), display leaderboard rankings, and fulfill virtual coin purchases. We never sell or rent your personal data to third parties.
    </p>
    <h2 className="text-base font-extrabold text-neu-dark">3. Data Security & Deletion</h2>
    <p>
      All data is transmitted over HTTPS and stored securely. You may request account or data deletion at any time by contacting us at <strong>dharmeshtiwari1280@gmail.com</strong>.
    </p>
  </LegalLayout>
);

export const TermsPage: React.FC = () => (
  <LegalLayout title="Terms & Conditions" lastUpdated="November 20, 2026">
    <p>
      By accessing or using Habit Pulse (<strong>https://habit-pulse-d18.netlify.app</strong>), you agree to be bound by these Terms & Conditions.
    </p>
    <h2 className="text-base font-extrabold text-neu-dark">1. Service Description</h2>
    <p>
      Habit Pulse is a personal productivity and habit-tracking Progressive Web App (PWA) featuring streak tracking, leaderboards, and an optional in-app virtual currency (&quot;Coins&quot;) used to unlock cosmetic avatars and digital app features.
    </p>
    <h2 className="text-base font-extrabold text-neu-dark">2. Virtual Coins & Digital Goods</h2>
    <ul className="list-disc pl-5 space-y-1.5">
      <li>Virtual Coins have no real-world monetary value, cannot be transferred between accounts, and cannot be redeemed or cashed out for real currency.</li>
      <li>Prices for Coin Packs are listed in Indian Rupees (INR) inclusive of applicable charges.</li>
    </ul>
    <h2 className="text-base font-extrabold text-neu-dark">3. Acceptable Use</h2>
    <p>
      You agree not to misuse the platform, attempt unauthorized access, or exploit automated scripts to manipulate streaks, leaderboards, or payment verification endpoints.
    </p>
  </LegalLayout>
);

export const RefundPolicyPage: React.FC = () => (
  <LegalLayout title="Cancellation & Refund Policy" lastUpdated="November 20, 2026">
    <p>
      Habit Pulse provides instant digital fulfillment for virtual currency (&quot;Coins&quot;) purchased inside the application.
    </p>
    <h2 className="text-base font-extrabold text-neu-dark">1. Digital Goods Policy</h2>
    <p>
      Because virtual Coins are delivered instantaneously to your account upon payment confirmation, completed coin purchases are generally <strong>non-refundable and non-cancellable</strong> once credited to your wallet.
    </p>
    <h2 className="text-base font-extrabold text-neu-dark">2. Failed or Duplicate Transactions</h2>
    <ul className="list-disc pl-5 space-y-1.5">
      <li>If your bank account or UPI is debited for a failed transaction and Coins were not credited, the amount is automatically refunded by Razorpay/your bank within <strong>5–7 business days</strong>.</li>
      <li>If a confirmed payment does not reflect in your Habit Pulse wallet within 30 minutes, please email your Razorpay Payment ID to <strong>dharmeshtiwari1280@gmail.com</strong> and we will credit your Coins or issue a full refund within <strong>48 hours</strong>.</li>
    </ul>
  </LegalLayout>
);

export const ContactPage: React.FC = () => (
  <LegalLayout title="Contact Us" lastUpdated="November 20, 2026">
    <p>
      Have a question about Habit Pulse, your account, or a recent coin purchase? Reach out to us directly and we will respond within 24–48 business hours.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
      <div className="p-4 rounded-xl bg-neu-bg shadow-neu-flat-sm flex items-start gap-3">
        <Mail className="w-5 h-5 text-neu-accent shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-extrabold uppercase text-neu-muted">Support Email</p>
          <p className="text-sm font-bold text-neu-dark mt-0.5">
            dharmeshtiwari1280@gmail.com
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-neu-bg shadow-neu-flat-sm flex items-start gap-3">
        <Phone className="w-5 h-5 text-neu-accent shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-extrabold uppercase text-neu-muted">Phone Support</p>
          <p className="text-sm font-bold text-neu-dark mt-0.5">+91 91402 93955</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-neu-bg shadow-neu-flat-sm flex items-start gap-3 sm:col-span-2">
        <MapPin className="w-5 h-5 text-neu-accent shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-extrabold uppercase text-neu-muted">Registered Address</p>
          <p className="text-sm font-bold text-neu-dark mt-0.5">
            Mauharia, Amethi, Uttar Pradesh, India
          </p>
        </div>
      </div>
    </div>
  </LegalLayout>
);