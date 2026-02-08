import Footer from "@/components/Footer";
import Header from "@/components/Header";
import contents from "@/data/contents.json";
import styles from "./page.module.css";

export default function Services() {
    const { overview, services, stats, certifications } = contents;

    return (
        <>
            <Header />
            <main className={styles.main}>
                <section className={styles.hero}>
                    <p className={styles.kicker}>What we deliver</p>
                    <h1>Services</h1>
                    <p className={styles.lede}>{overview.summary}</p>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Core Services</h2>
                        <p>Integrated engineering support from concept through delivery.</p>
                    </div>
                    <div className={styles.serviceGrid}>
                        {services.map((service) => (
                            <article key={service.name} className={styles.serviceCard}>
                                <h3>{service.name}</h3>
                                <p>{service.description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Delivery Approach</h2>
                        <p>Focused phases that keep projects clear, safe, and on schedule.</p>
                    </div>
                    <div className={styles.processGrid}>
                        <div className={styles.processCard}>
                            <h3>Discovery</h3>
                            <p>Site assessments, feasibility, and stakeholder alignment.</p>
                        </div>
                        <div className={styles.processCard}>
                            <h3>Design</h3>
                            <p>Performance-driven modeling and coordinated documentation.</p>
                        </div>
                        <div className={styles.processCard}>
                            <h3>Delivery</h3>
                            <p>Construction support, inspections, and technical clarifications.</p>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Impact</h2>
                        <p>Experience and repeat engagements built on trust.</p>
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
                        <p>Professional accreditations that reinforce our standards.</p>
                    </div>
                    <ul className={styles.certList}>
                        {certifications.map((certification) => (
                            <li key={certification} className={styles.certItem}>
                                {certification}
                            </li>
                        ))}
                    </ul>
                </section>
            </main>
            <Footer />
        </>
    );
}