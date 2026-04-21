import Link from "next/link";
import styles from "./Button.module.css";

function joinClassNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Button({
  href,
  children,
  className = "",
  variant = "solid",
  size = "md",
  active = false,
  animateBorder = true,
  type = "button",
  ...rest
}) {
  const classes = joinClassNames(
    styles.button,
    styles[`variant${variant[0].toUpperCase()}${variant.slice(1)}`],
    styles[`size${size[0].toUpperCase()}${size.slice(1)}`],
    active ? styles.isActive : "",
    !animateBorder ? styles.noBorderLight : "",
    className
  );

  const content = <span className={styles.label}>{children}</span>;

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...rest}>
      {content}
    </button>
  );
}
