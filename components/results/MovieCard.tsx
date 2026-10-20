"use client";

import { useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";

import type { RecommendationResponse } from "@/types/recommendation";
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

const GENRE_NAMES: Record<number, string> = {
	28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
	99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
	27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Science fiction",
	10770: "TV movie", 53: "Thriller", 10752: "War", 37: "Western",
};

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
	const genres = movie.genreIds.map((id) => GENRE_NAMES[id]).filter(Boolean);
	const overview = movie.overview.trim();
	const matchReason = reason.trim();
	const caseClass = `dvd-case${isOpen ? " is-open" : ""}${isDragging ? " is-dragging" : ""}`;
	const stageClass = `dvd-stage${isOpen ? " is-open" : ""}${isDragging ? " is-dragging" : ""}`;

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
		if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
			event.preventDefault();
			toggleCase();
		}
	}

	return (
		<article className={`dvd-display${isOpen ? " dvd-display--open" : ""}`} style={{ animationDelay: `${index * 70}ms` }}>
			<div
				className={stageClass}
				style={{ "--dvd-rotate-x": `${rotationX}deg`, "--dvd-rotate-y": `${rotationY}deg` } as CSSProperties}
				role="button"
				tabIndex={0}
				aria-label={`${movie.title} DVD case. ${isOpen ? "Open; press Enter or Space to close." : "Closed; press Enter or Space to open."} Drag to rotate.`}
				aria-expanded={isOpen}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerUp}
				onLostPointerCapture={handlePointerUp}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
			>
				<div className="dvd-halo" aria-hidden="true" />
				<div className="dvd-case-wrap">
					<div className={caseClass} style={{ transform: "rotateX(var(--dvd-rotate-x)) rotateY(var(--dvd-rotate-y))" }}>
						<section className="dvd-face dvd-back-cover" aria-label="Personalized recommendation reason">
							<div className="dvd-bc-top">
								<div className="dvd-bc-brand">MEDIAPULSE · YOUR FILM CLUB</div>
								<div className="dvd-bc-title">WHY THIS MATCHES YOU</div>
							</div>
							<div className="dvd-bc-hero" aria-hidden="true" />
							<p className="dvd-bc-synopsis">{matchReason || "A film selected with your preferences in mind."}</p>
							<div className="dvd-bc-gloss" aria-hidden="true" />
						</section>

						<div className="dvd-edge dvd-edge-left" aria-hidden="true">
							<div className="dvd-spine-content">
								<div className="dvd-spine-band" />
								<div className="dvd-spine-title">{movie.title}</div>
								<div className="dvd-spine-mark">DVD</div>
							</div>
						</div>
						<div className="dvd-edge dvd-edge-right" aria-hidden="true" />
						<div className="dvd-edge dvd-edge-top" aria-hidden="true" />
						<div className="dvd-edge dvd-edge-bottom" aria-hidden="true" />

						<div className="dvd-tray" aria-label="DVD interior tray">
							<div className="dvd-disc" aria-hidden="true"><div className="dvd-disc-label" /></div>
							<div className="dvd-hub" aria-hidden="true" />
						</div>

						<div className="dvd-lid">
							<div className="dvd-cover-front" aria-label={`${movie.title} poster`}>
								<div className="dvd-poster">
									<MovieArtwork title={movie.title} artworkPath={movie.posterPath} alt={`${movie.title} poster`} sizes="(max-width: 48rem) 42vw, 260px" className="dvd-poster-artwork" />
									{movie.rating > 0 ? <span className="dvd-rating"><span aria-hidden="true">★</span> {movie.rating.toFixed(1)}</span> : null}
								</div>
							</div>
							<div className="dvd-cover-inner" aria-label="Movie details">
								<div className="dvd-inside-info">
									<h3>{movie.title}</h3>
									{year || genres.length ? <p className="dvd-metadata">{[year, ...genres].filter(Boolean).join(" · ")}</p> : null}
									<p className="dvd-overview">{overview || "No overview is available for this film."}</p>
								</div>
								<div className="dvd-inner-emblem" aria-hidden="true" />
							</div>
						</div>
					</div>
				</div>
				<span className="dvd-instruction" aria-hidden="true">Click or tap to open / close · Drag to rotate</span>
			</div>
		</article>
	);
}
