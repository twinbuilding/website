import Footer from "@/components/Footer";
import Header from "@/components/Header";
import contents from "@/data/contents.json";
import styles from "./page.module.css";

export default function Projects() {
    const { overview, projects, stats, testimonials, website } = contents;

    return (
        <>
            <Header />
            <main className={styles.main}>
                <section className={styles.hero}>
                    <p className={styles.kicker}>{website.tagline}</p>
                    <h1>Projects</h1>
                    <p className={styles.lede}>{overview.summary}</p>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Project Highlights</h2>
                        <p>Selected work across commercial, public, and infrastructure sectors.</p>
                    </div>
                    <div className={styles.projectGrid}>
                        {projects.map((project) => (
                            <article key={project.name} className={styles.projectCard}>
                                <div
                                    aria-label={`${project.name} placeholder image`}
                                    role="img"
                                    className={styles.projectImage}
                                />
                                <h3>{project.name}</h3>
                                <p>{project.scope}</p>
                                <p className={styles.projectMeta}>
                                    {project.location} · {project.year} · {project.status}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Impact</h2>
                        <p>Measured outcomes that reflect our consistency and client trust.</p>
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
                        <h2>Client Feedback</h2>
                        <p>What partners say about our collaboration and delivery.</p>
                    </div>
                    <div className={styles.testimonialGrid}>
                        {testimonials.map((testimonial) => (
                            <blockquote key={testimonial.name} className={styles.testimonialCard}>
                                <p>“{testimonial.quote}”</p>
                                <footer className={styles.testimonialFooter}>
                                    {testimonial.name} — {testimonial.role}
                                </footer>
                            </blockquote>
                        ))}
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}