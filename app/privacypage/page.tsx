import { Database, Eye, Lock, Shield } from 'lucide-react';
import Footer from '../component/landingpage/footer';
import NavBar from '../component/landingpage/NavBar';

export default function PrivacyPage() {
  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-50 py-12 mt-16">
        <div className="w-full px-4 sm:px-6 lg:px-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center mb-8">
              <Shield className="w-8 h-8 text-amber-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            </div>

            <div className="space-y-8">
              <section>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
                  <p className="text-amber-800">
                    <strong>Last Updated:</strong> January 2024 | 
                    <strong> Effective Date:</strong> January 1, 2024
                  </p>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  GoldGuard is committed to protecting the privacy and security of individuals reporting illegal mining 
                  activities in Ghana. This privacy policy explains how we collect, use, and protect your information 
                  in compliance with Ghana&apos;s Data Protection Act, 2012 (Act 843).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Database className="w-6 h-6 text-blue-600 mr-2" />
                  Information We Collect
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Report Information</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Location of illegal mining activity</li>
                      <li>• Date and time of incident</li>
                      <li>• Description of activities observed</li>
                      <li>• Photos or videos (if provided)</li>
                      <li>• Environmental damage details</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Optional Contact Information</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Name (if you choose to provide)</li>
                      <li>• Phone number (for follow-up)</li>
                      <li>• Email address (for updates)</li>
                      <li>• Community/Region</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Eye className="w-6 h-6 text-green-600 mr-2" />
                  Anonymous Reporting Protection
                </h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Your Identity is Protected</h3>
                  <ul className="text-gray-700 space-y-2">
                    <li>• <strong>Anonymous Reports:</strong> You can submit reports without providing any personal information</li>
                    <li>• <strong>IP Address Protection:</strong> We do not log or store IP addresses from anonymous reports</li>
                    <li>• <strong>Secure Transmission:</strong> All data is encrypted during transmission using SSL/TLS</li>
                    <li>• <strong>No Tracking:</strong> We do not use cookies or tracking technologies for anonymous reports</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-gray-900">Law Enforcement Cooperation</h3>
                    <p className="text-gray-700 text-sm mt-1">
                      Reports are shared with Ghana Police Service, Minerals Commission, and EPA Ghana 
                      for investigation and enforcement purposes.
                    </p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-semibold text-gray-900">Environmental Monitoring</h3>
                    <p className="text-gray-700 text-sm mt-1">
                      Data is used to track illegal mining patterns and environmental damage across Ghana&apos;s regions.
                    </p>
                  </div>
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="font-semibold text-gray-900">Public Awareness</h3>
                    <p className="text-gray-700 text-sm mt-1">
                      Aggregated, non-identifying data may be used for public reports and awareness campaigns.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Lock className="w-6 h-6 text-red-600 mr-2" />
                  Data Security & Protection
                </h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Security Measures</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <ul className="text-gray-700 space-y-2">
                      <li>• <strong>Encryption:</strong> All data encrypted at rest and in transit</li>
                      <li>• <strong>Access Control:</strong> Limited access to authorized personnel only</li>
                      <li>• <strong>Secure Servers:</strong> Data stored on secure servers in Ghana</li>
                    </ul>
                    <ul className="text-gray-700 space-y-2">
                      <li>• <strong>Regular Audits:</strong> Security assessments conducted quarterly</li>
                      <li>• <strong>Data Backup:</strong> Secure backup systems with encryption</li>
                      <li>• <strong>Incident Response:</strong> 24/7 monitoring and response team</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights Under Ghana&apos;s Data Protection Act</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h3 className="font-medium text-gray-900">Right to Access</h3>
                      <p className="text-sm text-gray-600">Request copies of your personal data we hold</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h3 className="font-medium text-gray-900">Right to Rectification</h3>
                      <p className="text-sm text-gray-600">Request correction of inaccurate information</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <h3 className="font-medium text-gray-900">Right to Erasure</h3>
                      <p className="text-sm text-gray-600">Request deletion of your personal data</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h3 className="font-medium text-gray-900">Right to Object</h3>
                      <p className="text-sm text-gray-600">Object to processing of your personal data</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <ul className="text-gray-700 space-y-2">
                    <li>• <strong>Active Reports:</strong> Retained until investigation is complete</li>
                    <li>• <strong>Closed Cases:</strong> Archived for 7 years as required by Ghana law</li>
                    <li>• <strong>Anonymous Reports:</strong> Retained indefinitely for pattern analysis</li>
                    <li>• <strong>Personal Data:</strong> Deleted upon request or after retention period</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Data Protection Officer</h3>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Email:</strong> privacy@goldguard.gov.gh</p>
                    <p><strong>Phone:</strong> +233 302 123 456</p>
                    <p><strong>Address:</strong> Ministry of Environment, Science, Technology & Innovation</p>
                    <p className="text-sm">P.O. Box M.232, Accra, Ghana</p>
                  </div>
                </div>
              </section>

              <div className="bg-blue-100 border border-blue-300 rounded-lg p-6 mt-8">
                <h3 className="font-semibold text-gray-900 mb-2">Changes to This Policy</h3>
                <p className="text-sm text-gray-700">
                  We may update this privacy policy from time to time. Any changes will be posted on this page 
                  with an updated revision date. Continued use of our services after changes constitutes acceptance 
                  of the updated policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};