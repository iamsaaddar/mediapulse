import styles from "./landing.module.css";
import { cxModule } from "@/lib/utils";
import { Container } from "@/components/ui/Container";
import { LandingCTA } from "@/components/landing/LandingCTA";

const steps = [
  {
    number: "01",
    title: "Name one film",
    description: "Start with a story you love.",
  },
  {
    number: "02",
    title: "Choose the feeling",
    description: "A short conversation finds your thread.",
  },
  {
    number: "03",
    title: "Find what’s next",
    description: "Seven films, chosen around your taste.",
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-title"
      className={cxModule(styles, "landing-steps page-section--compact")}
      id="how-it-works"
    >
      <Container as="div" width="content">
        <div className={cxModule(styles, "landing-steps__heading")}>
          <p className="type-label text-accent">Your next movie night</p>
          <h2 id="how-it-works-title">A few thoughtful choices. A film that fits.</h2>
        </div>
        <ol className={cxModule(styles, "landing-steps__grid")}>
          {steps.map((step) => (
            <li className={cxModule(styles, "landing-steps__item")} key={step.number}>
              <div className={cxModule(styles, "landing-step-card")}>
                <span className={cxModule(styles, "landing-step-card__number")} aria-hidden="true">
                  <span>{step.number}</span>
                  <span className={cxModule(styles, "landing-step-card__spark")}>✳</span>
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
      <Container as="div" width="content" className={cxModule(styles, "landing-finale")}>
        <div className={cxModule(styles, "landing-finale__ornament")} aria-hidden="true">
          ✳
        </div>
        <p className="type-label">The lights are dimming</p>
        <h2>Your seat is waiting.</h2>
        <LandingCTA />
        <p className={cxModule(styles, "landing-finale__note")}>Made for your kind of movie night.</p>
      </Container>
    </section>
  );
}
