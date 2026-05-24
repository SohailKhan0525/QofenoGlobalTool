import React from 'react';
import { ShieldCheck, UserCheck } from 'lucide-react';
import { SEO } from '../../components/SEO';

export function Terms() {
  return (
    <div className="min-h-screen bg-white pt-32 md:pt-40 pb-20 px-6 md:px-12">
      <SEO title="Terms of Conditions" />
      <div className="max-w-3xl mx-auto">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
          <UserCheck className="w-8 h-8 text-purple-600" />
        </div>
        <h1 className="font-black text-3xl md:text-4xl text-[#0F0A1E] mb-4">Terms of Conditions</h1>
        <p className="text-neutral-500 mb-10">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-8 text-neutral-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#0F0A1E] mb-3">1. Agreement to Terms</h2>
            <p>By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F0A1E] mb-3">2. Description of Service</h2>
            <p>QofenoOS provides an array of utility tools and APIs designed for file processing, conversion, and data manipulation. The tools are continually updated.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-[#0F0A1E] mb-3">3. Fair Use</h2>
            <p>You agree not to misuse the Services or help anyone else to do so. Our Free plan limits are strictly enforced to ensure fair resources for all users.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F0A1E] mb-3">4. Intellectual Property</h2>
            <p>The Service and its original content, features, and functionality are and will remain the exclusive property of QofenoOS and its licensors.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
