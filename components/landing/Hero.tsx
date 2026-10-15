import { Container } from "@/components/ui/Container";
import { LandingCTA } from "@/components/landing/LandingCTA";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="landing-hero motion-page-enter">
      <Container as="div" width="content" className="landing-hero__layout">
        <div className="landing-hero__content">
          <p className="landing-eyebrow type-label">Your personal cinema</p>
          <h1 id="hero-title" className="landing-hero__title">
            Some nights call for a certain kind of story.
          </h1>
          <p className="landing-hero__description">
            A little romance. A little mystery. Something that stays with you
            long after the credits.
          </p>
          <LandingCTA />
          <p className="landing-hero__microcopy">A few choices. A film worth watching.</p>
        </div>
        <div className="landing-hero__art" aria-hidden="true">
          <div className="landing-hero__light" />
          <div className="landing-hero__poster">
            <span className="landing-hero__poster-kicker">A night at the movies</span>
            <span className="landing-hero__poster-title">Find the story<br />that stays.</span>
            <span className="landing-hero__poster-rule" />
            <span className="landing-hero__poster-footer">MEDIA PULSE · PERSONAL CINEMA</span>
          </div>
          <span className="landing-hero__art-note">Your next film begins with you</span>
        </div>
      </Container>
    </section>
  );
}
