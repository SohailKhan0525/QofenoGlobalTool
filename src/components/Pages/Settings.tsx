import { SEO } from '../../components/SEO';

export function Settings() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] px-6 pb-20 pt-32">
      <SEO title="Settings" description="Adjust your Qofeno preferences." />
      <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-[#0F0A1E]">Settings</h1>
        <p className="mt-2 text-neutral-500">Notification, security, and billing settings will live here.</p>
      </div>
    </div>
  );
}
