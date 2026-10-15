import { Container } from "@/components/ui/Container";
import { LandingCTA } from "@/components/landing/LandingCTA";

const steps = [
  {
    number: "01",
    title: "Name a favorite",
    description: "Give us one film you love. Any film.",
  },
  {
    number: "02",
    title: "Follow the feeling",
    description: "A few thoughtful questions find your kind of story.",
  },
  {
    number: "03",
    title: "Meet your next favorite",
    description: "Get five handpicked films, each with a reason to press play.",
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-title"
      className="landing-steps page-section--compact"
      id="how-it-works"
    >
      <Container as="div" width="content">
        <div className="landing-steps__heading">
          <p className="type-label text-accent">A little pre-show ritual</p>
          <h2 id="how-it-works-title">Three acts. One very good movie night.</h2>
        </div>
        <ol className="landing-steps__grid">
          {steps.map((step) => (
            <li className="landing-steps__item" key={step.number}>
              <div className="landing-step-card">
                <span className="landing-step-card__number" aria-hidden="true">
                  <span>{step.number}</span>
                  <span className="landing-step-card__spark">✳</span>
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
      <Container as="div" width="content" className="landing-finale">
        <div className="landing-finale__ornament" aria-hidden="true">
          ✳
        </div>
        <p className="type-label">The lights are dimming</p>
        <h2>Your seat is waiting.</h2>
        <LandingCTA />
        <p className="landing-finale__note">No endless scrolling. Just your next great story.</p>
      </Container>
    </section>
  );
}
