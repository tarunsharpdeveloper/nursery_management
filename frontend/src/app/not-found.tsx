import Link from "next/link";

export default function NotFound() {
  return (
    <main className="section">
      <p className="eyebrow">Not Found</p>
      <h1>Page not found</h1>
      <p className="meta">The page you requested does not exist.</p>
      <Link className="button" href="/">
        Go Home
      </Link>
    </main>
  );
}
