import Link from 'next/link';

export default function Footer() {
  return (
    <>
      <div style={{ height: '20px' }}></div>
      <footer className="bg-[#1a180b] text-[#ffe066] py-4 text-center w-full">
        <div className="px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center w-full">
          <div className="mb-4 md:mb-0 space-x-6">
          <Link href="/contactus" className="hover:underline">
            Contact Us
          </Link>
          <Link href="/legalpage" className="hover:underline">
            Legal
          </Link>
            <Link href="/privacypage" className="hover:underline">
              Privacy Policy
            </Link>
          </div>
          <div className="flex space-x-6 mb-4 md:mb-0">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="20" height="20"><path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.724-.949.555-2.005.959-3.127 1.184-.897-.959-2.178-1.559-3.594-1.559-2.717 0-4.92 2.203-4.92 4.917 0 .39.045.765.127 1.124-4.083-.205-7.702-2.158-10.126-5.134-.423.722-.666 1.561-.666 2.475 0 1.708.87 3.213 2.188 4.096-.807-.026-1.566-.247-2.228-.616v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.417-1.68 1.318-3.809 2.105-6.102 2.105-.39 0-.779-.023-1.17-.067 2.179 1.394 4.768 2.209 7.557 2.209 9.054 0 14-7.496 14-13.986 0-.21 0-.423-.015-.633.962-.689 1.8-1.56 2.46-2.548l-.047-.02z"/></svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="20" height="20"><path d="M22.675 0h-21.35c-.733 0-1.325.592-1.325 1.325v21.351c0 .732.592 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.466.099 2.797.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.763v2.312h3.59l-.467 3.622h-3.123v9.293h6.116c.732 0 1.324-.592 1.324-1.324v-21.35c0-.733-.592-1.325-1.324-1.325z"/></svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="20" height="20"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.35 3.608 1.325.975.975 1.263 2.242 1.325 3.608.058 1.266.07 1.645.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.35 2.633-1.325 3.608-.975.975-2.242 1.263-3.608 1.325-1.266.058-1.645.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.35-3.608-1.325-.975-.975-1.263-2.242-1.325-3.608-.058-1.266-.07-1.645-.07-4.85s.012-3.584.07-4.85c.062-1.366.35-2.633 1.325-3.608.975-.975 2.242-1.263 3.608-1.325 1.266-.058 1.645-.07 4.85-.07zm0-2.163c-3.259 0-3.667.012-4.947.07-1.281.059-2.563.27-3.637 1.344-1.074 1.074-1.285 2.356-1.344 3.637-.058 1.28-.07 1.688-.07 4.947s.012 3.667.07 4.947c.059 1.281.27 2.563 1.344 3.637 1.074 1.074 2.356 1.285 3.637 1.344 1.28.058 1.688.07 4.947.07s3.667-.012 4.947-.07c1.281-.059 2.563-.27 3.637-1.344 1.074-1.074 1.285-2.356 1.344-3.637.058-1.28.07-1.688.07-4.947s-.012-3.667-.07-4.947c-.059-1.281-.27-2.563-1.344-3.637-1.074-1.074-2.356-1.285-3.637-1.344-1.28-.058-1.688-.07-4.947-.07z"/><path d="M12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998z"/><circle cx="18.406" cy="5.594" r="1.44"/></svg>
            </a>
          </div>
        </div>
        <div className="text-center text-sm mt-4">
          © 2024 GoldGuard. All rights reserved.
        </div>
      </footer>
    </>
  );
}
