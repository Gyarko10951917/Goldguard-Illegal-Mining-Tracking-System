"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { fetchGhanaNews, NewsItem } from "../../services/ghanaNewsService";

// Remove the old interface since we're importing it from the service
// Remove the getMockNewsItems function since we're using the service

const NewsUpdates: React.FC = () => {
	const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
	const [isPaused, setIsPaused] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [lastUpdated, setLastUpdated] = useState<string>("");
	const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
	const [imageLoading, setImageLoading] = useState<Set<string>>(new Set());

	// Function to get reliable image source with fallback
	const getImageSrc = (item: NewsItem): string => {
		if (imageErrors.has(item.id)) {
			return '/assert/ghana-galamsey.jpg';
		}
		
		// Check if the original image URL is from a problematic domain or malformed
		if (!item.imageSrc || 
			item.imageSrc.includes('ghanamma.com') || 
			!item.imageSrc.startsWith('http')) {
			return '/assert/ghana-galamsey.jpg';
		}
		
		return item.imageSrc;
	};

	// Handle image loading errors
	const handleImageError = (itemId: string) => {
		console.log(`Image failed to load for item ${itemId}`);
		setImageErrors(prev => new Set([...prev, itemId]));
		setImageLoading(prev => {
			const newSet = new Set(prev);
			newSet.delete(itemId);
			return newSet;
		});
	};

	// Handle image loading start
	const handleImageLoadStart = (itemId: string) => {
		setImageLoading(prev => new Set([...prev, itemId]));
	};

	// Handle image loading success
	const handleImageLoad = (itemId: string) => {
		setImageLoading(prev => {
			const newSet = new Set(prev);
			newSet.delete(itemId);
			return newSet;
		});
	};

	// Load fresh news from Ghana news APIs and RSS feeds
	const loadGhanaNews = async () => {
		setIsLoading(true);
		
		try {
			console.log('Loading latest news from Ghana sources...');
			
			// Try to fetch real news from APIs
			const freshNews = await fetchGhanaNews();
			
			// Filter and clean news items with problematic images
			const cleanedNews = freshNews.map(item => ({
				...item,
				imageSrc: cleanImageUrl(item.imageSrc)
			}));
			
			setNewsItems(cleanedNews);
			setLastUpdated(new Date().toLocaleString());
			console.log(`Loaded ${cleanedNews.length} news items from Ghana sources`);
		} catch (error) {
			console.error('Failed to load news:', error);
			// Show empty state if API fails
			setNewsItems([]);
			setLastUpdated(new Date().toLocaleString());
		} finally {
			setIsLoading(false);
		}
	};

	// Clean image URLs and provide fallbacks for problematic sources
	const cleanImageUrl = (imageUrl: string): string => {
		if (!imageUrl || !imageUrl.startsWith('http')) {
			return '/assert/ghana-galamsey.jpg';
		}
		
		// Check for known problematic domains
		const problematicDomains = ['ghanamma.com'];
		const isProblematicdomain = problematicDomains.some(domain => imageUrl.includes(domain));
		
		if (isProblematicdomain) {
			return '/assert/ghana-galamsey.jpg';
		}
		
		// Check for malformed URLs (double extensions, etc.)
		if (imageUrl.includes('.webp.webp') || imageUrl.includes('..')) {
			return '/assert/ghana-galamsey.jpg';
		}
		
		return imageUrl;
	};

	useEffect(() => {
		// Load initial news
		const loadInitialNews = async () => {
			setIsLoading(true);
			
			try {
				console.log('Loading latest news from Ghana sources...');
				
				// Try to fetch real news from APIs
				const freshNews = await fetchGhanaNews();
				
				// Filter and clean news items with problematic images
				const cleanedNews = freshNews.map(item => ({
					...item,
					imageSrc: cleanImageUrl(item.imageSrc)
				}));
				
				setNewsItems(cleanedNews);
				setLastUpdated(new Date().toLocaleString());
				console.log(`Loaded ${cleanedNews.length} news items from Ghana sources`);
			} catch (error) {
				console.error('Failed to load news:', error);
				// Show empty state if API fails
				setNewsItems([]);
				setLastUpdated(new Date().toLocaleString());
			} finally {
				setIsLoading(false);
			}
		};

		loadInitialNews();

		// Auto-refresh every 30 minutes to get fresh content
		const interval = setInterval(async () => {
			await loadGhanaNews();
		}, 30 * 60 * 1000);
		
		return () => clearInterval(interval);
	}, []);

	const refreshNews = async () => {
		await loadGhanaNews();
	};

	// Duplicate the array to create seamless loop
	const duplicatedItems = [...newsItems, ...newsItems];

	return (
		<section className="w-full px-4 sm:px-6 lg:px-16 mt-16 overflow-hidden">
			<div className="flex justify-between items-center mb-10">
				<h2 className="text-2xl font-serif font-bold text-black">
					Latest Ghana News & Updates
				</h2>
				<div className="flex items-center space-x-4">
					{lastUpdated && (
						<p className="text-sm text-gray-500">
							Last updated: {lastUpdated}
						</p>
					)}
					<button
						onClick={refreshNews}
						disabled={isLoading}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
					>
						{isLoading ? (
							<>
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
								<span>Loading...</span>
							</>
						) : (
							<>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
								<span>Refresh</span>
							</>
						)}
					</button>
				</div>
			</div>

			{isLoading ? (
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
					<span className="ml-3 text-gray-600">Loading latest Ghana news...</span>
				</div>
			) : newsItems.length === 0 ? (
				<div className="flex flex-col justify-center items-center h-64 text-center">
					<div className="mb-4">
						<svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
						</svg>
					</div>
					<h3 className="text-lg font-semibold text-gray-700 mb-2">No News Available</h3>
					<p className="text-gray-500 mb-4 max-w-md">
						Unable to fetch live news from Ghana sources at this time. This may be due to API limitations or network connectivity issues.
					</p>
					<button
						onClick={refreshNews}
						className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center space-x-2"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						<span>Try Again</span>
					</button>
				</div>
			) : (
				<div className="relative">
					<div
						className="flex gap-6 w-max news-scroll-animation"
						onMouseEnter={() => setIsPaused(true)}
						onMouseLeave={() => setIsPaused(false)}
						data-paused={isPaused}
					>
						{duplicatedItems.map((item, index) => (
							<article
								key={`${item.id}-${index}`}
								className="bg-white text-black rounded-2xl shadow-lg overflow-hidden flex flex-col border border-gray-100 p-2 flex-shrink-0 w-80 hover:scale-105 transition-transform duration-300 cursor-pointer"
								onClick={() => item.url && window.open(item.url, '_blank')}
							>
								<div className="flex-1 flex flex-col justify-between">
									<div className="relative">
										{imageLoading.has(item.id) && (
											<div className="absolute inset-0 bg-gray-200 rounded-xl mb-4 flex items-center justify-center">
												<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
											</div>
										)}
										<Image
											src={getImageSrc(item)}
											alt={item.title}
											width={320}
											height={192}
											className="object-cover w-full h-48 rounded-xl mb-4"
											priority={index < 4} // Prioritize first 4 images
											placeholder="blur"
											blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
											onLoadingComplete={() => handleImageLoad(item.id)}
											onError={() => handleImageError(item.id)}
											onLoad={() => handleImageLoadStart(item.id)}
										/>
										<div 
											className={`absolute top-2 left-2 px-3 py-1 rounded-full text-white text-xs font-semibold ${
												item.source === 'Joy News' ? 'bg-red-600' :
												item.source === 'TV3' ? 'bg-teal-600' :
												item.source === 'Adom TV' ? 'bg-orange-600' :
												'bg-gray-600'
											}`}
										>
											{item.source}
										</div>
										{item.url && (
											<div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
												<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
												</svg>
											</div>
										)}
									</div>
									<div className="px-2 pb-2">
										<h3 className="font-semibold text-lg mb-2 text-center line-clamp-2 hover:text-blue-600">
											{item.title}
										</h3>
										{item.summary && (
											<p className="text-sm text-gray-700 mb-3 text-center line-clamp-2">
												{item.summary}
											</p>
										)}
										<p className="text-sm text-gray-600 text-center">
											By {item.author} | {new Date(item.date).toLocaleDateString()}
										</p>
									</div>
								</div>
							</article>
						))}
					</div>
				</div>
			)}

			<div className="mt-8 text-center">
				<div className="flex justify-center space-x-6 mb-4">
					<div className="flex items-center">
						<div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
						<span className="text-sm text-gray-600">Joy News</span>
					</div>
					<div className="flex items-center">
						<div className="w-3 h-3 rounded-full bg-teal-600 mr-2"></div>
						<span className="text-sm text-gray-600">TV3</span>
					</div>
					<div className="flex items-center">
						<div className="w-3 h-3 rounded-full bg-orange-600 mr-2"></div>
						<span className="text-sm text-gray-600">Adom TV</span>
					</div>
				</div>
				<p className="text-xs text-gray-500">
					Live updates from Ghana&apos;s leading sources about illegal mining and environmental protection - No mock data, only real news
				</p>
			</div>

			<style jsx>{`
				.news-scroll-animation {
					animation: scroll-left 60s linear infinite;
				}

				.news-scroll-animation[data-paused="true"] {
					animation-play-state: paused;
				}

				@keyframes scroll-left {
					0% {
						transform: translateX(0);
					}
					100% {
						transform: translateX(-50%);
					}
				}

				.line-clamp-2 {
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
				}
			`}</style>
		</section>
	);
};

export default NewsUpdates;