"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Article.module.css";
import Button from "@/components/Button";

export default function Article({ data, imageUrl, heading, text, link }) {
	const articleRef = useRef(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const node = articleRef.current;

		if (!node) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					setIsVisible(true);
					observer.unobserve(node);
				}
			},
			{ threshold: 0.25, rootMargin: "0px 0px -8% 0px" }
		);

		observer.observe(node);

		return () => observer.disconnect();
	}, []);

	// Support both a `data` object and direct props; direct props win if provided.
	const resolved = data || {};
	const image = imageUrl ?? resolved.image;
	const finalHeading = heading ?? resolved.heading;
	const finalText = text ?? resolved.text;
	const finalLink = link ?? resolved.link;

	return (
		<section
			ref={articleRef}
			className={styles.article}
			data-visible={isVisible}
			style={image ? { backgroundImage: `url(${image})` } : undefined}
		>
			<div className={styles.overlay} />
			<div className={styles.content}>
				{finalHeading && (
					<h1 className={`${styles.heading} ${styles.headingReveal}`}>{finalHeading}</h1>
				)}
				{finalText && <p className={`${styles.text} ${styles.textReveal}`}>{finalText}</p>}
				{finalLink && (
					<Button href={finalLink.url} className={styles.link} variant="solid" size="md">
						{finalLink.label}
					</Button>
				)}
			</div>
		</section>
	);
}
