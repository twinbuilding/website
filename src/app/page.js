import Image from "next/image";
import styles from "./page.module.css";
import contents from "@/data/contents.json";
import Article from "@/components/Article";
import Testimonial from "@/components/Testimonial";
import NextArticleArrow from "@/components/NextArticleArrow";
import Button from "@/components/Button";

export default function Home() {
  return (
    <main className={styles.main}>
      <article className={styles.heroArticle}>
        <video
          className={styles.heroBackgroundVideo}
          src="/backgrounds/home_hero.mp4"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />
        <div className={styles.heroOverlay} aria-hidden="true" />
        <section className={styles.heroSection}>
          <Image
            src={`${contents.website.logo}`}
            alt={contents.website.title.full}
            width={240}
            height={240}
            className={styles.heroLogo}
          />
          <h1 className={styles.heroTitle}>{contents.website.title.base}</h1>
          <p className={styles.heroTail}>{contents.website.title.tail}</p>
          <div className={styles.heroActions}>
            <Button href="/services" className={styles.heroButton} variant="soft" size="md">
              Our Services
            </Button>
            <Button href="/contact" className={styles.heroButton} variant="solid" size="md">
              Contact Us
            </Button>
          </div>
        </section>
        <NextArticleArrow />
      </article>

      

      <article>
        <Article
          imageUrl="backgrounds/article_engineering_solutions.png"
          heading="Engineering Solutions"
          text="Committed to delivering cutting-edge engineering solutions that drive progress and transform the built environment, ensuring a sustainable and resilient future for generations to come."
          link={{
            url: "/services",
            label: "Discover Our Solutions",
          }}
        />
        <NextArticleArrow />
      </article>

      <article>
        <Article
          imageUrl="backgrounds/article_proven_engineering.png"
          heading="Proven Engineering in Practice"
          text={`With a track record of successful projects across the ${contents.overview.coverage}, Twin Building has consistently delivered innovative engineering solutions that meet the unique challenges of each project, earning the trust of clients and partners alike.`}
          link={{
            url: "/projects",
            label: "Project Portfolio",
          }}
        />
        <NextArticleArrow />
      </article>

      <article>
        <Testimonial
          testimonials={contents.testimonials}
          coverage={contents.overview.coverage}
        />
        <NextArticleArrow />
      </article>

    <article>
        <Article
          imageUrl="backgrounds/article_our_approach.png"
          heading="Our Approach to Engineering"
          text="At Twin Building, we are dedicated to pushing the boundaries of engineering and technology, creating innovative solutions that shape the future of construction and infrastructure."
          link={{
            url: "/about",
            label: "Who We Are",
          }}
        />
        <NextArticleArrow direction="up" />
      </article>
    </main>
  );
}
