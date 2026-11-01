// server/serverApp.ts
import "dotenv/config";
import express2 from "express";
import cookieParser from "cookie-parser";
import path3 from "path";
import fs3 from "fs";

// server/api.ts
import express from "express";
import fs2 from "fs";
import path2 from "path";
import crypto2 from "crypto";

// server/db.ts
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

// src/types/pvp.ts
var WHITE_KINGDOM_TIERS = [
  { name: "HT1", label: "High Tier 1 (Apex Master)", rank: 10, color: "#00e5ff", badgeBg: "bg-cyan-500/20", badgeBorder: "border-cyan-400/60" },
  { name: "LT1", label: "Low Tier 1", rank: 9, color: "#38bdf8", badgeBg: "bg-sky-500/20", badgeBorder: "border-sky-400/60" },
  { name: "HT2", label: "High Tier 2", rank: 8, color: "#0088ff", badgeBg: "bg-blue-600/20", badgeBorder: "border-blue-500/60" },
  { name: "LT2", label: "Low Tier 2", rank: 7, color: "#60a5fa", badgeBg: "bg-blue-400/20", badgeBorder: "border-blue-400/50" },
  { name: "HT3", label: "High Tier 3", rank: 6, color: "#818cf8", badgeBg: "bg-indigo-500/20", badgeBorder: "border-indigo-400/50" },
  { name: "LT3", label: "Low Tier 3", rank: 5, color: "#a5b4fc", badgeBg: "bg-indigo-400/20", badgeBorder: "border-indigo-300/40" },
  { name: "HT4", label: "High Tier 4", rank: 4, color: "#94a3b8", badgeBg: "bg-slate-500/20", badgeBorder: "border-slate-400/50" },
  { name: "LT4", label: "Low Tier 4", rank: 3, color: "#64748b", badgeBg: "bg-slate-600/20", badgeBorder: "border-slate-500/50" },
  { name: "HT5", label: "High Tier 5", rank: 2, color: "#475569", badgeBg: "bg-slate-700/20", badgeBorder: "border-slate-600/50" },
  { name: "LT5", label: "Low Tier 5 (Novice)", rank: 1, color: "#334155", badgeBg: "bg-slate-800/30", badgeBorder: "border-slate-700/50" }
];

// src/utils/pvpLogic.ts
function validateDiscordId(id) {
  if (!id || typeof id !== "string") {
    return { valid: false, error: "\u0645\u0639\u0631\u0651\u0641 \u062F\u064A\u0633\u0643\u0648\u0631\u062F (Discord User ID) \u0645\u0637\u0644\u0648\u0628." };
  }
  const trimmed = id.trim();
  if (!/^\d{17,20}$/.test(trimmed)) {
    return { valid: false, error: "\u0635\u064A\u063A\u0629 \u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u062F\u064A\u0633\u0643\u0648\u0631\u062F \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629. \u064A\u062C\u0628 \u0623\u0646 \u064A\u062A\u0643\u0648\u0646 \u0645\u0646 17 \u0625\u0644\u0649 20 \u0631\u0642\u0645\u0627\u064B." };
  }
  return { valid: true };
}
function resolveDiscordAvatar(discordId, customAvatar) {
  if (customAvatar && customAvatar.trim().length > 0) {
    return customAvatar;
  }
  try {
    const defaultIndex = (BigInt(discordId) >> 22n) % 6n;
    return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
  } catch {
    return "https://cdn.discordapp.com/embed/avatars/0.png";
  }
}
function getTierRank(tierName, tierDefinitions = WHITE_KINGDOM_TIERS) {
  if (!tierName) return 0;
  const clean = tierName.trim().toLowerCase();
  const match = tierDefinitions.find((t) => t.name.toLowerCase() === clean);
  if (match) return match.rank;
  const m = clean.match(/^(ht|lt)(\d+)$/);
  if (m) {
    const isHt = m[1] === "ht";
    const num = parseInt(m[2], 10);
    const base = isHt ? 12 - num * 2 : 11 - num * 2;
    return Math.max(0, base);
  }
  return 0;
}
function getTierDefinition(tierName, tierDefinitions = WHITE_KINGDOM_TIERS) {
  if (!tierName) return void 0;
  const clean = tierName.trim().toUpperCase();
  return tierDefinitions.find((t) => t.name.toUpperCase() === clean);
}
function resolveUserRoles(assignedRoleIds = [], allRoles = []) {
  if (!Array.isArray(assignedRoleIds) || assignedRoleIds.length === 0) return [];
  const roleMap = /* @__PURE__ */ new Map();
  for (const role of allRoles) {
    roleMap.set(role.id, role);
    roleMap.set(role.name.toLowerCase(), role);
  }
  const resolved = [];
  for (const id of assignedRoleIds) {
    const match = roleMap.get(id) || roleMap.get(id.toLowerCase());
    if (match && !resolved.some((r) => r.id === match.id)) {
      resolved.push(match);
    }
  }
  return resolved.sort((a, b) => (a.order || 0) - (b.order || 0));
}
function formatPublicLeaderboard(players, tierDefinitions) {
  const sorted = [...players].sort((a, b) => {
    if (b.tierRank !== a.tierRank) {
      return b.tierRank - a.tierRank;
    }
    return (a.createdAt || "").localeCompare(b.createdAt || "");
  });
  return sorted.map((p, index) => ({
    id: p.id,
    rank: index + 1,
    minecraftName: p.minecraftName,
    discordDisplayName: p.discordDisplayName || `Discord_${p.discordId.slice(-4)}`,
    discordUsername: p.discordUsername || void 0,
    discordAvatar: resolveDiscordAvatar(p.discordId, p.discordAvatar),
    tierName: p.tierName || "HT1",
    tierRank: p.tierRank || getTierRank(p.tierName || "HT1", tierDefinitions),
    gamesPlayed: Array.isArray(p.gamesPlayed) ? p.gamesPlayed : [],
    notes: p.notes || ""
  }));
}

