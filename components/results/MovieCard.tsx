"use client";

import styles from "./results.module.css";
import { cxModule } from "@/lib/utils";
import { useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";

import type { RecommendationResponse } from "@/types/recommendation";
import { getMovieGenreNames } from "@/constants/movie-genres";
import { MovieArtwork } from "./MovieArtwork";

interface MovieCardProps {
	movie: RecommendationResponse["recommendations"][number]["movie"];
	reason: string;
	index: number;
}

interface DragState {
	pointerId: number;
	startX: number;
	startY: number;
	rotationY: number;
	rotationX: number;
	moved: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function releaseYear(releaseDate: string): string | null {
	return /^(\d{4})/.exec(releaseDate)?.[1] ?? null;
}

export function MovieCard({ movie, reason, index }: MovieCardProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [rotationY, setRotationY] = useState(37);
	const [rotationX, setRotationX] = useState(-4);
	const [isDragging, setIsDragging] = useState(false);
	const dragState = useRef<DragState | null>(null);
	const suppressClick = useRef(false);
	const year = releaseYear(movie.releaseDate);
	const watchUrl = `https://vidlink.pro/movie/${movie.tmdbId}`;
	const genres = getMovieGenreNames(movie.genreIds);
	const overview = movie.overview.trim();
	const matchReason = reason.trim();
	const caseClass = cxModule(styles, `dvd-case${isOpen ? " is-open" : ""}${isDragging ? " is-dragging" : ""}`);
	const stageClass = cxModule(styles, `dvd-stage${isOpen ? " is-open" : ""}${isDragging ? " is-dragging" : ""}`);

	function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
		if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
		if (event.pointerType !== "mouse") event.currentTarget.setPointerCapture(event.pointerId);
		dragState.current = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			rotationY,
			rotationX,
			moved: false,
		};
	}

	function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
		const drag = dragState.current;
		if (!drag || drag.pointerId !== event.pointerId) return;
		const dx = event.clientX - drag.startX;
		const dy = event.clientY - drag.startY;
		if (!drag.moved && Math.hypot(dx, dy) > 6) {
			drag.moved = true;
			event.currentTarget.setPointerCapture(event.pointerId);
			setIsDragging(true);
		}
		if (!drag.moved) return;
		setRotationY(drag.rotationY + dx * 0.45);
		setRotationX(clamp(drag.rotationX - dy * 0.3, -28, 16));
	}

	function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
		const drag = dragState.current;
		if (!drag || drag.pointerId !== event.pointerId) return;
		suppressClick.current = drag.moved;
		dragState.current = null;
		setIsDragging(false);
	}

	function toggleCase() {
		setIsOpen((open) => !open);
	}

	function handleClick() {
		if (suppressClick.current) {
			suppressClick.current = false;
			return;
		}
		toggleCase();
	}

	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (event.target !== event.currentTarget) return;
		if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
			event.preventDefault();
			toggleCase();
		}
	}

	return (
		<article className={cxModule(styles, `dvd-display${isOpen ? " dvd-display--open" : ""}`)} style={{ animationDelay: `${index * 70}ms` }}>
			<div
				className={stageClass}
				style={{ "--dvd-rotate-x": `${rotationX}deg`, "--dvd-rotate-y": `${rotationY}deg` } as CSSProperties}
				role="group"
				tabIndex={0}
				aria-label={`${movie.title} DVD case. ${isOpen ? "Open; press Enter or Space to close." : "Closed; press Enter or Space to open."} Drag to rotate. Open the case to select the disc and watch the movie.`}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerUp}
				onLostPointerCapture={handlePointerUp}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
			>
				<div className={cxModule(styles, "dvd-halo")} aria-hidden="true" />
				<div className={cxModule(styles, "dvd-case-wrap")}>
					<div className={caseClass} style={{ transform: "rotateX(var(--dvd-rotate-x)) rotateY(var(--dvd-rotate-y))" }}>
						<section className={cxModule(styles, "dvd-face dvd-back-cover")} aria-label="Personalized recommendation reason">
							<div className={cxModule(styles, "dvd-bc-top")}>
								<div className={cxModule(styles, "dvd-bc-brand")}>MEDIAPULSE · YOUR FILM CLUB</div>
								<div className={cxModule(styles, "dvd-bc-title")}>WHY THIS MATCHES YOU</div>
							</div>
							<div className={cxModule(styles, "dvd-bc-hero")} aria-hidden="true" />
							<p className={cxModule(styles, "dvd-bc-synopsis")}>{matchReason || "A film selected with your preferences in mind."}</p>
							<div className={cxModule(styles, "dvd-bc-gloss")} aria-hidden="true" />
						</section>

						<div className={cxModule(styles, "dvd-edge dvd-edge-left")} aria-hidden="true">
							<div className={cxModule(styles, "dvd-spine-content")}>
								<div className={cxModule(styles, "dvd-spine-band")} />
								<div className={cxModule(styles, "dvd-spine-title")}>{movie.title}</div>
								<div className={cxModule(styles, "dvd-spine-mark")}>DVD</div>
							</div>
						</div>
						<div className={cxModule(styles, "dvd-edge dvd-edge-right")} aria-hidden="true" />
						<div className={cxModule(styles, "dvd-edge dvd-edge-top")} aria-hidden="true" />
						<div className={cxModule(styles, "dvd-edge dvd-edge-bottom")} aria-hidden="true" />

						<div className={cxModule(styles, "dvd-tray")} aria-label="DVD interior tray">
							<a
								className={cxModule(styles, "dvd-disc dvd-disc-link")}
								href={watchUrl}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={`Watch ${movie.title} on Vidlink (opens in a new tab)`}
								tabIndex={isOpen ? 0 : -1}
								aria-hidden={!isOpen}
								onPointerDown={(event) => event.stopPropagation()}
								onClick={(event) => event.stopPropagation()}
							>
								<div className={cxModule(styles, "dvd-disc-label")}><span>PLAY</span></div>
							</a>
							<div className={cxModule(styles, "dvd-hub")} aria-hidden="true" />
						</div>

						<div className={cxModule(styles, "dvd-lid")}>
							<div className={cxModule(styles, "dvd-cover-front")} aria-label={`${movie.title} poster`}>
								<div className={cxModule(styles, "dvd-poster")}>
									<MovieArtwork title={movie.title} artworkPath={movie.posterPath} alt={`${movie.title} poster`} sizes="(max-width: 48rem) 42vw, 260px" className={cxModule(styles, "dvd-poster-artwork")} />
									{movie.rating > 0 ? <span className={cxModule(styles, "dvd-rating")}><span aria-hidden="true">★</span> {movie.rating.toFixed(1)}</span> : null}
								</div>
							</div>
							<div className={cxModule(styles, "dvd-cover-inner")} aria-label="Movie details">
								<div className={cxModule(styles, "dvd-inside-info")}>
									<h3>{movie.title}</h3>
									{year || genres.length ? <p className={cxModule(styles, "dvd-metadata")}>{[year, ...genres].filter(Boolean).join(" · ")}</p> : null}
									<p className={cxModule(styles, "dvd-overview")}>{overview || "No overview is available for this film."}</p>
								</div>
								<div className={cxModule(styles, "dvd-inner-emblem")} aria-hidden="true" />
							</div>
						</div>
					</div>
				</div>
				<span className={cxModule(styles, "dvd-instruction")} aria-hidden="true">Click or tap to open / close · Drag to rotate</span>
			</div>
		</article>
	);
}
