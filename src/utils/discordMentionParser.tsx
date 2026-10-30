import React from 'react';
import { ServerRole } from '../types/pvp.js';
import { Hash } from 'lucide-react';

interface DiscordFormattedTextProps {
  text: string;
  roles?: ServerRole[];
  className?: string;
  onRoleClick?: (role: ServerRole) => void;
}

export const DiscordFormattedText: React.FC<DiscordFormattedTextProps> = ({
  text,
  roles = [],
  className = '',
  onRoleClick,
}) => {
  if (!text) return null;

  // Build role lookup map (by name lowercase and by id)
  const roleMapByName = new Map<string, ServerRole>();
  const roleMapById = new Map<string, ServerRole>();
  for (const r of roles) {
    roleMapByName.set(r.name.toLowerCase().trim(), r);
    roleMapById.set(r.id.toLowerCase().trim(), r);
  }

  // Dynamically match known multi-word role names, quoted/bracketed roles, channels, and single-word mentions
  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const knownRolePatterns = roles
    .map(r => escapeRegExp(r.name))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length); // longest first

  const roleNamesGroup = knownRolePatterns.length > 0 ? `|@(?:${knownRolePatterns.join('|')})` : '';

  const tokenRegex = new RegExp(
    `(@\\[[^\\]]+\\]|@"[^"]+"${roleNamesGroup}|@[a-zA-Z0-9_\\u0600-\\u06FF\\u0750-\\u077F\\-]+|#[a-zA-Z0-9_\\u0600-\\u06FF\\u0750-\\u077F\\-]+)`,
    'gi'
  );

  const paragraphs = text.split('\n');

  return (
    <div className={`space-y-2 leading-relaxed ${className}`}>
      {paragraphs.map((para, pIdx) => {
        if (!para.trim()) {
          return <div key={pIdx} className="h-2" />;
        }

        const parts = para.split(tokenRegex);

        return (
          <p key={pIdx} className="font-sans">
            {parts.map((part, idx) => {
              // Role mention check
              if (part.startsWith('@')) {
                // Strip wrapper brackets/quotes if any
                let roleQuery = part.slice(1);
                if (roleQuery.startsWith('[') && roleQuery.endsWith(']')) {
                  roleQuery = roleQuery.slice(1, -1);
                } else if (roleQuery.startsWith('"') && roleQuery.endsWith('"')) {
                  roleQuery = roleQuery.slice(1, -1);
                }

                const cleanQuery = roleQuery.trim().toLowerCase();
                const matchedRole = roleMapByName.get(cleanQuery) || roleMapById.get(cleanQuery);

                if (matchedRole) {
                  return (
                    <span
                      key={idx}
                      onClick={() => onRoleClick && onRoleClick(matchedRole)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded-md text-xs font-semibold select-all transition-all hover:brightness-125 shadow-sm align-middle ${
                        onRoleClick ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
                      }`}
                      style={{
                        backgroundColor: `${matchedRole.color}22`,
                        borderColor: `${matchedRole.color}55`,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        color: matchedRole.color,
                        boxShadow: `0 0 10px ${matchedRole.color}20`,
                      }}
                      title={`اضغط لمعرفة تفاصيل رول ديسكورد: ${matchedRole.name}`}
                    >
                      {matchedRole.emoji && <span className="text-sm leading-none">{matchedRole.emoji}</span>}
                      <span>@{matchedRole.name}</span>
                    </span>
                  );
                }

                // Default mention pill if role isn't specifically in map
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 mx-1 rounded-md text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 select-all hover:bg-indigo-500/30 transition-all align-middle"
                  >
                    <span>@{roleQuery}</span>
                  </span>
                );
              }

              // Channel mention check
              if (part.startsWith('#')) {
                const channelName = part.slice(1);
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-1 rounded-md text-xs font-mono font-medium bg-[#2b2d31]/90 hover:bg-[#35373c] text-[#949ba4] hover:text-[#dbdee1] border border-slate-700/60 select-all transition-all cursor-default align-middle"
                  >
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    <span>{channelName}</span>
                  </span>
                );
              }

              return <React.Fragment key={idx}>{part}</React.Fragment>;
            })}
          </p>
        );
      })}
    </div>
  );
};
