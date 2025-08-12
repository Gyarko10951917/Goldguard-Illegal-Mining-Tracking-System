"use client";

import { AlertTriangle, CheckCircle, Clock, Mail, MapPin, Phone, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import Footer from '../component/landingpage/footer';
import NavBar from '../component/landingpage/NavBar';
import { getSavedLegalContacts, LegalContacts } from '../utils/legalContacts';

interface ContactFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  region: string;
  subject: string;
  message: string;
}

export default function ContactUs() {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    phoneNumber: '',
    email: '',
    region: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [legalContacts, setLegalContacts] = useState<LegalContacts>({
    epaContact: '+233 302 664 697',
    policeContact: '191',
    miningCommissionContact: '+233 302 665 064'
  });

  // Load saved legal contacts
  useEffect(() => {
    setLegalContacts(getSavedLegalContacts());
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/report/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isAnonymous: !formData.fullName && !formData.phoneNumber && !formData.email
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus('success');
        
        // Store the new case in localStorage for the admin dashboard
        const existingCases = JSON.parse(localStorage.getItem('submittedCases') || '[]');
        const updatedCases = [...existingCases, result.case];
        localStorage.setItem('submittedCases', JSON.stringify(updatedCases));
        
        // Reset form after successful submission
        setFormData({
          fullName: '',
          phoneNumber: '',
          email: '',
          region: '',
          subject: '',
          message: ''
        });

        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(result.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitStatus('error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-50 py-12 mt-16">
        <div className="w-full px-4 sm:px-6 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-8">
                <Phone className="w-8 h-8 text-amber-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
              </div>

              <div className="space-y-8">
                <section>
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                      <h3 className="font-semibold text-red-800">Emergency Reporting</h3>
                    </div>
                    <p className="text-red-700 text-sm mt-1">
                      For immediate threats to life or ongoing illegal mining activities
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-red-100 rounded-lg text-center">
                      <h3 className="font-semibold text-gray-900">Ghana Police Service</h3>
                      <p className="text-2xl font-bold text-red-600">{legalContacts.policeContact}</p>
                      <p className="text-sm text-gray-600">24/7 Emergency Line</p>
                    </div>
                    <div className="p-4 bg-red-100 rounded-lg text-center">
                      <h3 className="font-semibold text-gray-900">Fire Service</h3>
                      <p className="text-2xl font-bold text-red-600">192</p>
                      <p className="text-sm text-gray-600">Environmental Emergencies</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Government Agencies</h2>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <Shield className="w-6 h-6 text-blue-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Minerals Commission</h3>
                        <p className="text-sm text-gray-600 mb-2">Mining regulation and oversight</p>
                        <div className="space-y-1 text-gray-600 text-sm">
                          <p><Phone className="w-4 h-4 inline mr-1" /> {legalContacts.miningCommissionContact}</p>
                          <p><Mail className="w-4 h-4 inline mr-1" /> info@mincom.gov.gh</p>
                          <p><MapPin className="w-4 h-4 inline mr-1" /> Switchback Rd, Cantonments, Accra</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <Shield className="w-6 h-6 text-green-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Environmental Protection Agency</h3>
                        <p className="text-sm text-gray-600 mb-2">Environmental compliance and protection</p>
                        <div className="space-y-1 text-gray-600 text-sm">
                          <p><Phone className="w-4 h-4 inline mr-1" /> {legalContacts.epaContact}</p>
                          <p><Mail className="w-4 h-4 inline mr-1" /> info@epa.gov.gh</p>
                          <p><MapPin className="w-4 h-4 inline mr-1" /> Ministries, Accra</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <Shield className="w-6 h-6 text-purple-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Water Resources Commission</h3>
                        <p className="text-sm text-gray-600 mb-2">Water body protection and management</p>
                        <div className="space-y-1 text-gray-600 text-sm">
                          <p><Phone className="w-4 h-4 inline mr-1" /> +233 302 784 301</p>
                          <p><Mail className="w-4 h-4 inline mr-1" /> info@wrc.gov.gh</p>
                          <p><MapPin className="w-4 h-4 inline mr-1" /> Airport Residential Area, Accra</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Regional Offices</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <h3 className="font-medium text-gray-900">Ashanti Region</h3>
                      <p className="text-sm text-gray-600">+233 322 025 678</p>
                      <p className="text-xs text-gray-500">Kumasi Office</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <h3 className="font-medium text-gray-900">Western Region</h3>
                      <p className="text-sm text-gray-600">+233 312 023 456</p>
                      <p className="text-xs text-gray-500">Takoradi Office</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <h3 className="font-medium text-gray-900">Eastern Region</h3>
                      <p className="text-sm text-gray-600">+233 342 027 890</p>
                      <p className="text-xs text-gray-500">Koforidua Office</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <h3 className="font-medium text-gray-900">Central Region</h3>
                      <p className="text-sm text-gray-600">+233 332 021 234</p>
                      <p className="text-xs text-gray-500">Cape Coast Office</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Submit a Report</h2>
              
              {/* Success Message */}
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircle className="text-green-600" size={20} />
                  <div>
                    <h4 className="font-semibold text-green-800">Report Submitted Successfully</h4>
                    <p className="text-green-700">Thank you for your report. Our team will review it shortly.</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <AlertTriangle className="text-red-600" size={20} />
                  <div>
                    <h4 className="font-semibold text-red-800">Submission Failed</h4>
                    <p className="text-red-700">There was an error submitting your report. Please try again.</p>
                  </div>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name (Optional)
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full text-sm text-gray-600 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full text-sm text-gray-600 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="+233 XX XXX XXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full text-sm text-gray-600 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region/Location *
                  </label>
                  <select
                    title="Region/Location"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full text-sm text-gray-600 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">Select Region</option>
                    <option value="Greater Accra">Greater Accra</option>
                    <option value="Ashanti">Ashanti</option>
                    <option value="Western">Western</option>
                    <option value="Eastern">Eastern</option>
                    <option value="Central">Central</option>
                    <option value="Northern">Northern</option>
                    <option value="Upper East">Upper East</option>
                    <option value="Upper West">Upper West</option>
                    <option value="Volta">Volta</option>
                    <option value="Brong Ahafo">Brong Ahafo</option>
                    <option value="Western North">Western North</option>
                    <option value="Ahafo">Ahafo</option>
                    <option value="Bono">Bono</option>
                    <option value="Bono East">Bono East</option>
                    <option value="Oti">Oti</option>
                    <option value="North East">North East</option>
                    <option value="Savannah">Savannah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    title="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full text-sm text-gray-600 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">Select Subject</option>
                    <option value="Illegal Mining">Report Illegal Mining</option>
                    <option value="Environmental Damage">Environmental Damage</option>
                    <option value="Water Pollution">Water Body Pollution</option>
                    <option value="Forest Destruction">Forest Destruction</option>
                    <option value="Land Degradation">Land Degradation</option>
                    <option value="Community Impact">Community Impact</option>
                    <option value="Safety Concerns">Safety Concerns</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    rows={6}
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full text-sm text-gray-600 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Please provide detailed information about the incident, including location, date, time, and description of activities..."
                    required
                  ></textarea>
                </div>

                {/* Anonymous Reporting Notice */}
                {!formData.fullName && !formData.phoneNumber && !formData.email ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Shield className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-blue-900">Anonymous Report</h3>
                    </div>
                    <p className="text-sm text-blue-800">
                      Your report will be submitted anonymously. We cannot follow up directly, 
                      but your information will still be valuable for our investigations.
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Shield className="w-5 h-5 text-green-600 mr-2" />
                      <h3 className="font-medium text-green-900">Identified Report</h3>
                    </div>
                    <p className="text-sm text-green-800">
                      Contact information provided. We may follow up with you regarding this report if needed.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="animate-spin" size={20} />
                      Submitting Report...
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Office Hours */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Clock className="w-6 h-6 text-amber-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Office Hours</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <h3 className="font-medium text-gray-900">Emergency Line</h3>
                <p className="text-sm text-gray-600">24/7 Available</p>
                <p className="text-xs text-gray-500">Police: 191</p>
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900">Government Offices</h3>
                <p className="text-sm text-gray-600">Mon - Fri: 8:00 AM - 5:00 PM</p>
                <p className="text-xs text-gray-500">Closed on public holidays</p>
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900">Online Reporting</h3>
                <p className="text-sm text-gray-600">24/7 Available</p>
                <p className="text-xs text-gray-500">Submit reports anytime</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}