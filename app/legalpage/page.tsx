import { AlertTriangle, FileText, Scale } from 'lucide-react';
import Footer from '../component/landingpage/footer';
import NavBar from '../component/landingpage/NavBar';

export default function LegalPage() {
  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-50 py-12 mt-16">
        <div className="w-full px-4 sm:px-6 lg:px-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center mb-8">
              <Scale className="w-8 h-8 text-amber-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Legal Framework</h1>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
                  Ghana&apos;s Laws Against Illegal Mining (Galamsey)
                </h2>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <p className="text-red-700 font-medium">
                    Illegal mining activities in Ghana are punishable by law under various acts and regulations.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Minerals and Mining Act, 2006 (Act 703)</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Section 99: Penalties for mining without license</li>
                      <li>• Fine: Not less than 500 penalty units</li>
                      <li>• Imprisonment: Not less than 5 years or both</li>
                      <li>• Equipment forfeiture to the state</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Water Resources Commission Act, 1996 (Act 522)</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Prohibits pollution of water bodies</li>
                      <li>• Fine: Up to 2,000 penalty units</li>
                      <li>• Imprisonment: Up to 2 years or both</li>
                      <li>• Restoration costs borne by offender</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Environmental Protection Laws</h2>
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-gray-900">Environmental Protection Agency Act, 1994 (Act 490)</h3>
                    <p className="text-gray-700 text-sm mt-1">
                      Requires Environmental Impact Assessment (EIA) for all mining activities. 
                      Violations carry fines up to 1,000 penalty units and/or 2 years imprisonment.
                    </p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-gray-900">Forest Protection Act, 1927 (Cap 157)</h3>
                    <p className="text-gray-700 text-sm mt-1">
                      Prohibits mining in forest reserves without proper authorization. 
                      Penalties include restoration costs and criminal prosecution.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Reporting Illegal Mining</h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Legal Protection for Whistleblowers</h3>
                  <ul className="text-gray-700 space-y-2">
                    <li>• <strong>Whistleblower Act, 2006 (Act 720):</strong> Protects individuals reporting illegal activities</li>
                    <li>• <strong>Anonymous Reporting:</strong> Reports can be made without revealing identity</li>
                    <li>• <strong>Legal Immunity:</strong> Protection from retaliation or prosecution</li>
                    <li>• <strong>Reward System:</strong> Monetary rewards for information leading to successful prosecution</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Enforcement Agencies</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900">Ghana Police Service</h3>
                    <p className="text-sm text-gray-600 mt-1">Primary law enforcement</p>
                    <p className="text-xs text-gray-500 mt-2">Emergency: 191</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900">Minerals Commission</h3>
                    <p className="text-sm text-gray-600 mt-1">Mining regulation oversight</p>
                    <p className="text-xs text-gray-500 mt-2">Tel: +233 302 665 064</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900">EPA Ghana</h3>
                    <p className="text-sm text-gray-600 mt-1">Environmental protection</p>
                    <p className="text-xs text-gray-500 mt-2">Tel: +233 302 664 697</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Recent Legal Updates</h2>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-gray-900">Mining (Amendment) Act, 2019</h3>
                      <p className="text-sm text-gray-600">Increased penalties and strengthened enforcement mechanisms</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <FileText className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-gray-900">Operation Halt II (2021)</h3>
                      <p className="text-sm text-gray-600">Military-led operation to combat illegal mining activities</p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="bg-amber-100 border border-amber-300 rounded-lg p-6 mt-8">
                <h3 className="font-semibold text-gray-900 mb-2">Disclaimer</h3>
                <p className="text-sm text-gray-700">
                  This information is provided for educational purposes only and does not constitute legal advice. 
                  For specific legal matters, please consult with a qualified legal professional in Ghana.
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