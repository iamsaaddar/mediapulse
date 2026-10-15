import type { RecommendationResponse } from "@/types/recommendation";
import { MovieArtwork } from "./MovieArtwork";

function formatReleaseYear(releaseDate: string): string | null {
  if (!releaseDate) return null;
  const match = /^\d{4}/.exec(releaseDate);
  return match ? match[0] : null;
}

interface MovieCardProps {
  movie: RecommendationResponse["recommendations"][number]["movie"];
  reason: string;
}

export function MovieCard({ movie, reason }: MovieCardProps) {
  const year = formatReleaseYear(movie.releaseDate);
  const overview = movie.overview?.trim();

  return (
    <article className="movie-card">
      <MovieArtwork
        title={movie.title}
        artworkPath={movie.posterPath}
        alt={`${movie.title} poster`}
        sizes="(max-width: 40rem) 80vw, (max-width: 64rem) 40vw, 22vw"
        className="movie-card__artwork"
      />
      <div className="movie-card__content">
        <p className="movie-card__metadata">
          {year}
          {year && movie.rating > 0 ? " · " : ""}
          {movie.rating > 0 ? `TMDB ${movie.rating.toFixed(1)}` : ""}
        </p>
        <h5 className="movie-card__title">{movie.title}</h5>
        {overview ? <p className="movie-card__overview">{overview}</p> : null}
        <div className="movie-card__reason">
          <p className="type-label">Why this fits</p>
          <p>{reason}</p>
        </div>
        <a
          href={`https://www.themoviedb.org/movie/${movie.tmdbId}`}
          target="_blank"
          rel="noreferrer"
          className="movie-card__link"
          aria-label={`Explore ${movie.title} on TMDB, opens in a new tab`}
        >
          Explore on TMDB <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}
