import { Database } from "bun:sqlite";
import { DB_PATH } from "../config";

const db = new Database(DB_PATH);

const INVITATION_EXPIRY_DAYS = 7;

export interface Invitation {
  id: string;
  email: string;
  token: string;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  usedAt: number | null;
  usedBy: string | null;
}

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  for (let i = 0; i < bytes.length; i++) {
    token += chars[bytes[i] % chars.length];
  }
  return token;
}

export function createInvitation(email: string, createdBy: string): Invitation {
  const id = crypto.randomUUID();
  const token = generateToken();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + INVITATION_EXPIRY_DAYS * 24 * 60 * 60;

  db.run(
    `INSERT INTO invitation (id, email, token, createdBy, createdAt, expiresAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, email.toLowerCase().trim(), token, createdBy, now, expiresAt]
  );

  return {
    id,
    email: email.toLowerCase().trim(),
    token,
    createdBy,
    createdAt: now,
    expiresAt,
    usedAt: null,
    usedBy: null,
  };
}

export function getInvitationByToken(token: string): Invitation | null {
  return db.query(
    `SELECT * FROM invitation WHERE token = ?`
  ).get(token) as Invitation | null;
}

export function getInvitationById(id: string): Invitation | null {
  return db.query(
    `SELECT * FROM invitation WHERE id = ?`
  ).get(id) as Invitation | null;
}

export function getPendingInvitations(): Invitation[] {
  const now = Math.floor(Date.now() / 1000);
  return db.query(
    `SELECT * FROM invitation WHERE usedAt IS NULL AND expiresAt > ? ORDER BY createdAt DESC`
  ).all(now) as Invitation[];
}

export function getAllInvitations(): Invitation[] {
  return db.query(
    `SELECT * FROM invitation ORDER BY createdAt DESC`
  ).all() as Invitation[];
}

export function isInvitationValid(token: string): boolean {
  const invitation = getInvitationByToken(token);
  if (!invitation) return false;
  if (invitation.usedAt) return false;
  
  const now = Math.floor(Date.now() / 1000);
  if (invitation.expiresAt <= now) return false;
  
  return true;
}

export function markInvitationUsed(token: string, usedBy: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  const result = db.run(
    `UPDATE invitation SET usedAt = ?, usedBy = ? WHERE token = ? AND usedAt IS NULL`,
    [now, usedBy, token]
  );
  return result.changes > 0;
}

export function revokeInvitation(id: string): boolean {
  const result = db.run(
    `DELETE FROM invitation WHERE id = ? AND usedAt IS NULL`,
    [id]
  );
  return result.changes > 0;
}

export function getInvitationExpiryDays(): number {
  return INVITATION_EXPIRY_DAYS;
}
