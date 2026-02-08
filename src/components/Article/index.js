import styles from "./HeroSection.module.css";
import Link from "next/link";

export default function Article({ data }) {
	const { image, heading, text, link } = data || {};

	return (
		<article className={styles.article} style={{ backgroundImage: `url(${image})` }}>
			<div className={styles.overlay} />
			<div className={styles.content}>
				{heading && <h1 className={styles.heading}>{heading}</h1>}
				{text && <p className={styles.text}>{text}</p>}
				{link && (
					<Link href={link.url} className={styles.link}>
						{link.label}
					</Link>
				)}
			</div>
		</article>
	);
}
