import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { RecommendationResponse } from "@/types/recommendation";

function formatReleaseYear(releaseDate: string): string {
  if (!releaseDate) return "—";
  const match = /^\d{4}/.exec(releaseDate);
  return match ? match[0] : "—";
}

export function getPosterUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w500${path}`;
}

interface MovieCardProps {
  movie: RecommendationResponse["recommendations"][number]["movie"];
  reason: string;
}

export function MovieCard({ movie, reason }: MovieCardProps) {
  const posterUrl = getPosterUrl(movie.posterPath);
  const overview = movie.overview?.trim();

  return (
    <Card className="group overflow-hidden border-border bg-surface-elevated p-0" variant="elevated">
      <div className="aspect-[2/3] overflow-hidden bg-surface-muted">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={`${movie.title} poster`}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">
            {movie.title}
          </div>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold text-foreground">{movie.title}</h3>
            <p className="mt-1 text-sm text-muted">
              {formatReleaseYear(movie.releaseDate)}
              {typeof movie.rating === "number" ? ` • TMDB ${movie.rating.toFixed(1)}` : ""}
            </p>
          </div>
          {typeof movie.rating === "number" ? (
            <Badge variant="accent" className="shrink-0">
              {movie.rating.toFixed(1)}
            </Badge>
          ) : null}
        </div>

        {overview ? <p className="text-sm leading-6 text-muted">{overview}</p> : null}

        <div className="rounded-lg border border-border bg-surface p-3">
          <p className="type-label text-accent">WHY THIS FITS</p>
          <p className="mt-2 text-sm leading-6 text-foreground">{reason}</p>
        </div>
      </div>
    </Card>
  );
}
