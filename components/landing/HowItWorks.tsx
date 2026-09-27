import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

const steps = [
  {
    number: "01",
    title: "Take the quiz",
    description: "Answer a few questions about the movies you enjoy.",
  },
  {
    number: "02",
    title: "Discover your personality",
    description:
      "MediaPulse learns your individual movie taste and creates your movie personality from your answers.",
  },
  {
    number: "03",
    title: "Get movies matched to your vibe",
    description:
      "Use that understanding to find movies personalized to your taste.",
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
          <h2 id="how-it-works-title">How it works</h2>
        </div>
        <ol className="landing-steps__grid">
          {steps.map((step) => (
            <li className="landing-steps__item" key={step.number}>
              <Card className="landing-step-card">
                <span className="landing-step-card__number" aria-hidden="true">
                  {step.number}
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
