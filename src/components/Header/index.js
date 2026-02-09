"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import contents from "@/data/contents.json";
import styles from "./Header.module.css";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const navId = "primary-navigation";

  const closeDrawer = () => setIsOpen(false);

  const handleBackdropInteraction = (e) => {
    // Only close if the backdrop itself is clicked/tapped, not child elements
    if (e.target === e.currentTarget) {
      closeDrawer();
    }
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <Image
            src={contents.website.logo}
            alt={contents.website.title.full}
            width={50}
            height={50}
          />
          {contents.website.title.base}
        </Link>
        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={isOpen}
          aria-controls={navId}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className={styles.menuLabel}>Menu</span>
          <span className={`${styles.menuIcon} ${isOpen ? styles.menuIconOpen : ""}`} aria-hidden="true">
            <span />
            <span />
          </span>
        </button>

        {/* Overlay Backdrop */}
        <div
          className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ""}`}
          onClick={handleBackdropInteraction}
          onTouchEnd={handleBackdropInteraction}
          aria-hidden="true"
        />

        {/* Slide Drawer */}
        <ul
          id={navId}
          className={`${styles.navDrawer} ${isOpen ? styles.navDrawerOpen : ""}`}
        >
          {contents.navigation.map((item) => (
            <li key={item} className={styles.navItem}>
              <Link
                href={`/${item.toLowerCase()}`}
                className={styles.link}
                onClick={closeDrawer}
              >
                {item}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
