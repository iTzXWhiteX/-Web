import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateDiscordId,
  resolveDiscordAvatar,
  getTierRank,
  getTierDefinition,
  resolveUserRoles,
} from './pvpLogic.ts';
import { ServerRole } from '../types/pvp.ts';

test('validateDiscordId accepts valid snowflake IDs (17-20 digits)', () => {
  assert.equal(validateDiscordId('184719284719284719').valid, true);
  assert.equal(validateDiscordId('1324725244073873539').valid, true);
});

test('validateDiscordId rejects invalid IDs', () => {
  assert.equal(validateDiscordId('').valid, false);
  assert.equal(validateDiscordId('abc').valid, false);
  assert.equal(validateDiscordId('12345').valid, false);
  assert.equal(validateDiscordId('1234567890123456789012345').valid, false);
});

test('resolveDiscordAvatar handles custom avatar and CDN fallback', () => {
  const custom = 'https://example.com/avatar.png';
  assert.equal(resolveDiscordAvatar('184719284719284719', custom), custom);
  const cdn = resolveDiscordAvatar('184719284719284719');
  assert.match(cdn, /^https:\/\/cdn\.discordapp\.com\/embed\/avatars\/\d+\.png$/);
});

test('getTierRank computes ranks properly', () => {
  assert.equal(getTierRank('HT1'), 10);
  assert.equal(getTierRank('LT1'), 9);
  assert.equal(getTierRank('HT2'), 8);
  assert.equal(getTierRank('lt5'), 1);
  assert.equal(getTierRank('unknown'), 0);
});

test('resolveUserRoles resolves role IDs in order', () => {
  const sampleRoles: ServerRole[] = [
    { id: 'role_tester', name: 'Official Tester', color: '#38bdf8', order: 2 },
    { id: 'role_founder', name: 'Founder', color: '#00e5ff', order: 1 },
    { id: 'role_member', name: 'Member', color: '#94a3b8', order: 5 },
  ];

  const resolved = resolveUserRoles(['role_tester', 'role_founder'], sampleRoles);
  assert.equal(resolved.length, 2);
  assert.equal(resolved[0].id, 'role_founder'); // order: 1
  assert.equal(resolved[1].id, 'role_tester');  // order: 2
});
