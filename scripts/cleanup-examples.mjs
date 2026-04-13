// Cleanup script to remove example data from Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
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

console.log('🔥 Connecting to Firestore:', firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const FOLDER_IDS = [
  "sound-effects-Transition",
  "sound-effects-Impact",
  "sound-effects-UI---Click",
  "sound-effects-Ambient",
  "music-Background",
  "music-Intro-Outro",
  "video-meme-Reaction",
  "video-meme-Trending"
];

const RESOURCE_IDS = [
  "whoosh-fast",
  "swoosh-smooth",
  "glitch-digital",
  "boom-deep",
  "hit-punch",
  "click-ui",
  "notification-pop",
  "rain-ambient",
  "chill-lofi-beat",
  "upbeat-energy",
  "cinematic-epic",
  "short-intro-jingle",
  "sad-cat-meme",
  "surprised-pikachu",
  "sigma-walk"
];

async function cleanup() {
  console.log('\n📁 Deleting example folders...');
  for (const id of FOLDER_IDS) {
    try {
      await deleteDoc(doc(db, "folders", id));
      console.log(`  ✅ Deleted folder: ${id}`);
    } catch (e) {
      console.error(`  ❌ Failed to delete folder ${id}:`, e.message);
    }
  }

  console.log('\n🎵 Deleting example resources...');
  for (const id of RESOURCE_IDS) {
    try {
      await deleteDoc(doc(db, "resources", id));
      console.log(`  ✅ Deleted resource: ${id}`);
    } catch (e) {
      console.error(`  ❌ Failed to delete resource ${id}:`, e.message);
    }
  }

  console.log('\n🎉 Cleanup complete!');
  process.exit(0);
}

cleanup().catch((err) => {
  console.error('❌ Cleanup failed:', err.message);
  process.exit(1);
});
