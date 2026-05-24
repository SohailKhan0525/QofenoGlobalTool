import { ArrowLeft } from 'lucide-react';
import { FaToolbox } from 'react-icons/fa6';
import { SEO } from '../../components/SEO';

export function ComingSoon({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center select-none pt-20">
      <SEO title="Coming Soon" />
      <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/20 mb-8 animate-[bounce_4s_infinite]">
        <span className="text-white text-3xl"><FaToolbox /></span>
      </div>
      <h1 className="font-display text-4xl font-black text-[#0F0A1E] mb-4">Coming Soon</h1>
      <p className="text-neutral-500 max-w-sm mx-auto mb-10">
        This page is currently being built. Qofeno is growing every week, check back soon.
      </p>
      <button 
        onClick={onBack}
        className="flex items-center gap-2 bg-[#0F0A1E] text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>
    </div>
  );
}
