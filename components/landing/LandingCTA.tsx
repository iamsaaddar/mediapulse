import styles from "./landing.module.css";
import { cxModule } from "@/lib/utils";
import Link from "next/link";

export function LandingCTA({
  label = "Find my film",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <Link className={`${cxModule(styles, "landing-cta")} ${className ?? ""}`} href="/quiz">
      {label} <span aria-hidden="true">↗</span>
    </Link>
  );
}