// server/db.ts
var { Pool } = pg;
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var DATA_DIR = path.resolve(__dirname, "../data");
var DB_FILE = path.join(DATA_DIR, "white_kingdom_db.json");
var DEFAULT_SETTINGS = {
  serverName: "\u{1D47E}\u{1D489}\u{1D48A}\u{1D495}\u{1D486} \u{1D472}\u{1D48A}\u{1D48F}\u{1D488}\u{1D485}\u{1D490}\u{1D48E}",
  logoUrl: "/logo.png",
  youtubeUrl: "https://www.youtube.com/@WhiteKingdom",
  discordInviteUrl: "https://discord.gg/whitekingdom",
  ownerDiscordId: "1324725244073873539",
  ownerName: "\u13B3\u13BB\u13C6\u13BF\u13AC \u13DA\u13AA\u13B7\u13AA",
  ownerAvatar: "https://cdn.discordapp.com/avatars/1324725244073873539/94f6605b6a3c19a765e66e00e7c2caa2.png?size=256",
  ownerTag: "\u0635\u0627\u062D\u0628 \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0648\u0645\u0624\u0633\u0633 \u0627\u0644\u0645\u0648\u0642\u0639",
  aboutContent: `\u0623\u0647\u0644\u0627\u064B \u0628\u0643\u0645 \u0641\u064A \u0645\u062C\u062A\u0645\u0639 \u{1D47E}\u{1D489}\u{1D48A}\u{1D495}\u{1D486} \u{1D472}\u{1D48A}\u{1D48F}\u{1D488}\u{1D485}\u{1D490}\u{1D48E}\u060C \u0633\u064A\u0631\u0641\u0631 \u062F\u064A\u0633\u0643\u0648\u0631\u062F \u0627\u0644\u062A\u0646\u0627\u0641\u0633\u064A \u0627\u0644\u0645\u062E\u0635\u0635 \u0644\u0639\u0634\u0627\u0642 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0648\u0627\u0644\u0645\u0628\u0627\u0631\u0632\u0627\u062A.

\u062A\u0645 \u062A\u0623\u0633\u064A\u0633 \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0644\u062C\u0645\u0639 \u0627\u0644\u0644\u0627\u0639\u0628\u064A\u0646 \u0627\u0644\u0645\u062A\u0645\u064A\u0632\u064A\u0646 \u0644\u062E\u0648\u0636 \u0627\u0644\u062A\u062D\u062F\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u0628\u0627\u0631\u064A\u0627\u062A \u0627\u0644\u062D\u0645\u0627\u0633\u064A\u0629\u060C \u0648\u0645\u0634\u0627\u0631\u0643\u0629 \u0627\u0644\u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0627\u062A\u060C \u0648\u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u0645\u0633\u062A\u0648\u064A\u0627\u062A \u0627\u0644\u062A\u0646\u0627\u0641\u0633\u064A\u0629.

\u0627\u0646\u0636\u0645 \u0625\u0644\u064A\u0646\u0627 \u0641\u064A \u0633\u064A\u0631\u0641\u0631 \u0627\u0644\u062F\u064A\u0633\u0643\u0648\u0631\u062F \u0644\u062A\u0643\u0648\u0646 \u062C\u0632\u0621\u0627\u064B \u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u0645\u062C\u062A\u0645\u0639 \u0648\u0634\u0627\u0631\u0643 \u0641\u064A \u0627\u0644\u0628\u0637\u0648\u0644\u0627\u062A \u0648\u0627\u0644\u062A\u062D\u062F\u064A\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u0645\u0631\u0629!`,
  tierTestContent: `\u062A\u0646\u0628\u064A\u0647 \u0647\u0627\u0645 \u0648\u0645\u0644\u0627\u062D\u0638\u0629 \u062A\u0648\u0636\u064A\u062D\u064A\u0629:
\u0647\u0630\u0627 \u0646\u0638\u0627\u0645 \u0627\u062E\u062A\u0628\u0627\u0631 \u0648\u062A\u062D\u062F\u064A\u062F \u0645\u0633\u062A\u0648\u064A\u0627\u062A (Tier Test) \u0645\u062C\u062A\u0645\u0639\u064A \u0634\u062E\u0635\u064A \u062A\u0645 \u0625\u0646\u0634\u0627\u0624\u0647 \u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645\u0646\u0627 \u0627\u0644\u062E\u0627\u0635 \u062F\u0627\u062E\u0644 \u0645\u062C\u062A\u0645\u0639 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0648\u0633\u064A\u0631\u0641\u0631 \u062F\u064A\u0633\u0643\u0648\u0631\u062F \u{1D47E}\u{1D489}\u{1D48A}\u{1D495}\u{1D486} \u{1D472}\u{1D48A}\u{1D48F}\u{1D488}\u{1D485}\u{1D490}\u{1D48E}.

\u0647\u0630\u0627 \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631 \u0644\u064A\u0633 \u0646\u0638\u0627\u0645 \u062A\u0635\u0646\u064A\u0641 \u0631\u0633\u0645\u064A \u0644\u0623\u064A \u0633\u064A\u0631\u0641\u0631 \u0645\u0627\u064A\u0646 \u0643\u0631\u0627\u0641\u062A\u060C \u0648\u0644\u0627 \u064A\u0631\u062A\u0628\u0637 \u0628\u0623\u064A \u0633\u064A\u0631\u0641\u0631 \u0623\u0648 \u062C\u0647\u0629 \u0623\u0648 \u0645\u0646\u0635\u0629 \u062A\u0635\u0646\u064A\u0641 \u0631\u0633\u0645\u064A\u0629 \u0639\u0644\u0649 \u0627\u0644\u0625\u0637\u0644\u0627\u0642.

\u062A\u064F\u062C\u0631\u0649 \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0641\u064A \u0623\u064A \u0633\u064A\u0631\u0641\u0631 \u064A\u062E\u062A\u0627\u0631\u0647 \u0627\u0644\u0623\u062F\u0645\u0646 \u0648\u0628\u0623\u064A \u0645\u0648\u062F \u0644\u0639\u0628\u060C \u0648\u0627\u0644\u062A\u0631\u062A\u064A\u0628 \u064A\u0639\u0643\u0633 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u062A\u0646\u0627\u0641\u0633\u064A \u062F\u0627\u062E\u0644 \u0645\u062C\u062A\u0645\u0639\u0646\u0627.

\u0623\u062F\u0646\u0627\u0647 \u0642\u0627\u0626\u0645\u0629 \u0628\u0627\u0644\u0633\u064A\u0631\u0641\u0631\u0627\u062A \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0644\u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A\u060C \u0648\u0632\u0631 \u0639\u0631\u0636 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u062A\u0635\u062F\u0631\u064A\u0646.`,
  newsContent: `\u062A\u0627\u0628\u0639 \u0622\u062E\u0631 \u0623\u062E\u0628\u0627\u0631 \u0648\u062A\u062D\u062F\u064A\u062B\u0627\u062A \u0645\u062C\u062A\u0645\u0639 \u{1D47E}\u{1D489}\u{1D48A}\u{1D495}\u{1D486} \u{1D472}\u{1D48A}\u{1D48F}\u{1D488}\u{1D485}\u{1D490}\u{1D48E}\u060C \u0645\u0648\u0627\u0639\u064A\u062F \u0628\u0637\u0648\u0644\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0631\u0632\u0627\u062A\u060C \u0648\u0642\u0648\u0627\u0626\u0645 \u0627\u0644\u062A\u062D\u062F\u064A\u062B\u0627\u062A \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0623\u0648\u0644\u0627\u064B \u0628\u0623\u0648\u0644.`,
  welcomeBadgeText: `\u0627\u0644\u0645\u062C\u062A\u0645\u0639 \u0627\u0644\u062A\u0646\u0627\u0641\u0633\u064A \u0627\u0644\u0631\u0633\u0645\u064A 2026`
};
var DEFAULT_NEWS = [
  {
    id: "news_1",
    title: "\u0627\u0641\u062A\u062A\u0627\u062D \u0628\u0627\u0628 \u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u0648\u064A\u0627\u062A \u0627\u0644\u0631\u0633\u0645\u064A\u0629 (Tier Tests)",
    content: "\u0623\u0639\u0644\u0646\u062A \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0639\u0646 \u0641\u062A\u062D \u0628\u0627\u0628 \u062A\u0642\u064A\u064A\u0645 \u0648\u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u0645\u0633\u062A\u0648\u064A\u0627\u062A \u0644\u062C\u0645\u064A\u0639 \u0623\u0639\u0636\u0627\u0621 \u0627\u0644\u0645\u062C\u062A\u0645\u0639 \u0641\u064A \u0645\u0648\u062F\u0627\u062A \u0627\u0644\u0646\u064A\u0630\u0631\u0644\u0627\u064A\u062A \u0648\u0627\u0644\u0643\u0631\u064A\u0633\u062A\u0627\u0644 \u0648\u0627\u0644\u0640 Axe & Shield. \u064A\u0645\u0643\u0646\u0643\u0645 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0644\u062A\u062D\u062F\u064A\u062F \u0645\u0648\u0639\u062F \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631.",
    category: "\u0625\u0639\u0644\u0627\u0646 \u0647\u0627\u0645",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
    createdAt: "2026-10-28T18:00:00.000Z",
    updatedAt: "2026-10-28T18:00:00.000Z"
  },
  {
    id: "news_2",
    title: "\u0625\u0637\u0644\u0627\u0642 \u0628\u0637\u0648\u0644\u0629 White Kingdom \u0627\u0644\u0623\u0648\u0644\u0649 \u0644\u0644\u0645\u0628\u0627\u0631\u0632\u0627\u062A \u0627\u0644\u062B\u0646\u0627\u0626\u064A\u0629",
    content: "\u0627\u0633\u062A\u0639\u062F\u0648\u0627 \u0644\u0623\u0642\u0648\u0649 \u0628\u0637\u0648\u0644\u0629 \u062A\u0646\u0627\u0641\u0633\u064A\u0629 \u0644\u0644\u0645\u0628\u0627\u0631\u0632\u0627\u062A \u0641\u064A \u0627\u0644\u0633\u064A\u0631\u0641\u0631! \u062C\u0648\u0627\u0626\u0632 \u062D\u0635\u0631\u064A\u0629 \u0644\u0644\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0623\u0648\u0644\u0649\u060C \u0648\u062A\u0631\u0642\u064A\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A HT1 \u0644\u0644\u0645\u062A\u0648\u062C\u064A\u0646 \u0628\u0627\u0644\u0644\u0642\u0628.",
    category: "\u0628\u0637\u0648\u0644\u0627\u062A",
    imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80",
    createdAt: "2026-10-25T14:30:00.000Z",
    updatedAt: "2026-10-25T14:30:00.000Z"
  }
];
var DEFAULT_ROLES = [
  {
    id: "role_founder",
    name: "Founder & Owner",
    color: "#00e5ff",
    emoji: "\u{1F451}",
    order: 1,
    description: "\u0645\u0624\u0633\u0633 \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0648\u0635\u0627\u062D\u0628 \u0627\u0644\u0645\u0648\u0642\u0639 \u0648\u0625\u062F\u0627\u0631\u062A\u0647 \u0627\u0644\u0639\u0644\u064A\u0627.",
    criteria: "\u062A\u064F\u0645\u0646\u062D \u062D\u0635\u0631\u064A\u0627\u064B \u0644\u0645\u0627\u0644\u0643 \u0648\u0645\u0624\u0633\u0633 \u0633\u064A\u0631\u0641\u0631 \u0648\u0645\u062C\u062A\u0645\u0639 White Kingdom \u0648\u0644\u0647 \u0643\u0627\u0645\u0644 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0648\u0627\u0644\u062A\u0642\u0646\u064A\u0629.",
    showInList: true
  },
  {
    id: "role_tester",
    name: "Official Tester",
    color: "#38bdf8",
    emoji: "\u2694\uFE0F",
    order: 2,
    description: "\u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0639\u0646 \u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0648\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0645\u0633\u062A\u0648\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u0628\u0627\u0631\u0632\u0627\u062A.",
    criteria: "\u062A\u064F\u0645\u0646\u062D \u0644\u0644\u0645\u062E\u062A\u0628\u0631\u064A\u0646 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u064A\u0646 \u0648\u0627\u0644\u0645\u0648\u062B\u0648\u0642\u064A\u0646 \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0628\u0639\u062F \u0627\u062C\u062A\u064A\u0627\u0632 \u0641\u062D\u0635 \u0627\u0644\u062E\u0628\u0631\u0629 \u0641\u064A \u0627\u0644\u062A\u062D\u0643\u064A\u0645 \u0648\u062A\u0642\u064A\u064A\u0645 \u0645\u0647\u0627\u0631\u0627\u062A \u0627\u0644\u0644\u0627\u0639\u0628\u064A\u0646.",
    showInList: true
  },
  {
    id: "role_champion",
    name: "Kingdom Champion",
    color: "#f59e0b",
    emoji: "\u{1F3C6}",
    order: 3,
    description: "\u0623\u0628\u0637\u0627\u0644 \u0628\u0637\u0648\u0644\u0627\u062A \u0648\u0645\u0646\u0627\u0641\u0633\u0627\u062A \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0627\u0644\u0631\u0633\u0645\u064A\u0629.",
    criteria: "\u062A\u064F\u0645\u0646\u062D \u0644\u0644\u0627\u0639\u0628\u064A\u0646 \u0627\u0644\u0641\u0627\u0626\u0632\u064A\u0646 \u0628\u0627\u0644\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0623\u0648\u0644\u0649 \u0641\u064A \u0628\u0637\u0648\u0644\u0627\u062A \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0648\u0627\u0644\u0645\u0635\u0646\u0641\u064A\u0646 \u0643\u0640 HT1.",
    showInList: true
  },
  {
    id: "role_gladiator",
    name: "Tier Fighter",
    color: "#10b981",
    emoji: "\u{1F48E}",
    order: 4,
    description: "\u0627\u0644\u0645\u0642\u0627\u062A\u0644\u0648\u0646 \u0627\u0644\u062D\u0627\u0635\u0644\u0648\u0646 \u0639\u0644\u0649 \u062A\u0642\u064A\u064A\u0645 \u0645\u0633\u062A\u0648\u0649 \u062F\u0627\u062E\u0644 \u0627\u0644\u0633\u064A\u0631\u0641\u0631.",
    criteria: "\u062A\u064F\u0645\u0646\u062D \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0642\u0627\u062A\u0644\u064A\u0646 \u0627\u0644\u0630\u064A\u0646 \u0623\u062A\u0645\u0648\u0627 \u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0623\u0648\u0644\u064A \u0623\u0648 \u0634\u0627\u0631\u0643\u0648\u0627 \u0641\u064A \u0628\u0637\u0648\u0644\u0627\u062A \u0648\u062A\u062D\u062F\u064A\u0627\u062A \u0627\u0644\u0633\u064A\u0631\u0641\u0631.",
    showInList: true
  },
  {
    id: "role_member",
    name: "Kingdom Member",
    color: "#94a3b8",
    emoji: "\u26A1",
    order: 5,
    description: "\u0623\u0639\u0636\u0627\u0621 \u0645\u062C\u062A\u0645\u0639 White Kingdom.",
    criteria: "\u0627\u0644\u0631\u0648\u0644 \u0627\u0644\u0639\u0627\u0645 \u0627\u0644\u0645\u0645\u0646\u0648\u062D \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0639\u0636\u0627\u0621 \u0641\u0648\u0631 \u0627\u0646\u0636\u0645\u0627\u0645\u0647\u0645 \u0644\u0633\u064A\u0631\u0641\u0631 \u0627\u0644\u062F\u064A\u0633\u0643\u0648\u0631\u062F \u0648\u062A\u0648\u062B\u064A\u0642 \u0639\u0636\u0648\u064A\u062A\u0647\u0645.",
    showInList: true
  }
];
var DEFAULT_SERVERS = [
  {
    id: "srv_1",
    name: "Minemen Club",
    info: "Global competitive practice network. Supported regions: EU, NA, AS. Ideal for practice duels and mechanical sparring.",
    order: 1
  },
  {
    id: "srv_2",
    name: "PvP Land",
    info: "Custom bot practice and ranked duel queues. High-tick rate testing colosseums.",
    order: 2
  },
  {
    id: "srv_3",
    name: "Hypixel",
    info: "Classic duels and tournament matches.",
    order: 3
  }
];
var DEFAULT_USERS = {
  "184719284719284719": {
    id: "user_white_knight",
    discordId: "184719284719284719",
    username: "WhiteKnight",
    globalName: "WhiteKnight",
    avatar: "/logo.png",
    discriminator: "0",
    bio: "Founder & Head Evaluator of \u{1D47E}\u{1D489}\u{1D48A}\u{1D495}\u{1D486} \u{1D472}\u{1D48A}\u{1D48F}\u{1D488}\u{1D485}\u{1D490}\u{1D48E}.",
    createdAt: "2026-01-01T00:00:00.000Z",
    lastLogin: "2026-10-27T10:00:00.000Z",
    isAdmin: true,
    assignedRoles: ["role_founder"],
    tier: "HT1",
    evaluationNotes: "\u0645\u0624\u0633\u0633 \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0648\u0645\u0642\u064A\u0645 \u0627\u0644\u0645\u0633\u062A\u0648\u064A\u0627\u062A \u0627\u0644\u0623\u0648\u0644."
  },
  "482910482910482910": {
    id: "user_vortex",
    discordId: "482910482910482910",
    username: "VortexPvP",
    globalName: "Vortex",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    bio: "Competitive duel grinder.",
    createdAt: "2026-01-15T12:00:00.000Z",
    lastLogin: "2026-10-26T18:30:00.000Z",
    isAdmin: false,
    assignedRoles: ["role_champion"],
    tier: "HT1",
    evaluationNotes: "\u0623\u062F\u0627\u0621 \u0645\u062A\u0645\u064A\u0632 \u0641\u064A \u0627\u0644\u0643\u0631\u064A\u0633\u062A\u0627\u0644 \u0648\u0627\u0644\u0640 Pot."
  },
  "819203810293819201": {
    id: "user_frostbyte",
    discordId: "819203810293819201",
    username: "FrostByte",
    globalName: "FrostByte",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    bio: "Shield & timing specialist.",
    createdAt: "2026-02-01T15:20:00.000Z",
    lastLogin: "2026-10-25T20:10:00.000Z",
    isAdmin: false,
    assignedRoles: ["role_tester"],
    tier: "LT1",
    evaluationNotes: "\u0645\u062E\u062A\u0628\u0631 \u0631\u0633\u0645\u064A \u0645\u0639\u062A\u0645\u062F \u0641\u064A \u0646\u0632\u0627\u0644\u0627\u062A \u0627\u0644\u062F\u0631\u0648\u0639."
  },
  "391029384756102938": {
    id: "user_khaos",
    discordId: "391029384756102938",
    username: "KhaosDuelist",
    globalName: "Khaos",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    bio: "Fast paced duelist.",
    createdAt: "2026-02-10T09:40:00.000Z",
    lastLogin: "2026-10-24T14:15:00.000Z",
    isAdmin: false,
    assignedRoles: ["role_gladiator"],
    tier: "HT2"
  }
};
var DEFAULT_LEADERBOARD = [
  {
    id: "lead_1",
    minecraftName: "WhiteKnightMC",
    discordId: "184719284719284719",
    discordDisplayName: "WhiteKnight",
    discordAvatar: "/logo.png",
    tierName: "HT1",
    tierRank: 10,
    createdAt: "2026-01-01T12:00:00.000Z",
    updatedAt: "2026-01-01T12:00:00.000Z"
  },
  {
    id: "lead_2",
    minecraftName: "Vortex_1v1",
    discordId: "482910482910482910",
    discordDisplayName: "Vortex",
    discordAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    tierName: "HT1",
    tierRank: 10,
    createdAt: "2026-01-18T16:30:00.000Z",
    updatedAt: "2026-01-18T16:30:00.000Z"
  },
  {
    id: "lead_3",
    minecraftName: "FrostByte_",
    discordId: "819203810293819201",
    discordDisplayName: "FrostByte",
    discordAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    tierName: "LT1",
    tierRank: 9,
    createdAt: "2026-02-05T19:00:00.000Z",
    updatedAt: "2026-02-05T19:00:00.000Z"
  },
  {
    id: "lead_4",
    minecraftName: "KhaosDuelist",
    discordId: "391029384756102938",
    discordDisplayName: "Khaos",
    discordAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    tierName: "HT2",
    tierRank: 8,
    createdAt: "2026-02-22T17:45:00.000Z",
    updatedAt: "2026-02-22T17:45:00.000Z"
  }
];
var DatabaseManager = class {
  constructor() {
    this.pool = null;
    this.isInitialized = false;
    this.data = this.loadDatabaseFromFile();
  }
  /**
   * Initializes PostgreSQL connection, auto-creates the storage table,
   * loads persistent state (if existing data is found), or migrates local JSON data on first run.
   */
  async init() {
    if (this.isInitialized) return;
    const connectionString = process.env.DATABASE_URL;
    const isProduction = process.env.NODE_ENV === "production";
    if (!connectionString) {
      console.warn("[Database] DATABASE_URL is not configured. Running with persistent local JSON storage.");
      console.warn("[Database] To enable PostgreSQL persistence on EthioDeploy or your production database, configure DATABASE_URL.");
      this.isInitialized = true;
      return;
    }
    try {
      console.log("[Database] Connecting to PostgreSQL database using DATABASE_URL...");
      const isLocalhost = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
      this.pool = new Pool({
        connectionString,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 1e4,
        max: 10
      });
      const client = await this.pool.connect();
      try {
        console.log('[Database] Connected to PostgreSQL. Initializing table "white_kingdom_storage"...');
        await client.query(`
          CREATE TABLE IF NOT EXISTS white_kingdom_storage (
            key VARCHAR(64) PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        console.log('[Database] Table "white_kingdom_storage" verified and ready in PostgreSQL.');
        const res = await client.query(
          `SELECT data FROM white_kingdom_storage WHERE key = 'white_kingdom_db' LIMIT 1;`
        );
        if (res.rows.length > 0 && res.rows[0].data) {
          console.log('[Database] Persistent record "white_kingdom_db" found in PostgreSQL. Loading state into memory...');
          this.data = this.sanitizeSchema(res.rows[0].data);
          this.saveDatabaseSync(this.data);
          console.log(`[Database] Persistent state loaded successfully from PostgreSQL (${Object.keys(this.data.users).length} profiles, ${this.data.leaderboard.length} leaderboard players).`);
        } else {
          const jsonFileExists = fs.existsSync(DB_FILE);
          if (jsonFileExists) {
            console.log("[Database] PostgreSQL storage is empty. Migrating existing local JSON data into PostgreSQL...");
          } else {
            console.log("[Database] PostgreSQL storage is empty and no local JSON exists. Initializing with default community data...");
          }
          const currentData = this.data;
          await client.query(
            `INSERT INTO white_kingdom_storage (key, data, updated_at)
             VALUES ('white_kingdom_db', $1, NOW())
             ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
            [JSON.stringify(currentData)]
          );
          console.log('[Database] Initial data written to PostgreSQL "white_kingdom_storage" successfully.');
        }
        this.isInitialized = true;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("[Database ERROR] PostgreSQL connection/initialization error:", err?.message || err);
      console.warn("[Database] Continuing with persistent local JSON file storage fallback.");
      this.pool = null;
      this.isInitialized = true;
    }
  }
  /**
   * Persists current application state to PostgreSQL and local JSON backup file.
   * Throws if PostgreSQL query fails so caller knows if database write succeeded.
   */
  async save() {
    this.saveDatabaseSync(this.data);
    if (this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO white_kingdom_storage (key, data, updated_at)
           VALUES ('white_kingdom_db', $1, NOW())
           ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
          [JSON.stringify(this.data)]
        );
      } catch (err) {
        console.error("[Database] Failed to save state to PostgreSQL:", err?.message || err);
        throw new Error(`Database persistence failure: ${err?.message || "PostgreSQL write error"}`);
      }
    }
  }
  sanitizeSchema(parsed) {
    const settings = {
      serverName: parsed?.settings?.serverName || DEFAULT_SETTINGS.serverName,
      logoUrl: parsed?.settings?.logoUrl || DEFAULT_SETTINGS.logoUrl,
      youtubeUrl: parsed?.settings?.youtubeUrl || DEFAULT_SETTINGS.youtubeUrl,
      discordInviteUrl: parsed?.settings?.discordInviteUrl || DEFAULT_SETTINGS.discordInviteUrl,
      ownerDiscordId: parsed?.settings?.ownerDiscordId || DEFAULT_SETTINGS.ownerDiscordId,
      ownerName: parsed?.settings?.ownerName || DEFAULT_SETTINGS.ownerName,
      ownerAvatar: parsed?.settings?.ownerAvatar || DEFAULT_SETTINGS.ownerAvatar,
      ownerTag: parsed?.settings?.ownerTag || DEFAULT_SETTINGS.ownerTag,
      aboutContent: parsed?.settings?.aboutContent || DEFAULT_SETTINGS.aboutContent,
      tierTestContent: parsed?.settings?.tierTestContent || DEFAULT_SETTINGS.tierTestContent,
      newsContent: parsed?.settings?.newsContent || DEFAULT_SETTINGS.newsContent,
      welcomeBadgeText: parsed?.settings?.welcomeBadgeText || DEFAULT_SETTINGS.welcomeBadgeText
    };
    const testServers = Array.isArray(parsed?.testServers) && parsed.testServers.length > 0 ? parsed.testServers : DEFAULT_SERVERS;
    let leaderboard = Array.isArray(parsed?.leaderboard) && parsed.leaderboard.length > 0 ? parsed.leaderboard : [];
    const newsArticles = Array.isArray(parsed?.newsArticles) && parsed.newsArticles.length > 0 ? parsed.newsArticles : DEFAULT_NEWS;
    const roles = Array.isArray(parsed?.roles) && parsed.roles.length > 0 ? parsed.roles : DEFAULT_ROLES;
    const tiers = Array.isArray(parsed?.tiers) && parsed.tiers.length > 0 ? parsed.tiers : WHITE_KINGDOM_TIERS;
    if (leaderboard.length === 0 && parsed?.tierTests) {
      const testRecords = Object.values(parsed.tierTests);
      const seen = /* @__PURE__ */ new Set();
      for (const test of testRecords) {
        if (!seen.has(test.discordId)) {
          seen.add(test.discordId);
          const user = parsed.users && parsed.users[test.discordId] || null;
          leaderboard.push({
            id: `lead_${test.id || Date.now()}`,
            minecraftName: test.minecraftName || `Gladiator_${test.discordId.slice(-4)}`,
            discordId: test.discordId,
            discordDisplayName: user?.username || user?.globalName || `Discord_${test.discordId.slice(-4)}`,
            discordAvatar: resolveDiscordAvatar(test.discordId, user?.avatar),
            tierName: test.tier || "HT1",
            tierRank: test.tierRank || getTierRank(test.tier || "HT1", tiers),
            createdAt: test.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: test.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      }
    }
    if (leaderboard.length === 0) {
      leaderboard = DEFAULT_LEADERBOARD;
    }
    const rawUsers = parsed?.users || DEFAULT_USERS;
    const sanitizedUsers = {};
    for (const [id, u] of Object.entries(rawUsers)) {
      sanitizedUsers[id] = {
        id: u?.id || `user_${id}`,
        discordId: u?.discordId || id,
        username: u?.username || `Player_${id.slice(-4)}`,
        globalName: u?.globalName,
        avatar: u?.avatar || resolveDiscordAvatar(id),
        discriminator: u?.discriminator || "0",
        email: u?.email,
        bio: u?.bio || "",
        createdAt: u?.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
        lastLogin: u?.lastLogin,
        isAdmin: !!u?.isAdmin,
        assignedRoles: Array.isArray(u?.assignedRoles) ? u.assignedRoles : [],
        tier: u?.tier ? String(u.tier).trim().toUpperCase() : void 0,
        evaluationNotes: u?.evaluationNotes ? String(u.evaluationNotes) : void 0,
        evaluatedAt: u?.evaluatedAt ? String(u.evaluatedAt) : void 0,
        evaluatorName: u?.evaluatorName ? String(u.evaluatorName) : void 0,
        isPreCreated: !!u?.isPreCreated
      };
    }
    return {
      users: sanitizedUsers,
      adminDiscordIds: parsed?.adminDiscordIds || ["1324725244073873539", "184719284719284719"],
      settings,
      testServers,
      leaderboard,
      newsArticles,
      roles,
      tiers
    };
  }
  loadDatabaseFromFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        return this.sanitizeSchema(parsed);
      }
    } catch (err) {
      console.error("Failed to load database file, using defaults:", err);
    }
    const initial = {
      users: DEFAULT_USERS,
      adminDiscordIds: ["1324725244073873539", "184719284719284719"],
      settings: DEFAULT_SETTINGS,
      testServers: DEFAULT_SERVERS,
      leaderboard: DEFAULT_LEADERBOARD,
      newsArticles: DEFAULT_NEWS,
      roles: DEFAULT_ROLES,
      tiers: WHITE_KINGDOM_TIERS
    };
    this.saveDatabaseSync(initial);
    return initial;
  }
  saveDatabaseSync(data) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf-8");
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error("Error writing to database backup file:", err);
    }
  }
  // --- Settings ---
  getSettings() {
    return this.data.settings;
  }
  async updateSettings(partial) {
    this.data.settings = {
      ...this.data.settings,
      ...partial
    };
    await this.save();
    return this.data.settings;
  }
  // --- Test Servers ---
  getTestServers() {
    return [...this.data.testServers].sort((a, b) => a.order - b.order);
  }
  async addTestServer(server) {
    const id = `srv_${Date.now()}`;
    const newServer = {
      ...server,
      id,
      order: server.order ?? this.data.testServers.length + 1
    };
    this.data.testServers.push(newServer);
    await this.save();
    return newServer;
  }
  async updateTestServer(id, updates) {
    const idx = this.data.testServers.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.data.testServers[idx] = {
      ...this.data.testServers[idx],
      ...updates,
      id
    };
    await this.save();
    return this.data.testServers[idx];
  }
  async deleteTestServer(id) {
    const initialLen = this.data.testServers.length;
    this.data.testServers = this.data.testServers.filter((s) => s.id !== id);
    if (this.data.testServers.length !== initialLen) {
      await this.save();
      return true;
    }
    return false;
  }
  // --- Leaderboard ---
  getLeaderboardPlayersAdmin() {
    return [...this.data.leaderboard].sort((a, b) => b.tierRank - a.tierRank);
  }
  getLeaderboardPublic() {
    return formatPublicLeaderboard(this.data.leaderboard, this.data.tiers);
  }
  // --- Tiers Management ---
  getTiers() {
    return [...this.data.tiers].sort((a, b) => b.rank - a.rank);
  }
  async addTier(tier) {
    const cleanName = tier.name.trim().toUpperCase();
    const existingIdx = this.data.tiers.findIndex((t) => t.name.toUpperCase() === cleanName);
    const calculatedRank = tier.rank !== void 0 ? tier.rank : getTierRank(cleanName, this.data.tiers);
    const newTier = {
      name: cleanName,
      color: tier.color.trim() || "#38bdf8",
      label: tier.label?.trim() || cleanName,
      rank: calculatedRank > 0 ? calculatedRank : this.data.tiers.length ? Math.min(...this.data.tiers.map((t) => t.rank)) - 1 : 1
    };
    if (existingIdx !== -1) {
      this.data.tiers[existingIdx] = newTier;
    } else {
      this.data.tiers.push(newTier);
    }
    await this.save();
    return newTier;
  }
  async updateTier(name, updates) {
    const cleanName = name.trim().toUpperCase();
    const idx = this.data.tiers.findIndex((t) => t.name.toUpperCase() === cleanName);
    if (idx === -1) return null;
    const existing = this.data.tiers[idx];
    const newName = updates.name ? updates.name.trim().toUpperCase() : existing.name;
    const newColor = updates.color ? updates.color.trim() : existing.color;
    const newLabel = updates.label !== void 0 ? updates.label.trim() : existing.label;
    const newRank = updates.rank !== void 0 ? updates.rank : existing.rank;
    this.data.tiers[idx] = {
      name: newName,
      color: newColor,
      label: newLabel,
      rank: newRank
    };
    for (const p of this.data.leaderboard) {
      if (p.tierName.toUpperCase() === cleanName) {
        if (newName !== cleanName) p.tierName = newName;
        p.tierRank = newRank;
      }
    }
    await this.save();
    return this.data.tiers[idx];
  }
  async deleteTier(name) {
    const cleanName = name.trim().toUpperCase();
    const initialLen = this.data.tiers.length;
    this.data.tiers = this.data.tiers.filter((t) => t.name.toUpperCase() !== cleanName);
    if (this.data.tiers.length !== initialLen) {
      await this.save();
      return true;
    }
    return false;
  }
  async resetTiers() {
    this.data.tiers = [...WHITE_KINGDOM_TIERS];
    await this.save();
    return this.getTiers();
  }
  async addLeaderboardPlayer(player) {
    const id = `player_${Date.now()}`;
    const user = this.data.users[player.discordId];
    const tierName = player.tierName.trim().toUpperCase() || "HT1";
    const tierRank = getTierRank(tierName, this.data.tiers);
    const resolvedAvatar = player.discordAvatar || user?.avatar || resolveDiscordAvatar(player.discordId);
    const resolvedName = player.discordDisplayName || (user?.globalName || user?.username) || `Discord_${player.discordId.slice(-4)}`;
    const resolvedUsername = player.discordUsername || user?.username || void 0;
    const newPlayer = {
      id,
      minecraftName: player.minecraftName.trim(),
      discordId: player.discordId.trim(),
      discordDisplayName: resolvedName,
      discordUsername: resolvedUsername,
      discordAvatar: resolvedAvatar,
      tierName,
      tierRank,
      gamesPlayed: Array.isArray(player.gamesPlayed) ? player.gamesPlayed : [],
      notes: (player.notes || "").trim(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.leaderboard.push(newPlayer);
    await this.save();
    return newPlayer;
  }
  async updateLeaderboardPlayer(id, updates) {
    const idx = this.data.leaderboard.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const existing = this.data.leaderboard[idx];
    const tierName = (updates.tierName || existing.tierName).trim().toUpperCase();
    const tierRank = updates.tierRank || getTierRank(tierName, this.data.tiers);
    this.data.leaderboard[idx] = {
      ...existing,
      ...updates,
      id,
      tierName,
      tierRank,
      gamesPlayed: updates.gamesPlayed !== void 0 ? updates.gamesPlayed : existing.gamesPlayed,
      notes: updates.notes !== void 0 ? updates.notes : existing.notes,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.save();
    return this.data.leaderboard[idx];
  }
  async deleteLeaderboardPlayer(id) {
    const player = this.data.leaderboard.find((p) => p.id === id);
    const initialLen = this.data.leaderboard.length;
    this.data.leaderboard = this.data.leaderboard.filter((p) => p.id !== id);
    if (player && this.data.tierTests) {
      const tests = this.data.tierTests;
      for (const [testId, t] of Object.entries(tests)) {
        if (t.discordId === player.discordId || t.minecraftName === player.minecraftName) {
          delete tests[testId];
        }
      }
    }
    if (this.data.leaderboard.length !== initialLen) {
      await this.save();
      return true;
    }
    return false;
  }
  // --- Users & Auth ---
  getUser(discordId) {
    return this.data.users[discordId];
  }
  getProfile(discordId) {
    return this.data.users[discordId];
  }
  getAllUsers() {
    return Object.values(this.data.users);
  }
  getAllProfiles() {
    return Object.values(this.data.users);
  }
  applyUpsertUser(profile) {
    const existing = this.data.users[profile.discordId];
    const isAdmin = this.isAdmin(profile.discordId);
    const updated = {
      id: existing?.id || `user_${profile.discordId}`,
      discordId: profile.discordId,
      username: profile.username || existing?.username || `Player_${profile.discordId.slice(-4)}`,
      globalName: profile.globalName ?? existing?.globalName,
      avatar: profile.avatar ?? existing?.avatar ?? resolveDiscordAvatar(profile.discordId),
      discriminator: profile.discriminator ?? existing?.discriminator ?? "0",
      email: profile.email ?? existing?.email,
      bio: profile.bio ?? existing?.bio ?? "",
      createdAt: existing?.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      lastLogin: (/* @__PURE__ */ new Date()).toISOString(),
      isAdmin,
      assignedRoles: existing?.assignedRoles || profile.assignedRoles || [],
      tier: existing?.tier || profile.tier,
      evaluationNotes: existing?.evaluationNotes || profile.evaluationNotes,
      evaluatedAt: existing?.evaluatedAt || profile.evaluatedAt,
      evaluatorName: existing?.evaluatorName || profile.evaluatorName,
      isPreCreated: false
      // User has now actively authenticated!
    };
    this.data.users[profile.discordId] = updated;
    for (const entry of this.data.leaderboard) {
      if (entry.discordId === profile.discordId) {
        if (updated.username) entry.discordDisplayName = updated.globalName || updated.username;
        if (updated.avatar) entry.discordAvatar = updated.avatar;
        if (updated.tier) {
          entry.tierName = updated.tier;
          entry.tierRank = getTierRank(updated.tier, this.data.tiers);
        }
      }
    }
    return updated;
  }
  async upsertUser(profile) {
    const updated = this.applyUpsertUser(profile);
    await this.save();
    return updated;
  }
  upsertUserSync(profile) {
    const updated = this.applyUpsertUser(profile);
    this.save().catch((err) => {
      console.error("[Database] Background save error on upsertUserSync:", err);
    });
    return updated;
  }
  /**
   * Administrator-controlled profile creation / editing using Discord user ID.
   * A player is NOT required to register or log in first.
   */
  async upsertAdminProfile(params) {
    const cleanId = params.discordId.trim();
    const existing = this.data.users[cleanId];
    const isAdmin = this.isAdmin(cleanId);
    const updated = {
      id: existing?.id || `user_${cleanId}`,
      discordId: cleanId,
      username: params.username?.trim() || existing?.username || `Player_${cleanId.slice(-4)}`,
      globalName: params.globalName?.trim() || existing?.globalName || params.username?.trim() || `Player_${cleanId.slice(-4)}`,
      avatar: params.avatar?.trim() || existing?.avatar || resolveDiscordAvatar(cleanId),
      discriminator: existing?.discriminator || "0",
      email: existing?.email,
      bio: existing?.bio || "",
      createdAt: existing?.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      lastLogin: existing?.lastLogin,
      isAdmin,
      assignedRoles: Array.isArray(params.assignedRoles) ? params.assignedRoles : existing?.assignedRoles || [],
      tier: params.tier !== void 0 ? params.tier?.trim().toUpperCase() || void 0 : existing?.tier,
      evaluationNotes: params.evaluationNotes !== void 0 ? params.evaluationNotes.trim() : existing?.evaluationNotes,
      evaluatedAt: params.evaluationNotes !== void 0 ? (/* @__PURE__ */ new Date()).toISOString() : existing?.evaluatedAt,
      evaluatorName: params.evaluatorName || existing?.evaluatorName,
      isPreCreated: existing ? existing.isPreCreated : true
    };
    this.data.users[cleanId] = updated;
    for (const entry of this.data.leaderboard) {
      if (entry.discordId === cleanId) {
        if (updated.username) entry.discordDisplayName = updated.globalName || updated.username;
        if (updated.avatar) entry.discordAvatar = updated.avatar;
        if (updated.tier) {
          entry.tierName = updated.tier;
          entry.tierRank = getTierRank(updated.tier, this.data.tiers);
        }
      }
    }
    await this.save();
    return updated;
  }
  async deleteProfile(discordId) {
    const cleanId = discordId.trim();
    if (this.data.users[cleanId]) {
      delete this.data.users[cleanId];
      await this.save();
      return true;
    }
    return false;
  }
  isAdmin(discordId) {
    if (!discordId) return false;
    const cleanId = String(discordId).trim();
    if (this.data.settings?.ownerDiscordId && this.data.settings.ownerDiscordId.trim() === cleanId) {
      return true;
    }
    const envAdmins = (process.env.ADMIN_DISCORD_IDS || "").split(/[\s,;]+/).map((id) => id.trim()).filter((id) => /^\d{17,20}$/.test(id));
    if (envAdmins.includes(cleanId)) return true;
    if (this.data.adminDiscordIds.map((id) => String(id).trim()).includes(cleanId)) return true;
    return !!this.data.users[cleanId]?.isAdmin;
  }
  async setAdminStatus(discordId, status) {
    if (status) {
      if (!this.data.adminDiscordIds.includes(discordId)) {
        this.data.adminDiscordIds.push(discordId);
      }
    } else {
      this.data.adminDiscordIds = this.data.adminDiscordIds.filter((id) => id !== discordId);
    }
    if (this.data.users[discordId]) {
      this.data.users[discordId].isAdmin = status;
    }
    await this.save();
  }
  // --- Server Roles (for Discord-like role mentions & badges) ---
  getRoles() {
    return [...this.data.roles].sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  async addRole(role) {
    const id = `role_${Date.now()}`;
    const newRole = {
      ...role,
      id,
      name: role.name.trim(),
      color: role.color?.trim() || "#38bdf8",
      emoji: role.emoji?.trim() || "\u{1F6E1}\uFE0F",
      order: role.order ?? this.data.roles.length + 1,
      description: role.description?.trim() || "",
      criteria: role.criteria?.trim() || "",
      showInList: role.showInList !== false
    };
    this.data.roles.push(newRole);
    await this.save();
    return newRole;
  }
  async updateRole(id, updates) {
    const idx = this.data.roles.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.data.roles[idx] = {
      ...this.data.roles[idx],
      ...updates,
      id
    };
    await this.save();
    return this.data.roles[idx];
  }
  async deleteRole(id) {
    const initialLen = this.data.roles.length;
    this.data.roles = this.data.roles.filter((r) => r.id !== id);
    if (this.data.roles.length !== initialLen) {
      await this.save();
      return true;
    }
    return false;
  }
  // --- News Articles ---
  getNewsArticles() {
    return [...this.data.newsArticles].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  async addNewsArticle(article) {
    const id = `news_${Date.now()}`;
    const newArticle = {
      id,
      title: article.title.trim(),
      content: article.content.trim(),
      category: article.category?.trim() || "\u0625\u0639\u0644\u0627\u0646",
      imageUrl: article.imageUrl?.trim() || void 0,
      pinned: !!article.pinned,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.newsArticles.unshift(newArticle);
    await this.save();
    return newArticle;
  }
  async updateNewsArticle(id, updates) {
    const idx = this.data.newsArticles.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.data.newsArticles[idx] = {
      ...this.data.newsArticles[idx],
      ...updates,
      id,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.save();
    return this.data.newsArticles[idx];
  }
  async deleteNewsArticle(id) {
    const initialLen = this.data.newsArticles.length;
    this.data.newsArticles = this.data.newsArticles.filter((a) => a.id !== id);
    if (this.data.newsArticles.length !== initialLen) {
      await this.save();
      return true;
    }
    return false;
  }
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
};
var db = new DatabaseManager();

// server/auth.ts
import crypto from "crypto";
var SESSION_COOKIE_NAME = "wk_session_token";
var SESSION_SECRET = process.env.SESSION_SECRET || "white_kingdom_pvp_secret_key_2026";
var activeSessions = /* @__PURE__ */ new Map();
function createSessionToken(discordId) {
  const payload = `${discordId}:${Date.now()}:${crypto.randomBytes(16).toString("hex")}`;
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  const token = Buffer.from(`${payload}:${hmac}`).toString("base64url");
  activeSessions.set(token, {
    discordId,
    createdAt: Date.now()
  });
  return token;
}
function verifySessionToken(token) {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return null;
    const [discordId, timestamp, nonce, signature] = parts;
    const payload = `${discordId}:${timestamp}:${nonce}`;
    const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return discordId;
    }
  } catch (err) {
    return null;
  }
  return null;
}
function getSessionUser(req) {
  const token = req.cookies?.[SESSION_COOKIE_NAME] || req.headers["authorization"]?.replace("Bearer ", "");
  const discordId = verifySessionToken(token);
  if (!discordId) return null;
  const user = db.getUser(discordId);
  if (!user) {
    return db.upsertUserSync({ discordId });
  }
  user.isAdmin = db.isAdmin(discordId);
  return user;
}
function requireAdmin(req, res, next) {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required. Please log in with Discord." });
    return;
  }
  const isAdmin = db.isAdmin(user.discordId);
  if (!isAdmin) {
    res.status(403).json({ error: "Access denied. Administrator privileges required." });
    return;
  }
  req.user = user;
  next();
}
var OAUTH_STATE_COOKIE_NAME = "wk_oauth_state";
function generateOAuthState(redirectUri) {
  const nonce = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  const payload = `${nonce}:${timestamp}:${redirectUri}`;
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  const signedToken = Buffer.from(`${payload}:${sig}`).toString("base64url");
  return { state: nonce, signedToken };
}
function verifyOAuthState(incomingState, signedToken) {
  if (!incomingState || !signedToken) return { valid: false };
  try {
    const decoded = Buffer.from(signedToken, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length < 4) return { valid: false };
    const nonce = parts[0];
    const timestampStr = parts[1];
    const sig = parts[parts.length - 1];
    const redirectUri = parts.slice(2, parts.length - 1).join(":");
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > 15 * 60 * 1e3) {
      return { valid: false };
    }
    const payload = `${nonce}:${timestampStr}:${redirectUri}`;
    const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return { valid: false };
    }
    if (nonce !== incomingState) {
      return { valid: false };
    }
    return { valid: true, redirectUri };
  } catch (err) {
    return { valid: false };
  }
}
function setOAuthStateCookie(res, signedToken) {
  res.cookie(OAUTH_STATE_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 15 * 60 * 1e3,
    path: "/"
  });
}
function clearOAuthStateCookie(res) {
  res.clearCookie(OAUTH_STATE_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/"
  });
}
function getRedirectUri(req) {
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    const cleanUrl = appUrl.startsWith("http") ? appUrl : `https://${appUrl}`;
    return `${cleanUrl.replace(/\/$/, "")}/auth/callback`;
  }
  const host = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
  const proto = req.get("x-forwarded-proto") || (req.secure ? "https" : "http");
  return `${proto}://${host}/auth/callback`;
}
function setSessionCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1e3,
    // 30 days
    path: "/"
  });
}
function clearSessionCookie(res) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/"
  });
}

