import Link from "next/link";

export function LandingCTA() {
  return (
    <Link className="landing-cta" href="/quiz">
      Discover Your Movie Vibe
      <span aria-hidden="true">→</span>
    </Link>
  );
}
