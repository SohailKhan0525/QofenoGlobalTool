import { SEO } from '../../components/SEO';

export function Profile() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] px-6 pb-20 pt-32">
      <SEO title="Profile" description="Manage your Qofeno profile." />
      <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-[#0F0A1E]">Profile</h1>
        <p className="mt-2 text-neutral-500">Manage your display name and account details here.</p>
      </div>
    </div>
  );
}
