import { SEO } from '../../components/SEO';

export function NotFound({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] px-6 pb-20 pt-32 flex items-center justify-center">
      <SEO title="Page not found" description="The requested page does not exist." />
      <div className="max-w-md rounded-3xl border border-neutral-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-4xl font-black text-[#0F0A1E]">404</h1>
        <p className="mt-3 text-neutral-500">That page does not exist.</p>
        <button onClick={() => onNavigate('home')} className="mt-6 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white">
          Back home
        </button>
      </div>
    </div>
  );
}
