/**
 * ADCO Seed Data ESM Export
 * Bridges seed activities for ES-module services.
 */

export const SEED_ACTIVITIES = (typeof window !== 'undefined' && window.ADCO_SEED_ACTIVITIES)
  ? window.ADCO_SEED_ACTIVITIES
  : [];

export const INITIAL_SEED_ACTIVITIES = SEED_ACTIVITIES;
