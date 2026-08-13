export function AppFooter() {
  return (
    <footer className="border-t border-zinc-800/60 bg-zinc-950 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-sm font-semibold text-white">Get TheUgMusic App</p>
            <p className="text-xs text-zinc-500 mt-1">Stream and download Ugandan music on the go</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Google Play Button */}
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 bg-black border border-zinc-700 hover:border-zinc-500 rounded-lg px-4 py-2 transition"
            >
              <svg viewBox="0 0 512 512" className="w-6 h-6" fill="none">
                <path fill="#00D7FE" d="M313.5 251.9l-60.8 60.8-66.4-66.4 66.4-66.4z"/>
                <path fill="#FF3A44" d="M99.9 61.9c-3.8 6.5-5.9 14.2-5.9 22.7v342.8c0 8.5 2.1 16.2 5.9 22.7l190-194.1z"/>
                <path fill="#00F076" d="M313.5 251.9L419 357.4c7.4-4.2 12.8-11 12.8-20.9V175.5c0-9.9-5.4-16.7-12.8-20.9z"/>
                <path fill="#FFCE00" d="M313.5 251.9L99.9 61.9c8.3-8.3 21.7-9.5 33.8-2.6l178.7 131.8z"/>
              </svg>
              <span className="text-left leading-tight">
                <span className="block text-[10px] text-zinc-400 uppercase tracking-wide">Get it on</span>
                <span className="block text-sm font-semibold text-white">Google Play</span>
              </span>
            </a>

            {/* App Store Button */}
            <a
              href="https://www.apple.com/app-store/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 bg-black border border-zinc-700 hover:border-zinc-500 rounded-lg px-4 py-2 transition"
            >
              <svg viewBox="0 0 384 512" className="w-6 h-6" fill="white">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
              </svg>
              <span className="text-left leading-tight">
                <span className="block text-[10px] text-zinc-400 uppercase tracking-wide">Download on the</span>
                <span className="block text-sm font-semibold text-white">App Store</span>
              </span>
            </a>
          </div>
        </div>

        <div className="text-center mt-8 pt-6 border-t border-zinc-800/60">
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} TheUgMusic. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
