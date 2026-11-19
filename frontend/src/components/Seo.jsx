import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

/**
 * Per-page <title>, description, canonical, Open Graph + Twitter tags, and optional JSON-LD.
 * Deeper <Seo> wins over shallower ones (react-helmet-async), so App's RouteSeo is the fallback.
 */
export const SITE = "সোনারহরিণ";
export const SITE_EN = "Sonarhorin";
export const origin = () => (typeof location !== "undefined" ? location.origin : "https://sonarhorin.com");
const abs = (u) => (!u ? u : /^https?:/i.test(u) ? u : origin() + (u.startsWith("/") ? u : `/${u}`));

export const DEFAULT_DESC = "সোনারহরিণ (Sonarhorin): Bangladesh's job platform only for freshers. Find fresher jobs & internships, judge your CV, practice with an AI interviewer, get certified.";

// index.html carries static defaults (for crawlers that do not run JS). Once React is up, Helmet owns these tags.
if (typeof document !== "undefined") document.querySelectorAll("[data-seo-default]").forEach((el) => el.remove());

export default function Seo({ title, description = DEFAULT_DESC, image = "/logo-gold.png", type = "website", jsonLd, noindex }) {
  const { pathname } = useLocation();
  const full = title ? `${title} · ${SITE} (${SITE_EN})` : `${SITE} — First Jobs for Freshers in Bangladesh`;
  const url = origin() + pathname;
  const ld = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet prioritizeSeoTags>
      <title>{full}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex" />}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={full} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={abs(image)} />
      <meta name="twitter:title" content={full} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={abs(image)} />
      {ld.map((o, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(o)}</script>
      ))}
    </Helmet>
  );
}

const EMPLOYMENT = { full_time: "FULL_TIME", part_time: "PART_TIME", internship: "INTERN", trainee: ["FULL_TIME", "OTHER"] };

const strip = (s) => String(s || "").replace(/<[^>]*>/g, "").trim();
const esc = (s) => strip(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** schema.org JobPosting for Google for Jobs, from a /api/jobs/<id>/ payload. */
export function jobPostingLd(j) {
  if (!j) return null;
  const reqs = (j.requirements || []).filter(Boolean);
  const description =
    `<p>${esc(j.description || `${j.title} at ${j.company?.name}. Fresh graduates welcome.`)}</p>` +
    (reqs.length ? `<p>Requirements:</p><ul>${reqs.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>` : "") +
    (j.major_list?.length ? `<p>Majors: ${esc(j.major_list.join(", "))}</p>` : "");
  const c = j.company || {};
  const ld = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: j.title,
    description,
    identifier: { "@type": "PropertyValue", name: SITE_EN, value: String(j.id) },
    datePosted: j.posted_at,
    employmentType: EMPLOYMENT[j.job_type] || "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: c.name,
      ...(c.website ? { sameAs: c.website } : {}),
      ...(c.logo ? { logo: abs(c.logo) } : {}),
    },
    experienceRequirements: {
      "@type": "OccupationalExperienceRequirements",
      monthsOfExperience: Math.max(0, (j.experience_max_years || 0) * 12),
    },
    directApply: j.channel === "partner" || j.channel === "email",
    url: `${origin()}/jobs/${j.id}`,
  };
  if (j.deadline) ld.validThrough = `${j.deadline}T23:59:59+06:00`;
  if (j.remote) {
    ld.jobLocationType = "TELECOMMUTE";
    ld.applicantLocationRequirements = { "@type": "Country", name: "Bangladesh" };
  }
  if (!j.remote || (j.location && !/^remote$/i.test(j.location))) {
    ld.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: (j.location || c.city || "Dhaka").replace(/\s*&.*$/, ""),
        addressCountry: "BD",
      },
    };
  }
  if (j.salary_min || j.salary_max) {
    ld.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "BDT",
      value: {
        "@type": "QuantitativeValue",
        ...(j.salary_min && j.salary_max
          ? { minValue: j.salary_min, maxValue: j.salary_max }
          : { value: j.salary_min || j.salary_max }),
        unitText: "MONTH",
      },
    };
  }
  return ld;
}

/** ItemList for a listing page: points Google at each job's detail URL (where the JobPosting lives). */
export function jobListLd(jobs) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: (jobs || []).slice(0, 50).map((j, i) => ({ "@type": "ListItem", position: i + 1, url: `${origin()}/jobs/${j.id}` })),
  };
}
