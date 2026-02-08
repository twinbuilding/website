import styles from "./Article.module.css";
import Link from "next/link";

export default function Article({ data, imageUrl, heading, text, link }) {
	// Support both a `data` object and direct props; direct props win if provided.
	const resolved = data || {};
	const image = imageUrl ?? resolved.image;
	const finalHeading = heading ?? resolved.heading;
	const finalText = text ?? resolved.text;
	const finalLink = link ?? resolved.link;

	return (
		<section
			className={styles.article}
			style={image ? { backgroundImage: `url(${image})` } : undefined}
		>
			<div className={styles.overlay} />
			<div className={styles.content}>
				{finalHeading && <h1 className={styles.heading}>{finalHeading}</h1>}
				{finalText && <p className={styles.text}>{finalText}</p>}
				{finalLink && (
					<Link href={finalLink.url} className={styles.link}>
						{finalLink.label}
					</Link>
				)}
			</div>
		</section>
	);
}
