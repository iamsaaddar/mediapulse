"use client";

import { useRef, useState } from "react";
import type {
	CSSProperties,
	MouseEvent as ReactMouseEvent,
	PointerEvent as ReactPointerEvent,
} from "react";

import type { RecommendationResponse } from "@/types/recommendation";
import { MovieArtwork } from "./MovieArtwork";

function formatReleaseDate(releaseDate: string): string | null {
	if (!releaseDate) return null;
	const match = /^(\d{4})(?:-(\d{2})-(\d{2}))?/.exec(releaseDate);
	if (!match) return null;
	if (!match[2] || !match[3]) return match[1];

	const month = Number(match[2]);
	const day = Number(match[3]);
	if (month < 1 || month > 12 || day < 1 || day > 31) return match[1];

	const monthLabel = new Intl.DateTimeFormat("en", { month: "short" }).format(
		new Date(Date.UTC(2020, month - 1, 1)),
	);
	return `${monthLabel} ${day} '${match[1].slice(-2)}`;
}

interface MovieCardProps {
	movie: RecommendationResponse["recommendations"][number]["movie"];
	reason: string;
	index: number;
}

interface DragState {
	pointerId: number;
	startX: number;
	startY: number;
	lastX: number;
	lastY: number;
	rotationY: number;
	rotationX: number;
	moved: boolean;
}

const clamp = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max);

