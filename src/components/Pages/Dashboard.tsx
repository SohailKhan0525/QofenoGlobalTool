import { SEO } from '../../components/SEO';

export function Dashboard() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] px-6 pb-20 pt-32">
      <SEO title="Dashboard" description="Your Qofeno account dashboard." />
      <div className="mx-auto max-w-5xl rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-[#0F0A1E]">Dashboard</h1>
        <p className="mt-2 text-neutral-500">This area will show your plan, usage, and recent tool activity.</p>
      </div>
    </div>
  );
}
