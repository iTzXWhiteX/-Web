import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDiscordDefaultAvatar,
  resolveAvatarUrl,
  handleAvatarImgError,
  FALLBACK_AVATAR_DATA_URI,
} from './discordAvatar.js';

test('getDiscordDefaultAvatar computes valid embed CDN avatar index for any Discord ID', () => {
  const id1 = '1324725244073873539';
  const url1 = getDiscordDefaultAvatar(id1);
  assert.match(url1, /^https:\/\/cdn\.discordapp\.com\/embed\/avatars\/[0-5]\.png$/);

  const fallback = getDiscordDefaultAvatar(null);
  assert.equal(fallback, 'https://cdn.discordapp.com/embed/avatars/0.png');

  const invalid = getDiscordDefaultAvatar('not_numeric');
  assert.equal(invalid, 'https://cdn.discordapp.com/embed/avatars/0.png');
});

test('resolveAvatarUrl returns custom avatar if present, else fallback', () => {
  const custom = 'https://cdn.discordapp.com/avatars/123/abc.png';
  assert.equal(resolveAvatarUrl(custom, '123'), custom);

  const empty = resolveAvatarUrl('', '1324725244073873539');
  assert.match(empty, /^https:\/\/cdn\.discordapp\.com\/embed\/avatars\/[0-5]\.png$/);
});

test('handleAvatarImgError cycles from custom -> embed -> SVG data URI without infinite loops', () => {
  const fakeImg: any = {
    dataset: {},
    src: 'https://cdn.discordapp.com/avatars/123/bad.png',
    onerror: () => {},
  };
  const event: any = { currentTarget: fakeImg };

  // First error: stages to stage 1 (embed avatar)
  handleAvatarImgError(event, '1324725244073873539');
  assert.equal(fakeImg.dataset.errorStage, '1');
  assert.match(fakeImg.src, /^https:\/\/cdn\.discordapp\.com\/embed\/avatars\/[0-5]\.png$/);

  // Second error: stages to stage 2 (self-contained SVG data URI)
  handleAvatarImgError(event, '1324725244073873539');
  assert.equal(fakeImg.dataset.errorStage, '2');
  assert.equal(fakeImg.src, FALLBACK_AVATAR_DATA_URI);

  // Third error: stops and clears onerror
  handleAvatarImgError(event, '1324725244073873539');
  assert.equal(fakeImg.onerror, null);
});
