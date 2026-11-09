import { useT } from "../i18n";

/** Official Sonarhorin Golden Deer Logo Component */
export default function Logo({ light = false, size = "md", showText = true }) {
  const t = useT();
  return (
    <span className={`brand ${light ? "light" : ""} logo-size-${size}`}>
      <img
        src="/logo-gold.png"
        alt="Sonarhorin"
        className="brand-golden-deer-logo"
      />
      {showText && <span className="word">{t("Sonarhorin", "সোনারহরিণ")}</span>}
    </span>
  );
}
