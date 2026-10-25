import styles from "./landing.module.css";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { LandingCTA } from "@/components/landing/LandingCTA";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className={styles.cinemaHero}>
      <Image className={styles.cinemaHero__backdrop} src="/images/mediapulse/landing-page.jpg" alt="" fill priority sizes="100vw" />
      <div className={styles.cinemaHero__shade} aria-hidden="true" />
      <Container as="div" width="content" className={styles.cinemaHero__layout}>
        <div className={styles.cinemaHero__content}>
          <p className={styles.cinemaHero__eyebrow}>
            <span aria-hidden="true" />
            Your personal film discovery
          </p>
          <h1 id="hero-title" className={styles.cinemaHero__title}>
            Somewhere between what you love and what you&apos;ll love next.
          </h1>
          <p className={styles.cinemaHero__description}>
            Tell us about a film that means something to you. We&apos;ll uncover
            the stories, moods, and worlds worth discovering next.
          </p>
          <LandingCTA
            className={styles.cinemaHero__cta}
            label="Discover your next favorite film"
          />
          <p className={styles.cinemaHero__microcopy}>
            A personal conversation. Seven films to explore.
          </p>
        </div>
        <span className={styles.cinemaHero__frameMark} aria-hidden="true">
          <span>MP</span>
          <span>01 / 07</span>
        </span>
      </Container>
    </section>
  );
}
