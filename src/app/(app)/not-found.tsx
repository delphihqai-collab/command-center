import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-4xl font-bold text-zinc-600">404</p>
      <p className="text-zinc-400">Page not found</p>
      <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300">
        Back to Dashboard
      </Link>
    </div>
  );
}
