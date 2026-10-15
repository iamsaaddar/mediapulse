"use client";

import { useRef, useState } from "react";
import type {
	CSSProperties,
	MouseEvent as ReactMouseEvent,
	PointerEvent as ReactPointerEvent,
} from "react";

import type { InterviewPersonality } from "@/types/interview";

interface PersonalityCardProps {
	personality: InterviewPersonality;
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

export function PersonalityCard({ personality }: PersonalityCardProps) {
	const [isRevealed, setIsRevealed] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [rotationY, setRotationY] = useState(-18);
	const [rotationX, setRotationX] = useState(3);
	const dragState = useRef<DragState | null>(null);
	const suppressClick = useRef(false);

	function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
		if (!event.isPrimary || event.button !== 0) return;

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

		if (
			!drag.moved &&
			Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4
		) {
			drag.moved = true;
			event.currentTarget.setPointerCapture(event.pointerId);
			setIsDragging(true);
		}
		if (!drag.moved) return;

		drag.rotationY += deltaX * 0.8;
		setRotationY(drag.rotationY);
		setRotationX((current) => clamp(current - deltaY * 0.32, -16, 16));
		const normalizedRotation = ((drag.rotationY % 360) + 360) % 360;
		setIsRevealed(normalizedRotation > 90 && normalizedRotation < 270);
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

	function turnCard() {
		setIsRevealed((current) => !current);
		setRotationY((current) => current + (Math.round(current / 180) % 2 === 0 ? 180 : -180));
		setRotationX(0);
	}

	return (
		<section className="personality-display" aria-labelledby="personality-card-label">
			<p id="personality-card-label" className="type-label">Your moviegoer ID</p>
			<div
				className={`personality-card-stage${isDragging ? " personality-card-stage--dragging" : ""}`}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerUp}
				onClickCapture={handleClickCapture}
				onClick={turnCard}
				onKeyDown={(event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						turnCard();
					}
				}}
				style={{
					"--personality-rotate-y": `${rotationY}deg`,
					"--personality-rotate-x": `${rotationX}deg`,
				} as CSSProperties}
				role="button"
				tabIndex={0}
				aria-pressed={isRevealed}
				aria-label={`Moviegoer ID card, ${isRevealed ? "personality revealed" : "profile hidden"}. Click or drag to turn.`}
			>
				<div className={`personality-card${isDragging ? " personality-card--dragging" : ""}`}>
					<div className="personality-card__face personality-card__front">
						<span className="personality-card__brand">
							<span className="personality-card__seal" aria-hidden="true">✳</span>
							MEDIA PULSE <span>PICTURE HOUSE</span>
						</span>
						<span className="personality-card__portrait" aria-hidden="true">MP</span>
						<span className="personality-card__member">
							<span>MOVIEGOER</span>
							<strong>MEMBER</strong>
						</span>
						<span className="personality-card__tap" aria-hidden="true">✳</span>
					</div>
					<div className="personality-card__face personality-card__back">
						<span className="personality-card__brand">YOUR CINEMATIC PERSONALITY</span>
						<strong>{personality.title}</strong>
						<span className="personality-card__description">{personality.description}</span>
						<span className="personality-card__tap">YOUR MOVIEGOER PROFILE <span aria-hidden="true">✳</span></span>
					</div>
				</div>
			</div>
			<div className="personality-card-controls">
				<button
					type="button"
					aria-pressed={isRevealed}
					aria-label={isRevealed ? "Turn moviegoer ID card to front" : "Reveal movie personality"}
					title={isRevealed ? "Turn card to front" : "Reveal personality"}
					onClick={turnCard}
				>
					<span aria-hidden="true">{isRevealed ? "↶" : "↻"}</span>
				</button>
			</div>
		</section>
	);
}
