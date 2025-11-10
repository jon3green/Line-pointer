'use client';

import Link from 'next/link';
import { Heart, Github, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-16 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>by sports analytics enthusiasts</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link href="/legal/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
              Terms of Service
            </Link>
            <Link href="/legal/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
              Privacy Policy
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            Disclaimer: This is a prediction and analytics tool. Not intended for actual gambling.
            Always gamble responsibly and within your means.
          </p>
          <p className="mt-2">
            © 2025 LinePointer. All predictions are for informational purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}

