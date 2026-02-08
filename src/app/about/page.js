import Footer from "@/components/Footer";
import Header from "@/components/Header";
import contents from "@/data/contents.json";
import styles from "./page.module.css";

export default function About() {
    const { overview, stats, certifications, author, website } = contents;

    return (
        <>
            <Header />
            <main className={styles.main}>
                <section className={styles.hero}>
                    <p className={styles.kicker}>Who we are</p>
                    <h1>About</h1>
                    <p className={styles.lede}>{overview.summary}</p>
                </section>

                <section className={styles.section}>
                    <div className={styles.storyGrid}>
                        <div>
                            <h2>Our Story</h2>
                              <p className={styles.body}>{website.title.full} was founded in {overview.founded} with a focus on resilient, efficient design that elevates communities.</p>
                            <p className={styles.body}>We now support teams across {overview.coverage} with an integrated approach to structural, civil, and MEP engineering.</p>
                        </div>
                        <div className={styles.storyCard}>
                            <h3>Leadership</h3>
                            <p className={styles.body}>{author.name.full}</p>
                            <p className={styles.meta}>{author.title}</p>
                            <p className={styles.body}>{author.email}</p>
                            <p className={styles.meta}>Direct: {author.contact}</p>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Impact</h2>
                        <p>Milestones that reflect consistency and long-term partnerships.</p>
                    </div>
                    <div className={styles.statsGrid}>
                        {stats.map((stat) => (
                            <div key={stat.label} className={styles.statCard}>
                                <p className={styles.statValue}>{stat.value}</p>
                                <p className={styles.statLabel}>{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Certifications</h2>
                        <p>Recognized credentials that support our quality promise.</p>
                    </div>
                    <div className={styles.certGrid}>
                        {certifications.map((certification) => (
                            <div key={certification} className={styles.certCard}>
                                {certification}
                            </div>
                        ))}
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}