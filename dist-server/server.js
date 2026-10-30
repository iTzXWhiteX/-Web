// server/serverApp.ts
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
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
  const match = tierDefinitions.find((t) => t.name.toLowerCase() === tierName.trim().toLowerCase());
  return match ? match.rank : 0;
}
function formatPublicLeaderboard(players) {
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
    discordAvatar: resolveDiscordAvatar(p.discordId, p.discordAvatar),
    tierName: p.tierName || "HT1",
    tierRank: p.tierRank || getTierRank(p.tierName || "HT1"),
    gamesPlayed: Array.isArray(p.gamesPlayed) ? p.gamesPlayed : [],
    notes: p.notes || ""
  }));
}

// server/db.ts
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
    id: "role_ht1",
    name: "Tier 1 Apex",
    color: "#f59e0b",
    emoji: "\u{1F3C6}",
    order: 3,
    description: "\u062D\u0645\u0644\u0629 \u062A\u0635\u0646\u064A\u0641 HT1 \u0627\u0644\u0646\u062E\u0628\u0648\u064A \u0648\u0623\u0639\u0644\u0649 \u0631\u062A\u0628\u0629 \u062A\u0646\u0627\u0641\u0633\u064A\u0629.",
    criteria: "\u062A\u064F\u0645\u0646\u062D \u0644\u0644\u0645\u0642\u0627\u062A\u0644\u064A\u0646 \u0627\u0644\u0630\u064A\u0646 \u064A\u062C\u062A\u0627\u0632\u0648\u0646 \u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u0645\u0633\u062A\u0648\u064A\u0627\u062A \u0628\u0645\u0633\u062A\u0648\u0649 \u0627\u0633\u062A\u062B\u0646\u0627\u0626\u064A (High Tier 1) \u0648\u064A\u062B\u0628\u062A\u0648\u0646 \u062C\u062F\u0627\u0631\u062A\u0647\u0645 \u0641\u064A \u0627\u0644\u0645\u0628\u0627\u0631\u0632\u0627\u062A \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629.",
    showInList: true
  },
  {
    id: "role_gladiator",
    name: "Gladiator",
    color: "#a855f7",
    emoji: "\u{1F6E1}\uFE0F",
    order: 4,
    description: "\u0645\u0642\u0627\u062A\u0644\u0648 \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u064A\u0646 \u0648\u0627\u0644\u0645\u0634\u0627\u0631\u0643\u064A\u0646 \u0628\u0627\u0644\u0628\u0637\u0648\u0644\u0627\u062A.",
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
    isAdmin: true
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
    isAdmin: false
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
    isAdmin: false
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
    isAdmin: false
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
    this.data = this.loadDatabase();
  }
  loadDatabase() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        const settings = {
          serverName: parsed.settings?.serverName || DEFAULT_SETTINGS.serverName,
          logoUrl: parsed.settings?.logoUrl || DEFAULT_SETTINGS.logoUrl,
          youtubeUrl: parsed.settings?.youtubeUrl || DEFAULT_SETTINGS.youtubeUrl,
          discordInviteUrl: parsed.settings?.discordInviteUrl || DEFAULT_SETTINGS.discordInviteUrl,
          ownerDiscordId: parsed.settings?.ownerDiscordId || DEFAULT_SETTINGS.ownerDiscordId,
          ownerName: parsed.settings?.ownerName || DEFAULT_SETTINGS.ownerName,
          ownerAvatar: parsed.settings?.ownerAvatar || DEFAULT_SETTINGS.ownerAvatar,
          ownerTag: parsed.settings?.ownerTag || DEFAULT_SETTINGS.ownerTag,
          aboutContent: parsed.settings?.aboutContent || DEFAULT_SETTINGS.aboutContent,
          tierTestContent: parsed.settings?.tierTestContent || DEFAULT_SETTINGS.tierTestContent,
          newsContent: parsed.settings?.newsContent || DEFAULT_SETTINGS.newsContent,
          welcomeBadgeText: parsed.settings?.welcomeBadgeText || DEFAULT_SETTINGS.welcomeBadgeText
        };
        const testServers = Array.isArray(parsed.testServers) && parsed.testServers.length > 0 ? parsed.testServers : DEFAULT_SERVERS;
        let leaderboard = Array.isArray(parsed.leaderboard) && parsed.leaderboard.length > 0 ? parsed.leaderboard : [];
        const newsArticles = Array.isArray(parsed.newsArticles) && parsed.newsArticles.length > 0 ? parsed.newsArticles : DEFAULT_NEWS;
        const roles = Array.isArray(parsed.roles) && parsed.roles.length > 0 ? parsed.roles : DEFAULT_ROLES;
        if (leaderboard.length === 0 && parsed.tierTests) {
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
                tierRank: test.tierRank || getTierRank(test.tier || "HT1"),
                createdAt: test.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
                updatedAt: test.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
              });
            }
          }
        }
        if (leaderboard.length === 0) {
          leaderboard = DEFAULT_LEADERBOARD;
        }
        return {
          users: parsed.users || DEFAULT_USERS,
          adminDiscordIds: parsed.adminDiscordIds || ["184719284719284719"],
          settings,
          testServers,
          leaderboard,
          newsArticles,
          roles
        };
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
      roles: DEFAULT_ROLES
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
      console.error("Error writing to database:", err);
    }
  }
  save() {
    this.saveDatabaseSync(this.data);
  }
  // --- Settings ---
  getSettings() {
    return this.data.settings;
  }
  updateSettings(partial) {
    this.data.settings = {
      ...this.data.settings,
      ...partial
    };
    this.save();
    return this.data.settings;
  }
  // --- Test Servers ---
  getTestServers() {
    return [...this.data.testServers].sort((a, b) => a.order - b.order);
  }
  addTestServer(server) {
    const id = `srv_${Date.now()}`;
    const newServer = {
      ...server,
      id,
      order: server.order ?? this.data.testServers.length + 1
    };
    this.data.testServers.push(newServer);
    this.save();
    return newServer;
  }
  updateTestServer(id, updates) {
    const idx = this.data.testServers.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.data.testServers[idx] = {
      ...this.data.testServers[idx],
      ...updates,
      id
    };
    this.save();
    return this.data.testServers[idx];
  }
  deleteTestServer(id) {
    const initialLen = this.data.testServers.length;
    this.data.testServers = this.data.testServers.filter((s) => s.id !== id);
    if (this.data.testServers.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
  // --- Leaderboard ---
  getLeaderboardPlayersAdmin() {
    return [...this.data.leaderboard].sort((a, b) => b.tierRank - a.tierRank);
  }
  getLeaderboardPublic() {
    return formatPublicLeaderboard(this.data.leaderboard);
  }
  addLeaderboardPlayer(player) {
    const id = `player_${Date.now()}`;
    const user = this.data.users[player.discordId];
    const tierName = player.tierName.trim().toUpperCase() || "HT1";
    const tierRank = getTierRank(tierName);
    const resolvedAvatar = player.discordAvatar || user?.avatar || resolveDiscordAvatar(player.discordId);
    const resolvedName = player.discordDisplayName || (user?.globalName || user?.username) || `Discord_${player.discordId.slice(-4)}`;
    const newPlayer = {
      id,
      minecraftName: player.minecraftName.trim(),
      discordId: player.discordId.trim(),
      discordDisplayName: resolvedName,
      discordAvatar: resolvedAvatar,
      tierName,
      tierRank,
      gamesPlayed: Array.isArray(player.gamesPlayed) ? player.gamesPlayed : [],
      notes: (player.notes || "").trim(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.leaderboard.push(newPlayer);
    this.save();
    return newPlayer;
  }
  updateLeaderboardPlayer(id, updates) {
    const idx = this.data.leaderboard.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const existing = this.data.leaderboard[idx];
    const tierName = (updates.tierName || existing.tierName).trim().toUpperCase();
    const tierRank = updates.tierRank || getTierRank(tierName);
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
    this.save();
    return this.data.leaderboard[idx];
  }
  deleteLeaderboardPlayer(id) {
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
      this.save();
      return true;
    }
    return false;
  }
  // --- Users & Auth ---
  getUser(discordId) {
    return this.data.users[discordId];
  }
  getAllUsers() {
    return Object.values(this.data.users);
  }
  upsertUser(profile) {
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
      isAdmin
    };
    this.data.users[profile.discordId] = updated;
    for (const entry of this.data.leaderboard) {
      if (entry.discordId === profile.discordId) {
        if (updated.username) entry.discordDisplayName = updated.globalName || updated.username;
        if (updated.avatar) entry.discordAvatar = updated.avatar;
      }
    }
    this.save();
    return updated;
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
  setAdminStatus(discordId, status) {
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
    this.save();
  }
  // --- Server Roles (for Discord-like role mentions & badges) ---
  getRoles() {
    return [...this.data.roles].sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  addRole(role) {
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
    this.save();
    return newRole;
  }
  updateRole(id, updates) {
    const idx = this.data.roles.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.data.roles[idx] = {
      ...this.data.roles[idx],
      ...updates,
      id
    };
    this.save();
    return this.data.roles[idx];
  }
  deleteRole(id) {
    const initialLen = this.data.roles.length;
    this.data.roles = this.data.roles.filter((r) => r.id !== id);
    if (this.data.roles.length !== initialLen) {
      this.save();
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
  addNewsArticle(article) {
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
    this.save();
    return newArticle;
  }
  updateNewsArticle(id, updates) {
    const idx = this.data.newsArticles.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.data.newsArticles[idx] = {
      ...this.data.newsArticles[idx],
      ...updates,
      id,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.save();
    return this.data.newsArticles[idx];
  }
  deleteNewsArticle(id) {
    const initialLen = this.data.newsArticles.length;
    this.data.newsArticles = this.data.newsArticles.filter((a) => a.id !== id);
    if (this.data.newsArticles.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
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
    return db.upsertUser({ discordId });
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
  res.json({
    settings,
    testServers,
    leaderboard,
    newsArticles,
    roles
  });
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
    const user = db.upsertUser({
      discordId: discordUser.id,
      username: discordUser.username,
      globalName: discordUser.global_name,
      avatar: avatarUrl,
      discriminator: discordUser.discriminator,
      email: discordUser.email
    });
    if (db.isAdmin(user.discordId)) {
      db.updateSettings({
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
apiRouter.post("/auth/dev-login", (req, res) => {
  const { discordId, username, asAdmin } = req.body;
  const validation = validateDiscordId(discordId);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }
  const defaultAvatar = resolveDiscordAvatar(discordId.trim());
  const user = db.upsertUser({
    discordId: discordId.trim(),
    username: username?.trim() || `Player_${discordId.slice(-4)}`,
    globalName: username?.trim() || `Player_${discordId.slice(-4)}`,
    avatar: defaultAvatar
  });
  if (asAdmin) {
    db.setAdminStatus(user.discordId, true);
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
apiRouter.get("/admin/data", requireAdmin, (req, res) => {
  const settings = db.getSettings();
  const testServers = db.getTestServers();
  const leaderboard = db.getLeaderboardPlayersAdmin();
  const newsArticles = db.getNewsArticles();
  const roles = db.getRoles();
  const users = db.getAllUsers();
  res.json({
    settings,
    testServers,
    leaderboard,
    newsArticles,
    roles,
    users
  });
});
apiRouter.patch("/admin/settings", requireAdmin, (req, res) => {
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
  const updatedSettings = db.updateSettings(updates);
  res.json({ success: true, settings: updatedSettings });
});
apiRouter.post("/admin/servers", requireAdmin, (req, res) => {
  const { name, info, imageUrl, order } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "\u0627\u0633\u0645 \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0645\u0637\u0644\u0648\u0628." });
    return;
  }
  const newServer = db.addTestServer({
    name: name.trim(),
    info: (info || "").trim(),
    imageUrl: imageUrl ? String(imageUrl).trim() : void 0,
    order: typeof order === "number" ? order : 1
  });
  res.status(201).json({ success: true, server: newServer });
});
apiRouter.put("/admin/servers/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, info, imageUrl, order } = req.body;
  const updated = db.updateTestServer(id, {
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
apiRouter.delete("/admin/servers/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = db.deleteTestServer(id);
  if (!deleted) {
    res.status(404).json({ error: "\u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
    return;
  }
  res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0628\u0646\u062C\u0627\u062D." });
});
apiRouter.post("/admin/leaderboard", requireAdmin, (req, res) => {
  const { minecraftName, discordId, discordDisplayName, discordAvatar, tierName, gamesPlayed, notes } = req.body;
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
  const newPlayer = db.addLeaderboardPlayer({
    minecraftName: minecraftName.trim(),
    discordId: discordId.trim(),
    discordDisplayName: discordDisplayName ? String(discordDisplayName).trim() : void 0,
    discordAvatar: discordAvatar ? String(discordAvatar).trim() : void 0,
    tierName: cleanTier,
    gamesPlayed: Array.isArray(gamesPlayed) ? gamesPlayed : [],
    notes: notes ? String(notes).trim() : ""
  });
  res.status(201).json({ success: true, player: newPlayer });
});
apiRouter.put("/admin/leaderboard/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { minecraftName, discordId, discordDisplayName, discordAvatar, tierName, gamesPlayed, notes } = req.body;
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
  const updated = db.updateLeaderboardPlayer(id, updates);
  if (!updated) {
    res.status(404).json({ error: "\u0627\u0644\u0644\u0627\u0639\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0644\u0648\u062D\u0629 \u0627\u0644\u0635\u062F\u0627\u0631\u0629." });
    return;
  }
  res.json({ success: true, player: updated });
});
apiRouter.delete("/admin/leaderboard/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = db.deleteLeaderboardPlayer(id);
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
apiRouter.post("/admin/roles", requireAdmin, (req, res) => {
  const { name, color, emoji, order, description, criteria, showInList } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "\u0627\u0633\u0645 \u0627\u0644\u0631\u0648\u0644 \u0645\u0637\u0644\u0648\u0628." });
    return;
  }
  const newRole = db.addRole({
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
apiRouter.put("/admin/roles/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, color, emoji, order, description, criteria, showInList } = req.body;
  const updated = db.updateRole(id, {
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
apiRouter.delete("/admin/roles/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = db.deleteRole(id);
  if (!deleted) {
    res.status(404).json({ error: "\u0627\u0644\u0631\u0648\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
    return;
  }
  res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0631\u0648\u0644 \u0628\u0646\u062C\u0627\u062D." });
});
apiRouter.post("/admin/news", requireAdmin, (req, res) => {
  const { title, content, category, imageUrl, pinned } = req.body;
  if (!title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062E\u0628\u0631 \u0645\u0637\u0644\u0648\u0628." });
    return;
  }
  if (!content || typeof content !== "string" || !content.trim()) {
    res.status(400).json({ error: "\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062E\u0628\u0631 \u0645\u0637\u0644\u0648\u0628." });
    return;
  }
  const newArticle = db.addNewsArticle({
    title: title.trim(),
    content: content.trim(),
    category: category ? String(category).trim() : "\u0625\u0639\u0644\u0627\u0646",
    imageUrl: imageUrl ? String(imageUrl).trim() : void 0,
    pinned: !!pinned
  });
  res.status(201).json({ success: true, article: newArticle });
});
apiRouter.put("/admin/news/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { title, content, category, imageUrl, pinned } = req.body;
  const updated = db.updateNewsArticle(id, {
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
apiRouter.delete("/admin/news/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = db.deleteNewsArticle(id);
  if (!deleted) {
    res.status(404).json({ error: "\u0627\u0644\u062E\u0628\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
    return;
  }
  res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062E\u0628\u0631 \u0628\u0646\u062C\u0627\u062D." });
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

// server/serverApp.ts
async function startServer() {
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
  if (process.env.NODE_ENV === "production") {
    const distPath = path3.resolve(process.cwd(), "dist");
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