export function MovieCard({ movie, reason, index }: MovieCardProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [rotationY, setRotationY] = useState(-24);
	const [rotationX, setRotationX] = useState(3);
	const dragState = useRef<DragState | null>(null);
	const suppressClick = useRef(false);
	const releaseDate = formatReleaseDate(movie.releaseDate);
	const overview = movie.overview.trim();

	function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
		if (
			!event.isPrimary ||
			event.button !== 0 ||
			(event.target instanceof Element && event.target.closest("a"))
		) {
			return;
		}

		dragState.current = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			lastX: event.clientX,
			lastY: event.clientY,
			rotationY,
			rotationX,
			moved: false,
		};
	}

	function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
		const drag = dragState.current;
		if (!drag || drag.pointerId !== event.pointerId) return;

		const deltaX = event.clientX - drag.lastX;
		const deltaY = event.clientY - drag.lastY;
		drag.lastX = event.clientX;
		drag.lastY = event.clientY;

		if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4) {
			drag.moved = true;
			event.currentTarget.setPointerCapture(event.pointerId);
			setIsDragging(true);
		}
		if (!drag.moved) return;

		setRotationY((current) => current + deltaX * 0.8);
		setRotationX((current) => clamp(current - deltaY * 0.32, -12, 12));
	}

	function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
		const drag = dragState.current;
		if (!drag || drag.pointerId !== event.pointerId) return;

		suppressClick.current = drag.moved;
		dragState.current = null;
		setIsDragging(false);
	}

	function handleClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
		if (!suppressClick.current) return;
		suppressClick.current = false;
		event.preventDefault();
		event.stopPropagation();
	}

	function rotateCase() {
		setRotationY((current) => current + (Math.round(current / 180) % 2 === 0 ? 180 : -180));
		setRotationX(0);
	}

	function toggleCase() {
		setIsOpen((current) => !current);
		setRotationY(0);
		setRotationX(0);
	}

	return (
		<article
			className={`dvd-display${isOpen ? " dvd-display--open" : ""}`}
			style={{ animationDelay: `${index * 70}ms` }}
		>
			<div
				className={`dvd-stage${isDragging ? " dvd-stage--dragging" : ""}${isOpen ? " dvd-stage--open" : ""}`}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerUp}
				onClickCapture={handleClickCapture}
				style={{
					"--dvd-rotate-y": `${rotationY}deg`,
					"--dvd-rotate-x": `${rotationX}deg`,
				} as CSSProperties}
				role="group"
				aria-label={`${movie.title} DVD case. Drag to rotate and inspect.`}
			>
				<div className="dvd-assembly">
					<div className="dvd-case">
						<div className="dvd-case__back-shell">
							<button
								className="dvd-case__synopsis"
								type="button"
								onClick={toggleCase}
								aria-expanded={isOpen}
								aria-label={`Close ${movie.title} DVD case`}
							>
								<span className="dvd-case__synopsis-mark">INSIDE THE CASE</span>
								<strong>{movie.title}</strong>
								<p>{overview || "A little mystery is part of the magic."}</p>
								<span className="dvd-case__synopsis-footer">A STORY SELECTED FOR YOU</span>
							</button>
							<div className="dvd-case__rear">
								<span className="dvd-case__rear-studio">MEDIA PULSE · FILM CLUB</span>
								<span className="dvd-case__rear-label">WHY THIS ONE?</span>
								<p>{reason}</p>
								<span className="dvd-case__rear-rating">
									{releaseDate ? <span>{releaseDate}</span> : null}
									{movie.rating > 0 ? (
										<span><b aria-hidden="true">★</b> {movie.rating.toFixed(1)} TMDB</span>
									) : null}
								</span>
								<a
									href={`https://www.themoviedb.org/movie/${movie.tmdbId}`}
									target="_blank"
									rel="noreferrer"
									aria-label={`Explore ${movie.title} on TMDB, opens in a new tab`}
								>
									VIEW FILM DETAILS <span aria-hidden="true">↗</span>
								</a>
							</div>
						</div>
						<div className="dvd-case__spine">
							<span>MP</span>
							<strong>{movie.title}</strong>
							<span>DVD</span>
						</div>
						<div className="dvd-case__top-edge" />
						<div className="dvd-case__bottom-edge" />
						<div className="dvd-case__right-edge" />
						<div className="dvd-door">
							<div className="dvd-door__face dvd-door__outside">
								<button
									className="dvd-door__cover"
									type="button"
									onClick={toggleCase}
									aria-expanded={isOpen}
									aria-label={`${isOpen ? "Close" : "Open"} ${movie.title} DVD case`}
								>
									<MovieArtwork
										title={movie.title}
										artworkPath={movie.posterPath}
										alt=""
										sizes="(max-width: 24rem) 46vw, (max-width: 48rem) 42vw, 260px"
										className="dvd-door__artwork"
									/>
									<span className="dvd-door__poster-scrim" />
									<span className="dvd-door__collection">MEDIA PULSE <span>DVD COLLECTION</span></span>
									<span className="dvd-door__poster-copy">
										<strong>{movie.title}</strong>
										<span className="dvd-door__metadata">
											{releaseDate ? <span>{releaseDate}</span> : null}
											{movie.rating > 0 ? <span><b aria-hidden="true">★</b> {movie.rating.toFixed(1)}</span> : null}
										</span>
									</span>
									<span className="dvd-door__spine-edge" aria-hidden="true" />
								</button>
							</div>
							<button
								className="dvd-door__face dvd-door__inside"
								type="button"
								onClick={toggleCase}
								aria-expanded={isOpen}
								aria-label={`Close ${movie.title} DVD case`}
							>
								<div className="dvd-door__disc-pocket">
									<span className="dvd-case__tray-band">COLLECTOR&apos;S EDITION</span>
									<div className="dvd-case__disc">
										<span className="dvd-case__disc-art">
											<MovieArtwork
												title={movie.title}
												artworkPath={movie.posterPath}
												alt=""
												sizes="100px"
												className="dvd-case__disc-artwork"
											/>
										</span>
										<span className="dvd-case__disc-ring" />
										<span className="dvd-case__disc-hole" />
										<span className="dvd-case__disc-title">{movie.title}</span>
									</div>
									<span className="dvd-case__tray-footer">MEDIA PULSE PICTURE HOUSE</span>
								</div>
							</button>
						</div>
						<div className="dvd-case__hinge" aria-hidden="true" />
					</div>
				</div>
				<span className="dvd-stage__instruction" aria-hidden="true">
					{isDragging ? "LOOKING GOOD" : "DRAG TO ROTATE"}
				</span>
			</div>
			<div className="dvd-controls" aria-label={`${movie.title} case controls`}>
				<button
					type="button"
					onClick={rotateCase}
					aria-label={`Turn ${movie.title} DVD case around`}
					title="Turn case around"
				>
					<span aria-hidden="true">↻</span>
				</button>
			</div>
		</article>
	);
}
