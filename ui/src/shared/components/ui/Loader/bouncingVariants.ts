/**
 * The cold-start animations, in the order clicking cycles through them.
 *
 * Kept out of BouncingLoader.tsx so that file exports only its component: a module that mixes
 * components with other values opts out of fast refresh, and every edit to it reloads the page
 * instead of swapping the component in place.
 */
export const BOUNCING_VARIANTS = ['twoBall', 'seesaw', 'turningBox', 'road', 'cup'] as const;

export type BouncingVariant = (typeof BOUNCING_VARIANTS)[number];
