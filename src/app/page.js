import Image from "next/image";
import styles from "./page.module.css";
import contents from "@/data/contents.json";
import Article from "@/components/Article";

export default function Home() {
  return (
    <main className={styles.main}>
      <article>
        <section>
      <Image
        src="branding/logo_signature.svg"
        alt={contents.website.title.full}
        width={200}
        height={200}
      />
        </section>
      </article>

      <article>
        <Article
          imageUrl="backgrounds/background_1.svg"
          heading="Engineering the Future"
          text="At Twin Building, we are dedicated to pushing the boundaries of engineering and technology, creating innovative solutions that shape the future of construction and infrastructure."
          link={{
            url: "/about",
            label: "Learn More About Us",
          }}
        />
      </article>

      <article>
        <section className={styles.testimonialsSection}>
          <p className={styles.overtitle}>Testimonials</p>
          <h2 className={styles.testimonialsHeading}>
          Trusted by owners and project teams
          </h2>
          <p className={styles.testimonialsSubheading}>
          Clients across the {contents.overview.coverage.toLowerCase()} rely on
          Twin Building for clear engineering, responsive support, and
          coordinated delivery.
          </p>
          <div className={styles.testimonialsGrid}>
          {contents.testimonials.map((t) => (
        <figure key={t.name} className={styles.testimonialCard}>
          <Image
            src={t.image}
            alt={t.name}
            width={160}
            height={160}
            className={styles.testimonialAvatar}
          />
          <blockquote className={styles.testimonialQuote}>
          &ldquo;{t.quote}&rdquo;
          <footer className={styles.testimonialSignature}>
            &mdash; {t.name}, <span className={styles.testimonialRole}>{t.role}</span>
          </footer>
          </blockquote>
        </figure>
        ))}
        </div>
      </section>
    </article>
    </main>
  );
}
