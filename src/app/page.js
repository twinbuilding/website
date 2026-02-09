import Image from "next/image";
import styles from "./page.module.css";
import contents from "@/data/contents.json";
import Article from "@/components/Article";
import Testimonial from "@/components/Testimonial";

export default function Home() {
  return (
    <main className={styles.main}>
      <article>
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
        </section>
      </article>

      

      <article>
        <Article
          imageUrl="backgrounds/background_2.png"
          heading="Engineering Solutions"
          text="Committed to delivering cutting-edge engineering solutions that drive progress and transform the built environment, ensuring a sustainable and resilient future for generations to come."
          link={{
            url: "/services",
            label: "Discover Our Solutions",
          }}
        />
      </article>

      <article>
        <Article
          imageUrl="backgrounds/background_3.png"
          heading="Proven Engineering in Practice"
          text={`With a track record of successful projects across the ${contents.overview.coverage}, Twin Building has consistently delivered innovative engineering solutions that meet the unique challenges of each project, earning the trust of clients and partners alike.`}
          link={{
            url: "/projects",
            label: "Project Portfolio",
          }}
        />
      </article>

      <article>
        <Testimonial
          testimonials={contents.testimonials}
          coverage={contents.overview.coverage}
        />
      </article>

    <article>
        <Article
          imageUrl="backgrounds/background_1.png"
          heading="Our Approach to Engineering"
          text="At Twin Building, we are dedicated to pushing the boundaries of engineering and technology, creating innovative solutions that shape the future of construction and infrastructure."
          link={{
            url: "/about",
            label: "Who We Are",
          }}
        />
      </article>
    </main>
  );
}
