import React from 'react';

interface LandingFooterProps {
  onExplore: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onExplore }) => {
  return (
    <footer className="bg-slate-50 pt-20 pb-10 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Brand & Description */}
          <div className="flex flex-col items-start lg:col-span-1">
            <a href="#home" className="flex items-center gap-2 mb-6">
              <span className="text-2xl font-black text-[#1E3A8A] tracking-tight">
                Chikoo
              </span>
            </a>
            <p className="text-sm text-slate-600 mb-8 leading-relaxed">
              Chikoo is dedicated to making AI education easy and accessible for all students.
              Trusted by users in schools and institutions across India and globally.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/shauryahelps?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-pink-500 hover:border-pink-500 transition-colors shadow-sm"
              >
                <span className="sr-only">Instagram</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col">
            <h4 className="font-bold text-slate-900 mb-6">Quick Links</h4>
            <ul className="space-y-4">
              {['Home', 'Features', 'Why Chikoo', 'Download'].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
              <li>
                <button
                  onClick={onExplore}
                  className="text-sm text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Learning Universe Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="flex flex-col">
            <h4 className="font-bold text-slate-900 mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-slate-600">
              <li>Help Center</li>
              <li>Terms & Conditions</li>
              <li>Privacy Policy</li>
              <li>Accessibility</li>
            </ul>
          </div>

          {/* LEAP STARTUP */}
          <div className="flex flex-col items-start lg:items-end text-left lg:text-right">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-8 h-8 rounded-md overflow-hidden shadow-sm border border-slate-200">
                <img
                  src="/enterprenex_logo.jpeg"
                  alt="LEAP Startup Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-black text-slate-800 tracking-tight">
                LEAP STARTUP
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-[200px]">
              Building the future of education with AI.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500 font-medium">
            © 2025–2026 Chikoo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
