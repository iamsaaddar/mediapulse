"use client";

import Image from "next/image";
import { useState } from "react";

interface MovieArtworkProps {
	title: string;
	artworkPath: string | null;
	alt: string;
	className?: string;
	sizes: string;
}

export function MovieArtwork({
	title,
	artworkPath,
	alt,
	className = "",
	sizes,
}: MovieArtworkProps) {
	const [failed, setFailed] = useState(false);
	const src = artworkPath
		? `https://image.tmdb.org/t/p/w780${artworkPath}`
		: null;

	return (
		<div className={`movie-artwork ${className}`}>
			{src && !failed ? (
				<Image
					src={src}
					alt={alt}
					fill
					sizes={sizes}
					unoptimized
					onError={() => setFailed(true)}
					className="movie-artwork__image"
				/>
			) : (
				<div className="movie-artwork__fallback" role="img" aria-label={`No poster available for ${title}`}>
					<span>{title}</span>
					<span className="movie-artwork__fallback-mark" aria-hidden="true">MP</span>
				</div>
			)}
		</div>
	);
}
