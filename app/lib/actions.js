"use server";

import { revalidateTag } from "next/cache";

/**
 * Revalidate the site settings cache.
 */
export async function revalidateSettings() {
  revalidateTag('settings');
}

/**
 * Revalidate categories cache.
 */
export async function revalidateCategoryData() {
  revalidateTag('categories');
}

// Alias for compatibility
export async function revalidateCategories() {
  return revalidateCategoryData();
}

/**
 * Revalidate resource list cache.
 * Note: This also revalidates folders as they are often displayed together.
 */
export async function revalidateResourceData() {
  revalidateTag('resources');
}

/**
 * Revalidate tags cache.
 */
export async function revalidateTagData() {
  revalidateTag('tags');
}

/**
 * Revalidate folders cache.
 */
export async function revalidateFolderData() {
  revalidateTag('folders');
}

/**
 * Comprehensive revalidation for tag-related changes.
 * When a tag is renamed or deleted, it affects both tags list and resources.
 */
export async function revalidateTagChanges() {
  revalidateTag('tags');
  revalidateTag('resources');
}
