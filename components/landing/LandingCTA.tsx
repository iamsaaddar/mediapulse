import Link from "next/link";

export function LandingCTA() {
  return (
    <Link className="landing-cta" href="/quiz">
      Find my film <span aria-hidden="true">↗</span>
    </Link>
  );
}
