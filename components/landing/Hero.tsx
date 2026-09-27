import { Container } from "@/components/ui/Container";
import { LandingCTA } from "@/components/landing/LandingCTA";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="landing-hero motion-page-enter">
      <Container as="div" width="content" className="landing-hero__content">
        <p className="landing-eyebrow type-label">Your next favorite starts with you</p>
        <p className="landing-brand">MediaPulse</p>
        <h1 id="hero-title" className="landing-hero__title">
          Discover what your movie taste says about you.
        </h1>
        <p className="landing-hero__description">
          Share what you love in an adaptive conversation. MediaPulse turns your
          answers into a movie personality and finds films that fit your taste.
        </p>
        <LandingCTA />
      </Container>
    </section>
  );
}
