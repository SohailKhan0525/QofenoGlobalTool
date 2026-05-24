import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { SEO } from '../../components/SEO';

export function Policy() {
  return (
    <div className="min-h-screen bg-white pt-32 md:pt-40 pb-20 px-6 md:px-12">
      <SEO title="Privacy Policy" />
      <div className="max-w-3xl mx-auto">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
          <ShieldCheck className="w-8 h-8 text-purple-600" />
        </div>
        <h1 className="font-black text-3xl md:text-4xl text-[#0F0A1E] mb-4">Privacy Policy</h1>
        <p className="text-neutral-500 mb-10">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-8 text-neutral-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#0F0A1E] mb-3">1. Information Collection</h2>
            <p>We do not store your uploaded files persistently. For paid users, all processing is completely ephemeral. For free users, temporary files are deleted after a maximum of 2 hours.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F0A1E] mb-3">2. Data Security</h2>
            <p>The security of your data is important to us. We use AES-256 bit encryption in transit and rest. Our environments are strictly containerized.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-[#0F0A1E] mb-3">3. Telemetry and Analytics</h2>
            <p>We log aggregate usage statistics such as the number of compression events globally to calculate "views" and "runs". This data never contains personally identifiable information.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F0A1E] mb-3">4. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us via the Contact section.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
