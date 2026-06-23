import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

export function AuthWall({ onUpgrade, onSignIn }: { onUpgrade: () => void; onSignIn: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-3xl border border-neutral-200 bg-white p-6 md:p-8 shadow-xl shadow-neutral-900/5"
    >
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
            <FontAwesomeIcon icon={faLock} className="h-5 w-5" />
          </div>

          <div>
            <h3 className="text-lg font-black text-[#0F0A1E]">This tool requires a Pro plan</h3>
            <p className="text-sm text-neutral-500">Upgrade to unlock this workflow and keep your files moving.</p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
          <button onClick={onUpgrade} className="w-full rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-purple-700 md:w-auto">
            Upgrade to Pro
          </button>
          <button onClick={onSignIn} className="w-full rounded-xl border border-neutral-200 px-5 py-3 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-50 md:w-auto">
            Sign in if you have Pro
          </button>
        </div>
      </div>
    </motion.div>
  );
}
