export function AppFooter() {
  return (
    <footer className="border-t border-zinc-800/60 bg-zinc-950 mt-8">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">Get TheUgMusic App</h2>
          <p className="text-sm text-zinc-400 mt-1.5">Stream Ugandan music anywhere, anytime. Available on iPhone and Android.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://apps.apple.com/app/idYOUR_APP_ID"
            target="_blank"
            rel="noopener noreferrer"
            className="block transition-all duration-200 ease-out hover:scale-[1.03] active:scale-[0.98] hover:drop-shadow-[0_0_12px_rgba(234,179,8,0.35)]"
            aria-label="Download on the App Store"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/app-store-button-small.png"
              alt="Download on the App Store"
              className="w-36 md:w-40 h-auto object-contain"
            />
          </a>

          <a
            href="https://play.google.com/store/apps/details?id=com.theugmusic.app"
            target="_blank"
            rel="noopener noreferrer"
            className="block transition-all duration-200 ease-out hover:scale-[1.03] active:scale-[0.98] hover:drop-shadow-[0_0_12px_rgba(234,179,8,0.35)]"
            aria-label="Get it on Google Play"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/google-play-button-small.png"
              alt="Get it on Google Play"
              className="w-36 md:w-40 h-auto object-contain"
            />
          </a>
        </div>

        <div className="text-center mt-6 pt-4 border-t border-zinc-800/60">
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} TheUgMusic. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
