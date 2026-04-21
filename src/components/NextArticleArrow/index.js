"use client";

import styles from "./NextArticleArrow.module.css";

export default function NextArticleArrow({ className = "", direction = "down" }) {
  const handleClick = (event) => {
    const currentArticle = event.currentTarget.closest("article");

    if (direction === "up") {
      const main = currentArticle?.closest("main");
      const firstArticle = main?.querySelector("article");
      if (firstArticle) {
        firstArticle.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    const nextArticle = currentArticle?.nextElementSibling;

    if (nextArticle) {
      nextArticle.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const isUp = direction === "up";
  const label = isUp ? "Back to top" : "Scroll to next section";

  return (
    <button
      type="button"
      className={`${styles.arrowButton} ${isUp ? styles.arrowButtonUp : ""} ${className}`.trim()}
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      <span className={styles.chevron} aria-hidden="true" />
    </button>
  );
}
