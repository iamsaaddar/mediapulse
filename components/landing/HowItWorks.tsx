import { Container } from "@/components/ui/Container";

const steps = [
  {
    number: "01",
    title: "Start with a favorite",
    description: "Tell us about the movie that means the most to you.",
  },
  {
    number: "02",
    title: "Follow your curiosity",
    description:
      "A thoughtful, adaptive conversation gets to know what you look for in a story.",
  },
  {
    number: "03",
    title: "Find your next film",
    description:
      "Explore five verified recommendations with reasons grounded in your answers.",
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-title"
      className="landing-steps page-section--compact"
    >
      <Container as="div" width="content">
        <div className="landing-steps__heading">
          <p className="type-label text-accent">A little about your taste</p>
          <h2 id="how-it-works-title">The best recommendations begin with a conversation.</h2>
        </div>
        <ol className="landing-steps__grid">
          {steps.map((step) => (
            <li className="landing-steps__item" key={step.number}>
              <div className="landing-step-card">
                <span className="landing-step-card__number" aria-hidden="true">
                  {step.number}
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
