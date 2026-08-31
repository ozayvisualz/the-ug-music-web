import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-zinc-950 text-white">
      <p className="text-6xl font-bold text-yellow-500">404</p>
      <h1 className="text-xl md:text-2xl font-bold mt-4">Page not found</h1>
      <p className="text-zinc-400 text-sm mt-2 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 px-6 py-2.5 rounded-full bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 transition"
      >
        Back to Home
      </Link>
    </div>
  );
}
