import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import contents from "@/data/contents.json";
import styles from "./page.module.css";

export default function Contact() {
    const { website, author, overview, social } = contents;

    return (
        <>
            <Header />
            <main className={styles.main}>
                <section className={styles.hero}>
                    <p className={styles.kicker}>Let us collaborate</p>
                    <h1>Contact</h1>
                    <p className={styles.lede}>{overview.summary}</p>
                </section>

                <section className={styles.section}>
                    <div className={styles.cardGrid}>
                        <div className={styles.card}>
                            <h2>Office</h2>
                            <p className={styles.body}>{website.address}</p>
                            <p className={styles.meta}>Hours: {website.hours}</p>
                        </div>
                        <div className={styles.card}>
                            <h2>Reach Us</h2>
                            <p className={styles.body}>
                                <Link href={`mailto:${website.email}`}>{website.email}</Link>
                            </p>
                            <p className={styles.body}>
                                <Link href={`tel:${author.contact}`}>{author.contact}</Link>
                            </p>
                            {/* <p className={styles.meta}>Emergency: {website.emergency}</p> */}
                        </div>
                        <div className={styles.card}>
                            <h2>Lead Engineer</h2>
                            <p className={styles.body}>{author.name.full}</p>
                            <p className={styles.body}>
                                <Link href={`mailto:${author.email}`}>{author.email}</Link>
                            </p>
                            {/* <p className={styles.meta}>Direct line: {author.contact}</p> */}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}