import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWandMagicSparkles,
  faCircleCheck,
  faArrowRight,
  faXmark,
  faCrown,
  faUserGroup,
} from '@fortawesome/free-solid-svg-icons';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface SubscriptionConfirmModalProps {
  isOpen: boolean;
  onConfirmCheckout: () => void;
  onDeclineFree: () => void;
  userName?: string;
  planType?: 'pro' | 'teams';
}

export function SubscriptionConfirmModal({
  isOpen,
  onConfirmCheckout,
  onDeclineFree,
  userName,
  planType = 'pro',
}: SubscriptionConfirmModalProps) {
  if (!isOpen) return null;

  const isTeams = planType === 'teams';
  const priceLabel = isTeams ? '$19/mo' : '$11/mo';
  const planName = isTeams ? 'Qofeno Teams' : 'Qofeno Pro';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onDeclineFree(); }}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden border-0 rounded-[32px] bg-white shadow-2xl">
        <div className="relative p-6 sm:p-7 bg-gradient-to-br from-[#1E0B36] via-[#15092A] to-[#0A0518] text-white">
          <button
            onClick={onDeclineFree}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <FontAwesomeIcon icon={isTeams ? faUserGroup : faCrown} className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Welcome to Qofeno</span>
              <h3 className="text-lg font-black text-white leading-tight">
                {userName ? `Hi, ${userName.split(' ')[0]}! 👋` : 'Account Created! 🎉'}
              </h3>
            </div>
          </div>

          <p className="text-xs text-purple-200/90 leading-relaxed font-medium">
            You signed up via our upgrade link. Would you like to subscribe to <strong>{planName}</strong> or start with your <strong>Free Account</strong>?
          </p>
        </div>

        <div className="p-6 sm:p-7 bg-white space-y-4">
          {/* Pro Preview Box */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-extrabold text-[#0F0A1E]">{planName}</span>
              </div>
              <span className="text-xs font-black px-2.5 py-1 bg-purple-600 text-white rounded-lg">{priceLabel}</span>
            </div>

            <ul className="space-y-2 text-xs font-medium text-neutral-600">
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Up to {isTeams ? '1GB' : '500MB'} file uploads & priority speed</span>
              </li>
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Unlimited daily runs with no watermarks</span>
              </li>
            </ul>
          </div>

          {/* Action Choice Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={onConfirmCheckout}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Yes, Subscribe to {planName}</span>
              <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
            </button>

            <button
              onClick={onDeclineFree}
              className="w-full py-3 px-5 rounded-2xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 font-bold text-xs transition-all cursor-pointer text-center"
            >
              No, Continue with Free Account
            </button>
          </div>

          <p className="text-[11px] text-center font-medium text-neutral-400">
            🔒 Zero commitment. You can upgrade or downgrade anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
