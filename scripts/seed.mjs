// Quick seed script - run with: node scripts/seed.mjs
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { config } from 'dotenv';

// Load .env.local
config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('🔥 Connecting to Firebase project:', firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CATEGORIES = [
  { slug: "sound-effects", name: "Sound Effects", icon: "volume-2", color: "#FFFFFF", order: 0, formats: ["mp3", "wav", "ogg"] },
  { slug: "music", name: "Music", icon: "music", color: "#E5E7EB", order: 1, formats: ["mp3", "wav", "flac"] },
  { slug: "video-meme", name: "Video Meme", icon: "film", color: "#D1D5DB", order: 2, formats: ["mp4", "webm", "gif"] },
  { slug: "green-screen", name: "Green Screen", icon: "monitor", color: "#9CA3AF", order: 3, formats: ["mp4", "mov", "webm"] },
  { slug: "animation", name: "Animation", icon: "sparkles", color: "#6B7280", order: 4, formats: ["mp4", "gif", "webm"] },
  { slug: "image-overlay", name: "Image & Overlay", icon: "image", color: "#4B5563", order: 5, formats: ["png", "jpg", "webp"] },
  { slug: "font", name: "Font", icon: "type", color: "#374151", order: 6, formats: ["ttf", "otf", "woff2"] },
  { slug: "preset-lut", name: "Preset & LUT", icon: "sliders", color: "#1F2937", order: 7, formats: ["cube", "xmp", "lut"] },
];

const FOLDERS = [];
const RESOURCES = [];


async function seed() {
  console.log('\n📦 Seeding categories...');
  for (const cat of CATEGORIES) {
    await setDoc(doc(db, "categories", cat.slug), {
      ...cat, resourceCount: 0, createdAt: serverTimestamp(),
    });
    console.log(`  ✅ ${cat.name}`);
  }

  console.log('\n📁 Seeding folders...');
  for (const folder of FOLDERS) {
    const id = `${folder.categorySlug}-${folder.path}`.replace(/[^a-zA-Z0-9-]/g, "-");
    await setDoc(doc(db, "folders", id), {
      categorySlug: folder.categorySlug,
      name: folder.name,
      path: folder.path,
      order: folder.order,
      resourceCount: 0,
      children: folder.children.map(c => ({ name: c, path: `${folder.path}/${c}`, resourceCount: 0 })),
    });
    console.log(`  ✅ ${folder.categorySlug}/${folder.name}`);
  }

  console.log('\n🎵 Seeding resources...');
  for (const res of RESOURCES) {
    await setDoc(doc(db, "resources", res.slug), {
      ...res,
      fileUrl: "",
      thumbnailUrl: "",
      previewUrl: "",
      downloadCount: Math.floor(Math.random() * 2000),
      isPublished: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`  ✅ ${res.name} (${res.fileFormat})`);
  }

  console.log('\n⚙️ Seeding settings...');
  await setDoc(doc(db, "settings", "general"), {
    siteName: "EditerLor",
    tagline: "Free Resources for Video Editors",
    seoDescription: "Download free sound effects, music, video memes, green screens, animations, overlays, fonts, and presets.",
    contactEmail: "",
    updatedAt: serverTimestamp(),
  });
  console.log('  ✅ Settings saved');

  console.log('\n🎉 Seed complete!');
  console.log(`   Categories: ${CATEGORIES.length}`);
  console.log(`   Folders: ${FOLDERS.length}`);
  console.log(`   Resources: ${RESOURCES.length}`);
  console.log(`   Settings: ✅`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