// server/api.ts
var apiRouter = express.Router();
apiRouter.get("/config", (req, res) => {
  const isDiscordConfigured = !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);
  const redirectUri = getRedirectUri(req);
  const settings = db.getSettings();
  res.json({
    serverName: settings.serverName,
    logoUrl: settings.logoUrl,
    youtubeUrl: settings.youtubeUrl,
    isDiscordConfigured,
    discordClientId: process.env.DISCORD_CLIENT_ID ? "Configured (Active)" : null,
    redirectUri
  });
});
apiRouter.get("/public-data", (req, res) => {
  const settings = db.getSettings();
  const testServers = db.getTestServers();
  const leaderboard = db.getLeaderboardPublic();
  const newsArticles = db.getNewsArticles();
  const roles = db.getRoles();
  const tiers = db.getTiers();
  res.json({
    settings,
    testServers,
    leaderboard,
    newsArticles,
    roles,
    tiers
  });
});
apiRouter.get("/tiers", (req, res) => {
  const tiers = db.getTiers();
  res.json({ tiers });
});
apiRouter.get("/news", (req, res) => {
  const newsArticles = db.getNewsArticles();
  res.json({ news: newsArticles });
});
apiRouter.get("/roles", (req, res) => {
  const roles = db.getRoles();
  res.json({ roles });
});
apiRouter.get("/leaderboard", (req, res) => {
  const leaderboard = db.getLeaderboardPublic();
  res.json({ leaderboard });
});
apiRouter.get("/servers", (req, res) => {
  const testServers = db.getTestServers();
  res.json({ servers: testServers });
});
apiRouter.get("/auth/discord/url", (req, res) => {
  const redirectUri = getRedirectUri(req);
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.json({
      configured: false,
      message: "Discord OAuth credentials are not set in environment variables.",
      redirectUri,
      guide: {
        step1: "Go to Discord Developer Portal (https://discord.com/developers/applications)",
        step2: "Select your application -> OAuth2 -> General",
        step3: `Add this exact Redirect URI: ${redirectUri}`,
        step4: "Copy Client ID and Client Secret into your AI Studio environment variables (DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET)."
      }
    });
    return;
  }
  const { state, signedToken } = generateOAuthState(redirectUri);
  setOAuthStateCookie(res, signedToken);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify email",
    state,
    prompt: "consent"
  });
  const url = `https://discord.com/oauth2/authorize?${params.toString()}`;
  res.json({
    configured: true,
    url,
    redirectUri,
    state
  });
});
async function handleDiscordCallback(req, res) {
  const { code, state, error, error_description } = req.query;
  const redirectUri = getRedirectUri(req);
  const signedToken = req.cookies?.[OAUTH_STATE_COOKIE_NAME];
  const stateVerification = verifyOAuthState(String(state || ""), signedToken);
  clearOAuthStateCookie(res);
  if (error || !code) {
    res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Canceled</title></head>
        <body style="font-family: sans-serif; background: #070a13; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 12px; border: 1px solid #ef4444; max-width: 450px; text-align: center;">
            <h2 style="color: #ef4444;">Discord Authorization Canceled</h2>
            <p style="color: #94a3b8;">${error_description || error || "Authorization was not completed."}</p>
            <button onclick="window.close()" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">Close Window</button>
          </div>
        </body>
      </html>
    `);
    return;
  }
  if (!stateVerification.valid) {
    res.status(403).send(`
      <!DOCTYPE html>
      <html>
        <head><title>CSRF Verification Failed</title></head>
        <body style="font-family: sans-serif; background: #070a13; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 12px; border: 1px solid #ef4444; max-width: 450px; text-align: center;">
            <h2 style="color: #ef4444;">Security Verification Failed</h2>
            <p style="color: #94a3b8;">The OAuth2 state parameter was missing, invalid, or expired. Please try signing in again.</p>
            <button onclick="window.close()" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">Close Window</button>
          </div>
        </body>
      </html>
    `);
    return;
  }
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.status(500).send("Discord credentials missing on server.");
    return;
  }
  try {
    const effectiveRedirectUri = stateVerification.redirectUri || redirectUri;
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: effectiveRedirectUri
      })
    });
    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error("Discord token exchange failed:", errBody);
      throw new Error(`Failed to exchange code: ${tokenResponse.statusText}`);
    }
    const tokenData = await tokenResponse.json();
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `${tokenData.token_type} ${tokenData.access_token}`
      }
    });
    if (!userResponse.ok) {
      throw new Error("Failed to retrieve Discord user profile.");
    }
    const discordUser = await userResponse.json();
    let avatarUrl = "";
    if (discordUser.avatar) {
      const isAnimated = discordUser.avatar.startsWith("a_");
      const format = isAnimated ? "gif" : "png";
      avatarUrl = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${format}?size=256`;
    } else {
      const defaultIndex = (BigInt(discordUser.id) >> 22n) % 6n;
      avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
    }
    const user = await db.upsertUser({
      discordId: discordUser.id,
      username: discordUser.username,
      globalName: discordUser.global_name,
      avatar: avatarUrl,
      discriminator: discordUser.discriminator,
      email: discordUser.email
    });
    if (db.isAdmin(user.discordId)) {
      await db.updateSettings({
        ownerDiscordId: user.discordId,
        ownerName: user.globalName || user.username,
        ownerAvatar: user.avatar,
        ownerTag: "\u0635\u0627\u062D\u0628 \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0648\u0645\u0624\u0633\u0633 \u0627\u0644\u0645\u0648\u0642\u0639"
      });
    }
    const sessionToken = createSessionToken(user.discordId);
    setSessionCookie(res, sessionToken);
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Successful</title></head>
        <body style="font-family: sans-serif; background: #070a13; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="background: rgba(0, 229, 255, 0.05); padding: 30px; border-radius: 12px; border: 1px solid #00e5ff; max-width: 450px; text-align: center;">
            <h2 style="color: #00e5ff; margin-bottom: 8px;">White Kingdom Authentication</h2>
            <p style="color: #94a3b8; margin-bottom: 20px;">Welcome, <strong>${user.username}</strong>! Your account has been verified.</p>
            <p style="color: #64748b; font-size: 13px;">Closing authorization window...</p>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  user: ${JSON.stringify(user)},
                  token: ${JSON.stringify(sessionToken)}
                }, '*');
                setTimeout(() => window.close(), 600);
              } else {
                window.location.href = '/';
              }
            } catch(e) {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("OAuth callback processing error:", err);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; background: #070a13; color: #fff; padding: 40px; text-align: center;">
          <h2 style="color: #ef4444;">Authentication Error</h2>
          <p style="color: #94a3b8;">${err.message || "An error occurred during Discord authentication."}</p>
          <button onclick="window.close()" style="margin-top: 15px; padding: 10px 20px; background: #334155; color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button>
        </body>
      </html>
    `);
  }
}
apiRouter.post("/auth/dev-login", async (req, res) => {
  const { discordId, username, asAdmin } = req.body;
  const validation = validateDiscordId(discordId);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }
  const defaultAvatar = resolveDiscordAvatar(discordId.trim());
  const user = await db.upsertUser({
    discordId: discordId.trim(),
    username: username?.trim() || `Player_${discordId.slice(-4)}`,
    globalName: username?.trim() || `Player_${discordId.slice(-4)}`,
    avatar: defaultAvatar
  });
  if (asAdmin) {
    await db.setAdminStatus(user.discordId, true);
    user.isAdmin = true;
  }
  const token = createSessionToken(user.discordId);
  setSessionCookie(res, token);
  res.json({
    success: true,
    user,
    token
  });
});
apiRouter.post("/auth/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ success: true, message: "Logged out successfully." });
});
apiRouter.get("/auth/session", (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    res.json({ authenticated: false, user: null });
    return;
  }
  res.json({
    authenticated: true,
    user
  });
});
apiRouter.get("/user/my-profile", (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D. \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u062D\u0633\u0627\u0628 \u062F\u064A\u0633\u0643\u0648\u0631\u062F." });
    return;
  }
  const allRoles = db.getRoles();
  const allTiers = db.getTiers();
  const resolvedRoles = resolveUserRoles(user.assignedRoles, allRoles);
  const tierDef = getTierDefinition(user.tier, allTiers);
  res.json({
    profile: user,
    roles: resolvedRoles,
    tierDefinition: tierDef
  });
});
apiRouter.get("/admin/data", requireAdmin, (req, res) => {
  const settings = db.getSettings();
  const testServers = db.getTestServers();
  const leaderboard = db.getLeaderboardPlayersAdmin();
  const newsArticles = db.getNewsArticles();
  const roles = db.getRoles();
  const users = db.getAllUsers();
  const tiers = db.getTiers();
  res.json({
    settings,
    testServers,
    leaderboard,
    newsArticles,
    roles,
    users,
    tiers
  });
});
apiRouter.patch("/admin/settings", requireAdmin, async (req, res) => {
  const {
    serverName,
    logoUrl,
    youtubeUrl,
    discordInviteUrl,
    ownerDiscordId,
    ownerName,
    ownerAvatar,
    ownerTag,
    aboutContent,
    tierTestContent,
    newsContent,
    welcomeBadgeText
  } = req.body;
  const updates = {};
  if (typeof serverName === "string") updates.serverName = serverName.trim();
  if (typeof logoUrl === "string") updates.logoUrl = logoUrl.trim();
  if (typeof youtubeUrl === "string") updates.youtubeUrl = youtubeUrl.trim();
  if (typeof discordInviteUrl === "string") updates.discordInviteUrl = discordInviteUrl.trim();
  if (typeof ownerDiscordId === "string") {
    updates.ownerDiscordId = ownerDiscordId.trim();
    const matchedUser = db.getUser(ownerDiscordId.trim());
    if (matchedUser) {
      if (!ownerName) updates.ownerName = matchedUser.globalName || matchedUser.username;
      if (!ownerAvatar) updates.ownerAvatar = matchedUser.avatar;
    } else if (ownerDiscordId.trim()) {
      if (!ownerAvatar) updates.ownerAvatar = resolveDiscordAvatar(ownerDiscordId.trim());
    }
  }
  if (typeof ownerName === "string") updates.ownerName = ownerName.trim();
  if (typeof ownerAvatar === "string") updates.ownerAvatar = ownerAvatar.trim();
  if (typeof ownerTag === "string") updates.ownerTag = ownerTag.trim();
  if (typeof aboutContent === "string") updates.aboutContent = aboutContent;
  if (typeof tierTestContent === "string") updates.tierTestContent = tierTestContent;
  if (typeof newsContent === "string") updates.newsContent = newsContent;
  if (typeof welcomeBadgeText === "string") updates.welcomeBadgeText = welcomeBadgeText.trim();
  const updatedSettings = await db.updateSettings(updates);
  res.json({ success: true, settings: updatedSettings });
});
apiRouter.post("/admin/servers", requireAdmin, async (req, res) => {
  const { name, info, imageUrl, order } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "\u0627\u0633\u0645 \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0645\u0637\u0644\u0648\u0628." });
    return;
  }
  const newServer = await db.addTestServer({
    name: name.trim(),
    info: (info || "").trim(),
    imageUrl: imageUrl ? String(imageUrl).trim() : void 0,
    order: typeof order === "number" ? order : 1
  });
  res.status(201).json({ success: true, server: newServer });
});
apiRouter.put("/admin/servers/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, info, imageUrl, order } = req.body;
  const updated = await db.updateTestServer(id, {
    ...name !== void 0 ? { name: String(name).trim() } : {},
    ...info !== void 0 ? { info: String(info).trim() } : {},
    ...imageUrl !== void 0 ? { imageUrl: String(imageUrl).trim() } : {},
    ...typeof order === "number" ? { order } : {}
  });
  if (!updated) {
    res.status(404).json({ error: "\u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
    return;
  }
  res.json({ success: true, server: updated });
});
apiRouter.delete("/admin/servers/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const deleted = await db.deleteTestServer(id);
  if (!deleted) {
    res.status(404).json({ error: "\u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
    return;
  }
  res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0628\u0646\u062C\u0627\u062D." });
});
apiRouter.post("/admin/leaderboard", requireAdmin, async (req, res) => {
  const { minecraftName, discordId, discordDisplayName, discordUsername, discordAvatar, tierName, gamesPlayed, notes } = req.body;
  if (!minecraftName || typeof minecraftName !== "string" || !minecraftName.trim()) {
    res.status(400).json({ error: "\u0627\u0633\u0645 \u0627\u0644\u0644\u0627\u0639\u0628 \u0641\u064A \u0645\u0627\u064A\u0646 \u0643\u0631\u0627\u0641\u062A (Minecraft Username) \u0645\u0637\u0644\u0648\u0628." });
    return;
  }
  const validation = validateDiscordId(discordId);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }
  const cleanTier = (tierName || "HT1").trim().toUpperCase();
  const newPlayer = await db.addLeaderboardPlayer({
    minecraftName: minecraftName.trim(),
    discordId: discordId.trim(),
    discordDisplayName: discordDisplayName ? String(discordDisplayName).trim() : void 0,
    discordUsername: discordUsername ? String(discordUsername).trim() : void 0,
    discordAvatar: discordAvatar ? String(discordAvatar).trim() : void 0,
    tierName: cleanTier,
    gamesPlayed: Array.isArray(gamesPlayed) ? gamesPlayed : [],
    notes: notes ? String(notes).trim() : ""
  });
  res.status(201).json({ success: true, player: newPlayer });
});
apiRouter.put("/admin/leaderboard/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { minecraftName, discordId, discordDisplayName, discordUsername, discordAvatar, tierName, gamesPlayed, notes } = req.body;
  const updates = {};
  if (minecraftName !== void 0) {
    if (!String(minecraftName).trim()) {
      res.status(400).json({ error: "\u0627\u0633\u0645 \u0627\u0644\u0644\u0627\u0639\u0628 \u0641\u064A \u0645\u0627\u064A\u0646 \u0643\u0631\u0627\u0641\u062A \u0644\u0627 \u064A\u0645\u0643\u0646 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0641\u0627\u0631\u063A\u0627\u064B." });
      return;
    }
    updates.minecraftName = String(minecraftName).trim();
  }
  if (discordId !== void 0) {
    const validation = validateDiscordId(discordId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }
    updates.discordId = String(discordId).trim();
  }
  if (discordDisplayName !== void 0) {
    updates.discordDisplayName = String(discordDisplayName).trim();
  }
  if (discordUsername !== void 0) {
    updates.discordUsername = String(discordUsername).trim();
  }
  if (discordAvatar !== void 0) {
    updates.discordAvatar = String(discordAvatar).trim();
  }
  if (tierName !== void 0) {
    updates.tierName = String(tierName).trim().toUpperCase();
    updates.tierRank = getTierRank(updates.tierName);
  }
  if (gamesPlayed !== void 0) {
    updates.gamesPlayed = Array.isArray(gamesPlayed) ? gamesPlayed : [];
  }
  if (notes !== void 0) {
    updates.notes = String(notes).trim();
  }
  const updated = await db.updateLeaderboardPlayer(id, updates);
  if (!updated) {
    res.status(404).json({ error: "\u0627\u0644\u0644\u0627\u0639\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0644\u0648\u062D\u0629 \u0627\u0644\u0635\u062F\u0627\u0631\u0629." });
    return;
  }
  res.json({ success: true, player: updated });
});
apiRouter.delete("/admin/leaderboard/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const deleted = await db.deleteLeaderboardPlayer(id);
  if (!deleted) {
    res.status(404).json({ error: "Leaderboard entry not found." });
    return;
  }
  res.json({ success: true, message: "Player removed from leaderboard." });
});
apiRouter.get("/admin/discord-lookup/:discordId", requireAdmin, async (req, res) => {
  const { discordId } = req.params;
  const validation = validateDiscordId(discordId);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }
  const cleanId = discordId.trim();
  const existingUser = db.getUser(cleanId);
  if (existingUser && existingUser.avatar && !existingUser.avatar.includes("/embed/avatars/")) {
    res.json({
      found: true,
      source: "database_user",
      username: existingUser.username,
      displayName: existingUser.globalName || existingUser.username,
      avatar: existingUser.avatar
    });
    return;
  }
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (botToken) {
    try {
      const resp = await fetch(`https://discord.com/api/v10/users/${cleanId}`, {
        headers: { Authorization: `Bot ${botToken}` },
        signal: AbortSignal.timeout(4e3)
      });
      if (resp.ok) {
        const d = await resp.json();
        let avatarUrl = "";
        if (d.avatar) {
          const isGif = d.avatar.startsWith("a_");
          avatarUrl = `https://cdn.discordapp.com/avatars/${d.id}/${d.avatar}.${isGif ? "gif" : "png"}?size=256`;
        } else {
          avatarUrl = resolveDiscordAvatar(cleanId);
        }
        res.json({
          found: true,
          source: "discord_bot_api",
          username: d.username,
          displayName: d.global_name || d.username,
          avatar: avatarUrl
        });
        return;
      }
    } catch (err) {
      console.warn("Bot API lookup failed:", err);
    }
  }
  try {
    const japiResp = await fetch(`https://japi.rest/discord/v1/user/${cleanId}`, {
      headers: {
        "User-Agent": "WhiteKingdom-PvP/1.0",
        "Accept": "application/json"
      },
      signal: AbortSignal.timeout(5e3)
    });
    if (japiResp.ok) {
      const jdata = await japiResp.json();
      if (jdata?.data && !jdata.data.message && jdata.data.username) {
        const d = jdata.data;
        const avatarUrl = d.avatarURL || resolveDiscordAvatar(cleanId);
        res.json({
          found: true,
          source: "discord_public_api",
          username: d.username,
          displayName: d.global_name || d.username,
          avatar: avatarUrl,
          banner: d.bannerURL || null
        });
        return;
      }
    }
  } catch (err) {
    console.warn("japi lookup failed:", err);
  }
  if (existingUser) {
    res.json({
      found: true,
      source: "database_user",
      username: existingUser.username,
      displayName: existingUser.globalName || existingUser.username,
      avatar: existingUser.avatar
    });
    return;
  }
  const fallbackAvatar = resolveDiscordAvatar(cleanId);
  res.json({
    found: true,
    source: "discord_cdn",
    username: `user_${cleanId.slice(-4)}`,
    displayName: `Player ${cleanId.slice(-4)}`,
    avatar: fallbackAvatar
  });
});
apiRouter.post("/admin/roles", requireAdmin, async (req, res) => {
  const { name, color, emoji, order, description, criteria, showInList } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "\u0627\u0633\u0645 \u0627\u0644\u0631\u0648\u0644 \u0645\u0637\u0644\u0648\u0628." });
    return;
  }
  const newRole = await db.addRole({
    name: name.trim(),
    color: color ? String(color).trim() : "#00e5ff",
    emoji: emoji ? String(emoji).trim() : "\u{1F6E1}\uFE0F",
    order: typeof order === "number" ? order : 1,
    description: description ? String(description).trim() : "",
    criteria: criteria ? String(criteria).trim() : "",
    showInList: showInList !== void 0 ? !!showInList : true
  });
  res.status(201).json({ success: true, role: newRole });
});
apiRouter.put("/admin/roles/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, color, emoji, order, description, criteria, showInList } = req.body;
  const updated = await db.updateRole(id, {
    ...name !== void 0 ? { name: String(name).trim() } : {},
    ...color !== void 0 ? { color: String(color).trim() } : {},
    ...emoji !== void 0 ? { emoji: String(emoji).trim() } : {},
    ...typeof order === "number" ? { order } : {},
    ...description !== void 0 ? { description: String(description).trim() } : {},
    ...criteria !== void 0 ? { criteria: String(criteria).trim() } : {},
    ...showInList !== void 0 ? { showInList: !!showInList } : {}
  });
  if (!updated) {
    res.status(404).json({ error: "\u0627\u0644\u0631\u0648\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
    return;
  }
  res.json({ success: true, role: updated });
});
apiRouter.delete("/admin/roles/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const deleted = await db.deleteRole(id);
  if (!deleted) {
    res.status(404).json({ error: "\u0627\u0644\u0631\u0648\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
    return;
  }
  res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0631\u0648\u0644 \u0628\u0646\u062C\u0627\u062D." });
});
apiRouter.post("/admin/news", requireAdmin, async (req, res) => {
  const { title, content, category, imageUrl, pinned } = req.body;
  if (!title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062E\u0628\u0631 \u0645\u0637\u0644\u0648\u0628." });
    return;
  }
  if (!content || typeof content !== "string" || !content.trim()) {
    res.status(400).json({ error: "\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062E\u0628\u0631 \u0645\u0637\u0644\u0648\u0628." });
    return;
  }
  const newArticle = await db.addNewsArticle({
    title: title.trim(),
    content: content.trim(),
    category: category ? String(category).trim() : "\u0625\u0639\u0644\u0627\u0646",
    imageUrl: imageUrl ? String(imageUrl).trim() : void 0,
    pinned: !!pinned
  });
  res.status(201).json({ success: true, article: newArticle });
});
apiRouter.put("/admin/news/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, content, category, imageUrl, pinned } = req.body;
  const updated = await db.updateNewsArticle(id, {
    ...title !== void 0 ? { title: String(title).trim() } : {},
    ...content !== void 0 ? { content: String(content).trim() } : {},
    ...category !== void 0 ? { category: String(category).trim() } : {},
    ...imageUrl !== void 0 ? { imageUrl: String(imageUrl).trim() } : {},
    ...pinned !== void 0 ? { pinned: !!pinned } : {}
  });
  if (!updated) {
    res.status(404).json({ error: "\u0627\u0644\u062E\u0628\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
    return;
  }
  res.json({ success: true, article: updated });
});
apiRouter.delete("/admin/news/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const deleted = await db.deleteNewsArticle(id);
  if (!deleted) {
    res.status(404).json({ error: "\u0627\u0644\u062E\u0628\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
    return;
  }
  res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062E\u0628\u0631 \u0628\u0646\u062C\u0627\u062D." });
});
apiRouter.post("/admin/tiers", requireAdmin, async (req, res) => {
  const { name, color, label, rank } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "\u0627\u0633\u0645 \u0627\u0644\u062A\u0635\u0646\u064A\u0641 (Tier Name) \u0645\u0637\u0644\u0648\u0628." });
    return;
  }
  if (!color || typeof color !== "string" || !color.trim()) {
    res.status(400).json({ error: "\u0644\u0648\u0646 \u0627\u0644\u062A\u0635\u0646\u064A\u0641 (Tier Color) \u0645\u0637\u0644\u0648\u0628." });
    return;
  }
  const newTier = await db.addTier({
    name: name.trim().toUpperCase(),
    color: color.trim(),
    label: label ? String(label).trim() : void 0,
    rank: typeof rank === "number" ? rank : void 0
  });
  res.status(201).json({
    success: true,
    tier: newTier,
    tiers: db.getTiers(),
    message: `\u062A\u0645 \u0625\u0636\u0627\u0641\u0629/\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0633\u062A\u0648\u0649 ${newTier.name} \u0628\u0646\u062C\u0627\u062D.`
  });
});
apiRouter.put("/admin/tiers/:name", requireAdmin, async (req, res) => {
  const { name } = req.params;
  const { name: newName, color, label, rank } = req.body;
  const updated = await db.updateTier(name, {
    ...newName ? { name: String(newName).trim().toUpperCase() } : {},
    ...color ? { color: String(color).trim() } : {},
    ...label !== void 0 ? { label: String(label).trim() } : {},
    ...typeof rank === "number" ? { rank } : {}
  });
  if (!updated) {
    res.status(404).json({ error: "\u0627\u0644\u0645\u0633\u062A\u0648\u0649 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
    return;
  }
  res.json({
    success: true,
    tier: updated,
    tiers: db.getTiers(),
    message: `\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0633\u062A\u0648\u0649 ${updated.name} \u0628\u0646\u062C\u0627\u062D.`
  });
});
apiRouter.delete("/admin/tiers/:name", requireAdmin, async (req, res) => {
  const { name } = req.params;
  const deleted = await db.deleteTier(name);
  if (!deleted) {
    res.status(404).json({ error: "\u0627\u0644\u0645\u0633\u062A\u0648\u0649 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
    return;
  }
  res.json({
    success: true,
    tiers: db.getTiers(),
    message: `\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0633\u062A\u0648\u0649 ${name.toUpperCase()} \u0628\u0646\u062C\u0627\u062D.`
  });
});
apiRouter.post("/admin/tiers/reset", requireAdmin, async (req, res) => {
  const resetTiers = await db.resetTiers();
  res.json({
    success: true,
    tiers: resetTiers,
    message: "\u062A\u0645\u062A \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u062A\u0635\u0646\u064A\u0641\u0627\u062A \u0648\u0645\u0633\u062A\u0648\u064A\u0627\u062A \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629 \u0628\u0646\u062C\u0627\u062D."
  });
});
apiRouter.post("/admin/upload", requireAdmin, async (req, res) => {
  try {
    const { dataUrl, filename } = req.body;
    if (!dataUrl || typeof dataUrl !== "string") {
      res.status(400).json({ error: "\u0644\u0645 \u064A\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0635\u0648\u0631\u0629 (dataUrl \u0645\u0637\u0644\u0648\u0628)." });
      return;
    }
    const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) {
      res.status(400).json({ error: "\u0635\u064A\u063A\u0629 \u0645\u0644\u0641 \u0627\u0644\u0635\u0648\u0631\u0629 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629. \u064A\u0631\u062C\u0649 \u0631\u0641\u0639 \u0635\u0648\u0631\u0629 \u0628\u0635\u064A\u063A\u0629 \u0635\u0627\u0644\u062D\u0629 (PNG, JPG, WebP, GIF)." });
      return;
    }
    let ext = match[1].toLowerCase();
    if (ext === "jpeg") ext = "jpg";
    if (ext === "svg+xml") ext = "svg";
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");
    if (buffer.length > 15 * 1024 * 1024) {
      res.status(400).json({ error: "\u062D\u062C\u0645 \u0627\u0644\u0635\u0648\u0631\u0629 \u0643\u0628\u064A\u0631 \u062C\u062F\u0627\u064B. \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0647\u0648 15 \u0645\u064A\u063A\u0627\u0628\u0627\u064A\u062A." });
      return;
    }
    const uploadsDir = path2.resolve(process.cwd(), "data", "uploads");
    if (!fs2.existsSync(uploadsDir)) {
      fs2.mkdirSync(uploadsDir, { recursive: true });
    }
    const safeRand = crypto2.randomBytes(6).toString("hex");
    const savedName = `wk_${Date.now()}_${safeRand}.${ext}`;
    const filePath = path2.join(uploadsDir, savedName);
    fs2.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/${savedName}`;
    res.json({
      success: true,
      url: publicUrl,
      size: buffer.length,
      filename: savedName
    });
  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({ error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062D\u0641\u0638 \u0627\u0644\u0635\u0648\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u0633\u064A\u0631\u0641\u0631." });
  }
});
apiRouter.get("/admin/profiles", requireAdmin, (_req, res) => {
  const profiles = db.getAllProfiles();
  const roles = db.getRoles();
  const tiers = db.getTiers();
  res.json({ profiles, roles, tiers });
});
apiRouter.get("/admin/profiles/:discordId", requireAdmin, (req, res) => {
  const { discordId } = req.params;
  const profile = db.getProfile(discordId);
  if (!profile) {
    res.status(404).json({ error: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
    return;
  }
  res.json({ profile });
});
apiRouter.post("/admin/profiles", requireAdmin, async (req, res) => {
  const { discordId, username, globalName, avatar, assignedRoles, tier, evaluationNotes } = req.body;
  const validation = validateDiscordId(discordId);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }
  const cleanId = String(discordId).trim();
  const adminUser = getSessionUser(req);
  const evaluatorName = adminUser?.globalName || adminUser?.username || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629";
  const profile = await db.upsertAdminProfile({
    discordId: cleanId,
    username: username ? String(username).trim() : void 0,
    globalName: globalName ? String(globalName).trim() : void 0,
    avatar: avatar ? String(avatar).trim() : void 0,
    assignedRoles: Array.isArray(assignedRoles) ? assignedRoles.map(String) : [],
    tier: tier ? String(tier).trim().toUpperCase() : void 0,
    evaluationNotes: evaluationNotes ? String(evaluationNotes).trim() : void 0,
    evaluatorName
  });
  res.status(201).json({
    success: true,
    profile,
    message: "\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A \u0648\u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0631\u0648\u0644\u0627\u062A \u0648\u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0628\u0646\u062C\u0627\u062D."
  });
});
apiRouter.put("/admin/profiles/:discordId", requireAdmin, async (req, res) => {
  const { discordId } = req.params;
  const validation = validateDiscordId(discordId);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }
  const cleanId = String(discordId).trim();
  const { username, globalName, avatar, assignedRoles, tier, evaluationNotes } = req.body;
  const adminUser = getSessionUser(req);
  const evaluatorName = adminUser?.globalName || adminUser?.username || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629";
  const profile = await db.upsertAdminProfile({
    discordId: cleanId,
    username: username !== void 0 ? String(username).trim() : void 0,
    globalName: globalName !== void 0 ? String(globalName).trim() : void 0,
    avatar: avatar !== void 0 ? String(avatar).trim() : void 0,
    assignedRoles: Array.isArray(assignedRoles) ? assignedRoles.map(String) : void 0,
    tier: tier !== void 0 ? tier ? String(tier).trim().toUpperCase() : "" : void 0,
    evaluationNotes: evaluationNotes !== void 0 ? String(evaluationNotes).trim() : void 0,
    evaluatorName
  });
  res.json({
    success: true,
    profile,
    message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A \u0628\u0646\u062C\u0627\u062D."
  });
});
apiRouter.delete("/admin/profiles/:discordId", requireAdmin, async (req, res) => {
  const { discordId } = req.params;
  const deleted = await db.deleteProfile(discordId);
  if (!deleted) {
    res.status(404).json({ error: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
    return;
  }
  res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A \u0628\u0646\u062C\u0627\u062D." });
});

// server/serverApp.ts
async function startServer() {
  await db.init();
  const app = express2();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  app.use(express2.json({ limit: "25mb" }));
  app.use(express2.urlencoded({ extended: true, limit: "25mb" }));
  app.use(cookieParser());
  const uploadsDir = path3.resolve(process.cwd(), "data", "uploads");
  if (!fs3.existsSync(uploadsDir)) {
    fs3.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express2.static(uploadsDir));
  app.get(["/auth/callback", "/auth/callback/"], handleDiscordCallback);
  app.use("/api", apiRouter);
  const distPath = path3.resolve(process.cwd(), "dist");
  const hasDist = fs3.existsSync(distPath);
  if (process.env.NODE_ENV === "production" || hasDist) {
    app.use(express2.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path3.resolve(distPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`White Kingdom PvP Server running on http://0.0.0.0:${PORT}`);
  });
}
var isDirectEntry = process.argv[1] && (process.argv[1].endsWith("serverApp.js") || process.argv[1].endsWith("server.js"));
if (isDirectEntry) {
  startServer().catch((err) => {
    console.error("Fatal server startup error:", err);
    process.exit(1);
  });
}
export {
  startServer
};
