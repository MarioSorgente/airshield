// Landing-page tunables.
// WAITLIST_OFFSET is the social-proof base: a new signup's position is shown as
// OFFSET + total signups, so the list never reads as empty. Override per env
// with VITE_WAITLIST_OFFSET; defaults to 120.
export const WAITLIST_OFFSET = Number(
  import.meta.env.VITE_WAITLIST_OFFSET ?? 120
);
