import { Role, ADMIN_ROLES, ARTIST_ROLES, LISTENER_ROLES } from "../types";

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as Role);
}

export function isArtistRole(role: string): boolean {
  return ARTIST_ROLES.includes(role as Role);
}

export function isListenerRole(role: string): boolean {
  return LISTENER_ROLES.includes(role as Role);
}

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [Role.SUPER_ADMIN]: ["*"],
  [Role.ADMIN]: ["users:read","users:write","songs:*","albums:*","artists:read","artists:write","revenue:*","payouts:*","ads:*"],
  [Role.FINANCE]: ["revenue:read","revenue:write","payouts:read","payouts:write","invoices:*"],
  [Role.MODERATOR]: ["songs:read","songs:write","comments:*","copyright:*"],
  [Role.SUPPORT]: ["tickets:*","users:read"],
  [Role.CONTENT_EDITOR]: ["songs:read","songs:write","albums:read","albums:write","playlists:*","featured:*"],
  [Role.ARTIST]: ["songs:own","albums:own","analytics:own","revenue:own","profile:own"],
  [Role.VERIFIED_ARTIST]: ["songs:own","albums:own","analytics:own","revenue:own","profile:own","promotions:*"],
  [Role.LISTENER]: ["stream:*","download:*","like:*","comment:*","playlist:own"],
  [Role.PREMIUM_LISTENER]: ["stream:*","download:*","like:*","comment:*","playlist:own","offline:*","hd:*"],
};
