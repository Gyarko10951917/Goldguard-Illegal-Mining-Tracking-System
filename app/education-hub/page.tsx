"use client";
import { BookOpen, Download, ExternalLink, Eye, Filter, Play, Search } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import Footer from '../component/landingpage/footer';
import NavBar from '../component/landingpage/NavBar';

interface VideoItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  views: string;
  category: string;
  thumbnail: string;
  videoUrl: string;
}

interface ResourceItem {
  id: string;
  title: string;
  type: 'PDF' | 'Article' | 'Guide' | 'Report';
  description: string;
  downloadUrl: string;
  size: string;
  category: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const videos: VideoItem[] = [
  {
    id: '1',
    title: 'Demostration on Illegal Mining Activity (Galamsey) in Ghana',
    description: 'Comprehensive overview of illegal mining activities and their impact on Ghana\'s environment and communities.',
    duration: '12:45',
    views: '15.2K',
    category: 'Environmental Impact',
    thumbnail: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg',
    videoUrl: '/videos/Demonstration.mp4'
  },
  {
    id: '2',
    title: 'Galamsey: The deadly dig for gold - BBC Africa',
    description: 'Step-by-step guide on safely and effectively reporting illegal mining activities to authorities.',
    duration: '8:30',
    views: '9.8K',
    category: 'Environmental Impact',
    thumbnail: 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg',
    videoUrl: '/videos/Galamsey The deadly dig for gold  BBC Africa.mp4'
  },
  {
    id: '3',
    title: 'Illegal mining — polluting Ghana rivers and land',
    description: 'Learn about the health consequences of water pollution caused by illegal mining operations.',
    duration: '15:20',
    views: '12.5K',
    category: 'Health & Safety',
    thumbnail: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg',
    videoUrl: '/videos/Illegal mining — polluting Ghanas rivers and land – DW – 12232024 (1).mp4'
  },
  {
    id: '4',
    title: 'Community Action Against Illegal Mining',
    description: 'Real stories of communities that successfully fought against illegal mining in their areas.',
    duration: '18:15',
    views: '7.3K',
    category: 'Community Action',
    thumbnail: 'https://images.pexels.com/photos/1108117/pexels-photo-1108117.jpeg',
    videoUrl: '/videos/NoToGalamsey Domeabra community in AR resists illegal mining invasion to save the environment.mp4'
  },
  {
    id: '5',
    title: 'Legal Framework: Mining Laws in Ghana',
    description: 'Understanding Ghana\'s mining laws and regulations, penalties for illegal mining.',
    duration: '22:10',
    views: '5.9K',
    category: 'Legal Framework',
    thumbnail: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg',
    videoUrl: '/videos/Mineral Rights & Licence Acquisition in Ghana..mp4'
  },
];

const resources: ResourceItem[] = [
  {
    id: '1',
    title: 'Ghana Mining Laws and Regulations Handbook',
    type: 'PDF',
    description: 'Complete guide to Ghana\'s mining laws, regulations, and compliance requirements. Includes the full text of the Minerals and Mining Act 2006 (Act 703).',
    downloadUrl: 'https://www.mlnr.gov.gh/wp-content/uploads/2024/07/MINERALS-AND-MINING-ACT-2006-ACT-703.pdf',
    size: '2.5 MB',
    category: 'Legal Framework'
  },
  {
    id: '2',
    title: 'Environmental Protection Act 2025 (Act 1124)',
    type: 'PDF',
    description: 'Full text of the Environmental Protection Act 2025 (Act 1124) as published by the EPA Ghana.',
    downloadUrl: 'https://epa.gov.gh/new/wp-content/uploads/2025/01/Environmental-Protection-Act-2025-Act-1124-2.pdf',
    size: '1.2 MB',
    category: 'Legal Framework'
  },
  {
    id: '3',
    title: 'Environmental Impact Assessment Guidelines',
    type: 'Guide',
    description: 'Step-by-step guide for conducting environmental impact assessments for mining projects. Includes LI 1652.',
    downloadUrl: 'https://epa.gov.gh/new/wp-content/uploads/2023/07/LI-1652-1.pdf',
    size: '1.8 MB',
    category: 'Environmental Impact'
  },
  {
    id: '4',
    title: 'Environmental and Social Impact Assessment (ESIA) for DNP',
    type: 'PDF',
    description: 'Comprehensive ESIA report for DNP, provided by EPA Ghana.',
    downloadUrl: 'https://glrssmp.epa.gov.gh/wp-content/uploads/2025/01/P171933-ESIA_DNP.pdf?utm_source=chatgpt.com',
    size: '5.4 MB',
    category: 'Environmental Impact'
  },
  {
    id: '5',
    title: 'GLRSSMP Brochure (Ghana, Feb 2022)',
    type: 'PDF',
    description: 'Official GLRSSMP project brochure for Ghana, published February 2022.',
    downloadUrl: 'https://glrssmp.epa.gov.gh/wp-content/uploads/2022/11/GLRSSMP-brochure_Ghana_Feb-2022.pdf',
    size: '2.1 MB',
    category: 'Environmental Impact'
  },
  {
    id: '7',
    title: 'Health Effects of Mining Pollution Report',
    type: 'Report',
    description: 'Comprehensive research on health impacts of mining-related pollution in Ghana. Includes a review article from ResearchGate.',
    downloadUrl: 'https://ehp.niehs.nih.gov/doi/pdf/10.5696/2156-9614-8.17.43',
    size: '4.1 MB',
    category: 'Health & Safety'
  },
  {
    id: '8',
    title: 'Current Health Effects of Illegal Mining Pollution (Aboabo Stream, Ghana)',
    type: 'PDF',
    description: 'Environmental impacts of illegal small-scale mining activities on the Aboabo Stream, Ahafo Region, Ghana.',
    downloadUrl: 'https://conference.umat.edu.gh/wp-content/uploads/2020/08/Environmental-Impacts-of-Illegal-Small-Scale-Mining-Activities-on-the-Aboabo-Stream-Ahafo-Region-Ghana.pdf',
    size: '1.5 MB',
    category: 'Health & Safety'
  },
  {
    id: '9',
    title: 'Thesis: Effects of Illegal Mining on Water Quality (Asiama, 2019, UCC)',
    type: 'PDF',
    description: 'A thesis from University of Cape Coast (UCC) on the effects of illegal mining on water quality and livelihoods.',
    downloadUrl: 'https://ir.ucc.edu.gh/xmlui/bitstream/handle/123456789/7673/asiama,%202019.pdf?sequence=1',
    size: '2.8 MB',
    category: 'Health & Safety'
  }
];

const faqs: FAQItem[] = [
  {
    id: '1',
    question: 'What is illegal mining (galamsey) and why is it harmful?',
    answer: 'Illegal mining, locally known as "galamsey," refers to mining activities conducted without proper licenses or environmental permits. It\'s harmful because it destroys water bodies, contaminates soil, destroys farmlands, and poses serious health risks to communities through mercury and other chemical pollution.',
    category: 'General'
  },
  {
    id: '2',
    question: 'How can I safely report illegal mining activities?',
    answer: 'You can report through multiple channels: use our online reporting platform, call the Ghana Police Service (191), contact the Minerals Commission, or reach out to the Environmental Protection Agency. You can report anonymously and are protected under Ghana\'s Whistleblower Act.',
    category: 'Reporting'
  },
  {
    id: '3',
    question: 'What happens after I submit a report?',
    answer: 'Your report is reviewed by relevant authorities including the Ghana Police Service, Minerals Commission, and EPA. They will investigate the claims and take appropriate enforcement action. You may be contacted for additional information if you provided contact details.',
    category: 'Reporting'
  },
  {
    id: '4',
    question: 'What are the legal penalties for illegal mining in Ghana?',
    answer: 'Under the Minerals and Mining Act 2006 (Act 703), illegal mining carries penalties of not less than 500 penalty units, imprisonment of not less than 5 years, or both. Equipment used in illegal mining is also forfeited to the state.',
    category: 'Legal'
  },
  {
    id: '5',
    question: 'How does illegal mining affect water quality?',
    answer: 'Illegal mining severely pollutes water bodies through mercury contamination, sedimentation, and chemical runoff. This makes water unsafe for drinking, fishing, and farming, affecting entire communities downstream.',
    category: 'Environmental'
  },
  {
    id: '6',
    question: 'Can communities take legal action against illegal miners?',
    answer: 'Yes, communities can file complaints with authorities, seek injunctions through the courts, and demand compensation for environmental damage. Community members are also protected when reporting illegal activities.',
    category: 'Legal'
  }
];

const EducationPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideoCategory, setSelectedVideoCategory] = useState('All');
  const [selectedResourceCategory, setSelectedResourceCategory] = useState('All');
  const [selectedFAQCategory, setSelectedFAQCategory] = useState('All');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'videos' | 'resources' | 'faqs'>('videos');

  const videoCategories = ['All', 'Environmental Impact', 'Health & Safety', 'Community Action', 'Legal Framework'];
  const resourceCategories = ['All', 'Legal Framework', 'Environmental Impact', 'Health & Safety'];
  const faqCategories = ['All', 'General', 'Reporting', 'Legal', 'Environmental'];

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedVideoCategory === 'All' || video.category === selectedVideoCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedResourceCategory === 'All' || resource.category === selectedResourceCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedFAQCategory === 'All' || faq.category === selectedFAQCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <NavBar hideAdminLogin={true} />
      {/* Add margin-top to prevent content under navbar */}
      <div className="min-h-screen bg-gray-50 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="w-12 h-12 text-amber-600 mr-4" />
              <h1 className="text-4xl font-bold text-gray-900">Education Hub</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Learn about illegal mining, environmental protection, and how you can help safeguard Ghana&#39;s natural resources for future generations.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search videos, resources, and FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 text-gray-600 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'videos', label: 'Educational Videos', icon: Play },
                  { id: 'resources', label: 'Resources & Downloads', icon: Download },
                  { id: 'faqs', label: 'FAQs', icon: BookOpen }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as 'videos' | 'resources' | 'faqs')}
                    className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm ${
                      activeTab === id
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
              {/* Category Filter */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center mb-3">
                  <Filter className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="font-medium text-gray-700">Filter by Category:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {videoCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedVideoCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedVideoCategory === category
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Videos Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                {filteredVideos.map(video => (
                  <div key={video.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
                    <div className="relative w-full h-48 flex items-center justify-center bg-black">
                      <video
                        src={video.videoUrl}
                        controls
                        className="w-full h-full object-cover rounded-t-lg"
                      >
                        Your browser does not support the video tag.
                      </video>
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </div>
                    </div>
                    <div className="p-4 flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{video.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{video.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {video.views} views
                        </div>
                        <span className="bg-gray-100 px-2 py-1 rounded">{video.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              {/* Category Filter */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center mb-3">
                  <Filter className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="font-medium text-gray-700">Filter by Category:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {resourceCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedResourceCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedResourceCategory === category
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resources Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                {filteredResources.map(resource => (
                  <div key={resource.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${
                          resource.type === 'PDF' ? 'bg-red-100 text-red-600' :
                          resource.type === 'Guide' ? 'bg-blue-100 text-blue-600' :
                          resource.type === 'Report' ? 'bg-green-100 text-green-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <Download className="w-5 h-5" />
                        </div>
                        <div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            resource.type === 'PDF' ? 'bg-red-100 text-red-800' :
                            resource.type === 'Guide' ? 'bg-blue-100 text-blue-800' :
                            resource.type === 'Report' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {resource.type}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{resource.size}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{resource.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{resource.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">{resource.category}</span>
                      <a
                        href={resource.downloadUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-amber-600 hover:text-amber-700 font-medium text-sm"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs Tab */}
          {activeTab === 'faqs' && (
            <div className="space-y-6">
              {/* Category Filter */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center mb-3">
                  <Filter className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="font-medium text-gray-700">Filter by Category:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {faqCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedFAQCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedFAQCategory === category
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQs List */}
              <div className="space-y-4 grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
                {filteredFAQs.map(faq => (
                  <div key={faq.id} className="bg-white rounded-lg shadow-sm flex flex-col h-full">
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{faq.question}</h3>
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">{faq.category}</span>
                      </div>
                      <div className={`ml-4 transform transition-transform ${expandedFAQ === faq.id ? 'rotate-180' : ''}`}> 
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {expandedFAQ === faq.id && (
                      <div className="px-6 pb-6">
                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="bg-amber-600 rounded-lg p-8 text-center text-white mt-12">
            <h2 className="text-2xl font-bold mb-4">Ready to Take Action?</h2>
            <p className="text-amber-100 mb-6">
              Use your knowledge to help protect Ghana&#39;s environment. Report illegal mining activities and make a difference.
            </p>
            <Link
              href="/report"
              className="bg-white text-amber-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Report an Incident
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EducationPage;