import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import contents from "@/data/contents.json";

export default function Home() {
  return (
    <main className={styles.main}>
      <section>
        <Image
          src={contents.website.logo}
          alt={contents.website.title.full}
          width={200}
          height={200}
          />
        <h1>{contents.website.title.full}</h1>
        <p>{contents.website.tagline}</p>
        <p>
          <Link href={`mailto:${contents.website.email}`}>{contents.website.email}</Link>
        </p>
        </section>
    </main>
  );
}
