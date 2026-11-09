import { Link } from "react-router-dom";
import { useT } from "../i18n";
import Logo from "./Logo";

export default function Footer() {
  const t = useT();
  return (
    <footer id="footer">
      <div className="f-top">
        <div className="logo"><Logo /></div>
        <small>{t("Built for freshers. Made in Bangladesh.", "ফ্রেশারদের জন্য, বাংলাদেশে তৈরি।")}</small>
      </div>
      <div className="search">
        <h6>{t("Start your search", "খোঁজা শুরু করো")}</h6>
        <details><summary>{t("Get job-ready", "চাকরির প্রস্তুতি")}</summary><ul>
          <li><Link to="/cv">{t("Judge my CV", "সিভি চেক")}</Link></li><li><Link to="/quick-test">{t("Quick Test", "কুইক টেস্ট")}</Link></li>
          <li><Link to="/interview">{t("AI Interview", "এআই ইন্টারভিউ")}</Link></li><li><Link to="/efficiency">{t("Efficiency Test", "এফিশিয়েন্সি টেস্ট")}</Link></li>
        </ul></details>
        <details><summary>{t("Jobs", "চাকরি")}</summary><ul>
          <li><Link to="/jobs">{t("Fresher jobs", "ফ্রেশার জব")}</Link></li><li><Link to="/jobs#auto">{t("Auto-apply", "অটো-অ্যাপ্লাই")}</Link></li><li><Link to="/applications">{t("My applications", "আমার আবেদন")}</Link></li>
        </ul></details>
        <details><summary>{t("Programs", "প্রোগ্রাম")}</summary><ul>
          <li><Link to="/programs?kind=graduate">{t("Graduate programs", "গ্র্যাজুয়েট প্রোগ্রাম")}</Link></li><li><Link to="/programs?kind=internship">{t("Internships", "ইন্টার্নশিপ")}</Link></li>
          <li><Link to="/programs?kind=training">{t("Offline training", "অফলাইন ট্রেনিং")}</Link></li>
        </ul></details>
        <details><summary>{t("Certificates", "সার্টিফিকেট")}</summary><ul>
          <li><Link to="/certificates">{t("My certificates", "আমার সার্টিফিকেট")}</Link></li><li><Link to="/certificates#verify">{t("Verify a certificate", "সার্টিফিকেট যাচাই")}</Link></li><li><Link to="/stories">{t("Success stories", "সাফল্যের গল্প")}</Link></li>
        </ul></details>
        <details><summary>{t("Network & more", "নেটওয়ার্ক ও আরও")}</summary><ul>
          <li><Link to="/network">{t("Network · chat with your people", "নেটওয়ার্ক")}</Link></li><li><Link to="/portfolio">{t("Portfolio website builder", "পোর্টফোলিও ওয়েবসাইট")}</Link></li><li><Link to="/startup">{t("Startup fund", "স্টার্টআপ ফান্ড")}</Link></li>
        </ul></details>
      </div>
      <div className="fine">
        {t("Counters on the home page are demo figures.", "হোম পেজের সংখ্যাগুলো ডেমো।")}<br />
        
        © 2026 সোনারহরিণ (Sonarhorin). All rights reserved.
      </div>
    </footer>
  );
}
