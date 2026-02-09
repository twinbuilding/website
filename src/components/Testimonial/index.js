import Image from "next/image";
import styles from "./Testimonial.module.css";

export default function Testimonial({ testimonials = [], coverage = "" }) {
  const items = [...testimonials, ...testimonials];
  const duration = Math.max(testimonials.length * 6, 24);

  return (
    <section className={styles.section}>
      <p className={styles.overtitle}>Testimonials</p>
      <h2 className={styles.heading}>Trusted by owners and project teams</h2>
      <p className={styles.subheading}>
        Clients across the {coverage.toLowerCase()} rely on Twin Building for
        clear engineering, responsive support, and coordinated delivery.
      </p>
      <div className={styles.carousel}>
        <div
          className={styles.track}
          style={{ "--marquee-duration": `${duration}s` }}
        >
          {items.map((testimonial, index) => (
            <figure
              key={`${testimonial.name}-${index}`}
              className={styles.card}
            >
              <Image
                src={testimonial.image}
                alt={testimonial.name}
                width={64}
                height={64}
                className={styles.avatar}
              />
              <blockquote className={styles.quote}>
                &ldquo;{testimonial.quote}&rdquo;
                <footer className={styles.signature}>
                  &mdash; {testimonial.name},
                  <span className={styles.role}> {testimonial.role}</span>
                </footer>
              </blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
