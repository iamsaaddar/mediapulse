import Link from "next/link";

export function SiteHeader() {
	return (
		<header className="site-header">
			<div className="site-header__inner">
				<Link className="site-header__brand" href="/" aria-label="MediaPulse home">
					<span className="site-header__mark" aria-hidden="true">✳</span>
					<span>MEDIA<span className="site-header__brand-accent">PULSE</span></span>
				</Link>
				<nav className="site-header__nav" aria-label="Main navigation">
					<Link href="/#how-it-works">The experience</Link>
					<Link className="site-header__cta" href="/quiz">Find my film</Link>
				</nav>
			</div>
		</header>
	);
}
