import { Container } from "@/components/ui/Container";
import { LandingCTA } from "@/components/landing/LandingCTA";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="landing-hero">
      <div className="landing-hero__curtain landing-hero__curtain--left" aria-hidden="true" />
      <div className="landing-hero__curtain landing-hero__curtain--right" aria-hidden="true" />
      <Container as="div" width="content" className="landing-hero__layout">
        <div className="landing-hero__content">
          <p className="landing-eyebrow type-label">
            <span className="landing-eyebrow__light" aria-hidden="true" />
            MediaPulse presents
          </p>
          <h1 id="hero-title" className="landing-hero__title">
            Your next
            <br />
            <em>great story</em>
            <br />
            is waiting.
          </h1>
          <p className="landing-hero__description">
            Tell us what moves you. We&apos;ll find the film that feels like it
            was made for tonight.
          </p>
          <LandingCTA />
          <p className="landing-hero__microcopy">
            <span aria-hidden="true">✳</span> Your own little premiere
          </p>
        </div>
        <div className="landing-hero__art" aria-hidden="true">
          <div className="landing-hero__spotlight" />
          <div className="landing-hero__screen">
            <div className="landing-hero__screen-stars" />
            <div className="landing-hero__screen-horizon" />
            <div className="landing-hero__screen-copy">
              <span>TONIGHT&apos;S FEATURE</span>
              <strong>A film<br />with your<br /><i>name on it.</i></strong>
              <span className="landing-hero__screen-rule" />
              <small>ONE NIGHT · YOUR STORY</small>
            </div>
          </div>
          <div className="landing-hero__ticket">
            <span>ADMIT ONE</span>
            <strong>YOUR<br />NEXT<br />FAVORITE</strong>
            <span>ROW ∞ &nbsp; SEAT 01</span>
          </div>
          <span className="landing-hero__art-caption">THE HOUSE IS YOURS</span>
        </div>
      </Container>
      <a className="landing-hero__scroll" href="#how-it-works">
        <span>Take your seat</span>
        <span aria-hidden="true">↓</span>
      </a>
    </section>
  );
}
