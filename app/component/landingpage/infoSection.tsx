
import { AlertTriangle, Leaf, Shield, Users } from 'lucide-react';

const InfoSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-amber-50 to-yellow-50 py-16 mt-16">
      <div className="w-full px-4 sm:px-6 lg:px-16">
        <div className="mb-12">
          <div className="flex items-center mb-8">
            <Shield className="w-8 h-8 text-amber-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Protecting Ghana&apos;s Natural Heritage</h1>
          </div>
          <p className="text-lg text-gray-700 mb-8">
            Join the nationwide effort to combat illegal mining (galamsey) and preserve Ghana&apos;s water bodies, forests, and agricultural lands for future generations.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Key Issues */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Key Issues</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Environmental Impact</h3>
                <p className="text-gray-600">
                  Illegal mining destroys water bodies, contaminates drinking water sources, and damages agricultural lands across Ghana.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Community Protection</h3>
                <p className="text-gray-600">
                  Local communities suffer from polluted water, destroyed farmlands, and health issues caused by illegal mining activities.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Leaf className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Forest Conservation</h3>
                <p className="text-gray-600">
                  Protecting Ghana&apos;s forest reserves and biodiversity from destruction by unauthorized mining operations.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Collective Action</h3>
                <p className="text-gray-600">
                  Every citizen has a role to play in reporting illegal mining and supporting sustainable development initiatives.
                </p>
              </div>
            </div>
          </div>
          {/* Right Column: Why Report & Hotline */}
          <div className="flex flex-col gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Why Your Report Matters</h2>
              <ul className="space-y-4 text-gray-700">
                <li>Helps authorities respond quickly to illegal mining activities</li>
                <li>Protects water sources for millions of Ghanaians</li>
                <li>Preserves agricultural lands for food security</li>
                <li>Supports sustainable mining practices</li>
              </ul>
              <div className="text-center mt-8">
                <img
                  src="/assert/mm.jpg"
                  alt="Ghana mining landscape"
                  className="rounded-xl shadow-md w-full h-64 object-cover mb-4"
                />
                <a 
                  href="/report" 
                  className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Make a Report Now
                </a>
              </div>
            </div>
            <div className="bg-amber-100 border border-amber-300 rounded-lg p-6 text-center">
              <h4 className="text-lg font-bold text-amber-800 mb-2">
                Emergency Reporting Hotline
              </h4>
              <p className="text-amber-700 mb-3">
                For immediate threats to water bodies or ongoing illegal mining activities
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <span className="text-2xl font-bold text-amber-800">📞 +233-302-779300</span>
                <span className="text-lg text-amber-700">(302-779300)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoSection;
