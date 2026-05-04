import CategoryCard from "@/app/components/ui/CategoryCard";
import SearchBar from "@/app/components/ui/SearchBar";
import { getCategoriesWithCounts } from "@/app/lib/api";
import styles from "./page.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sfxfolder.com';

export default async function Home() {
  let categories = [];
  try {
    categories = await getCategoriesWithCounts();
  } catch (e) {
    // Fallback static data with Neobrutalist palette
    categories = [
      { slug: "sound-effects", name: "Sound Effects", icon: "volume-2", color: "#FFD93D", description: "High-quality SFX" },
      { slug: "music", name: "Music", icon: "music", color: "#FF6B6B", description: "Royalty-free tracks" },
      { slug: "video-meme", name: "Video Meme", icon: "film", color: "#6C5CE7", description: "Trending meme clips" },
      { slug: "green-screen", name: "Green Screen", icon: "monitor", color: "#1DD1A1", description: "Chroma key assets" },
      { slug: "animation", name: "Animation", icon: "sparkles", color: "#FF9F43", description: "Motion graphics" },
      { slug: "image-overlay", name: "Image & Overlay", icon: "image", color: "#A55EE1", description: "Visual overlays" },
      { slug: "font", name: "Font", icon: "type", color: "#00D2D3", description: "Professional typefaces" },
      { slug: "preset-lut", name: "Preset & LUT", icon: "sliders", color: "#54A0FF", description: "Color grading tools" },
    ];
  }

  // JSON-LD: WebPage schema for homepage
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "SFXFolder — Free Resource Folder for Video Editors",
    description: "Curated collection of free sound effects, music, and assets for video editors based on professional experience.",
    url: SITE_URL,
    isPartOf: {
      "@type": "WebSite",
      name: "SFXFolder",
      url: SITE_URL,
    },
  };

  // JSON-LD: ItemList schema for category listing
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Resource Categories",
    description: "Browse free video editing resources by category",
    numberOfItems: categories.length,
    itemListElement: categories.map((cat, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: cat.name,
      url: `${SITE_URL}/${cat.slug}`,
      description: cat.description || `Free ${cat.name} for video editing`,
    })),
  };

  return (
    <div className={styles.page}>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema),
        }}
      />

      {/* Hero Section */}
      <section className={styles.hero} id="hero-section">
        <div className={styles.heroGlow} />
        <h1 className={styles.title}>
          Free Resource Folder for Video Editors
        </h1>
        <p className={styles.subtitle}>
          SFXFolder.com — Curated Assets Based on Professional Experience
        </p>
        <p className={styles.description}>
          A curated collection of free pro-grade sound effects, music, and tools hand-picked from real-world projects. 
          Download instantly — 100% free with no copyright issues.
        </p>
        <div className={styles.searchWrap}>
          <SearchBar size="large" placeholder="Search free sound effects, music, presets..." />
        </div>
      </section>

      {/* Plugin Download Section */}
      <section className={styles.plugin} id="plugin-download">
        <div className={styles.pluginTag}>NEW TOOL</div>
        <h2 className={styles.pluginTitle}>SFXFolder for Premiere Pro</h2>
        <p className={styles.pluginSubtitle}>
          The ultimate extension for video editors. Search and drag & drop assets directly into your timeline without leaving Premiere.
        </p>
        <div className={styles.pluginButtons}>
          <a href="/downloads/SFXFolder_Setup.zip" download className={`${styles.downloadBtn} ${styles.winBtn}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1V11.7H0V3.449zm0 9.151h9.75v9.6L0 20.551V12.6zm10.65-10.5L24 0v11.7h-13.35V2.1zM10.65 12.6H24v11.4l-13.35-2.1V12.6z"/></svg>
            Windows (.zip)
          </a>
          <a href="/downloads/install_mac.command" download className={`${styles.downloadBtn} ${styles.macBtn}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.057 12.781c.032 2.588 2.254 3.462 2.287 3.477-.023.072-.355 1.213-1.155 2.384-.693 1.012-1.413 2.022-2.532 2.042-1.101.02-1.453-.648-2.711-.648-1.258 0-1.65.628-2.711.668-1.101.04-1.921-1.112-2.618-2.122-1.428-2.062-2.518-5.822-1.048-8.362.728-1.263 2.023-2.064 3.428-2.084 1.066-.02 2.072.719 2.723.719.651 0 1.872-.91 3.142-.784 1.27.126 2.224.64 2.824 1.514-.023.014-2.627 1.534-2.6 4.6zM15.303 3.693c.571-.693.955-1.655.849-2.618-.826.033-1.826.549-2.418 1.242-.531.614-.997 1.597-.872 2.539.923.072 1.869-.47 2.441-1.163z"/></svg>
            macOS (.command)
          </a>
        </div>
      </section>

      {/* Categories Grid */}
      <section className={styles.categories} id="categories-section">
        <h2 className={styles.sectionTitle}>Browse Free Resources by Category</h2>
        <div className={styles.grid}>
          {categories.map((cat, index) => (
            <CategoryCard
              key={cat.slug}
              name={cat.name}
              slug={cat.slug}
              icon={cat.icon}
              color={cat.color}
              description={cat.description}
              resourceCount={cat.resourceCount}
              index={index}
            />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats} id="stats-section">
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{categories.length}</span>
          <span className={styles.statLabel}>Categories</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>Instant</span>
          <span className={styles.statLabel}>Download</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>100%</span>
          <span className={styles.statLabel}>Open Access</span>
        </div>
      </section>
    </div>
  );
}
