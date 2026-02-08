import Link from "next/link";
import contents from "@/data/contents.json";
import styles from "./Footer.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.brand}>
          <h2>{contents.website.title.base}</h2>
          <h3>{contents.website.title.tail}</h3>
          <p className={styles.tagline}>{contents.website.tagline}</p>
          <p className={styles.address}>{contents.website.address}</p>
        </div>
        
      </div>
      <p className={styles.meta}>
        © {currentYear} {contents.website.title.base}. All rights reserved.
      </p>
    </footer>
  );
}
