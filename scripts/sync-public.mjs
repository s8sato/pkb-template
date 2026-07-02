#!/usr/bin/env node
// @ts-check
/**
 * sync-public.mjs
 *
 * `pkb`（private vault）から公開対象だけを抽出して staging ディレクトリへ書き出す。
 * CI はこの staging を `pkb-site` の `content/` へ同期する（方式B）。
 *
 * 公開対象:
 *   - ideas/ reading/ 配下で frontmatter に `publish: true` を持つ Markdown
 *   - assets/public/ 配下の asset（ただし `*.excalidraw.md` は除外）
 * 除外:
 *   - publish 指定のない Markdown
 *   - assets/private/ 配下すべて
 *   - すべての `*.excalidraw.md`
 *   - reading/ ノート内の `## Kindle Highlights` セクション（Kindle ハイライト著作権保護）
 *     ※ ノート自体は公開できるが、当該セクションは公開コピーから機械的に除去する。
 *
 * 未公開ノートへのリンク変換（公開コピーに対して）:
 *   - `[[private-note]]` → 除去
 *   - `[[private-note|表示名]]` → 除去
 *   - `![[private-note]]` embed → 除去
 *   ※ 画像・アセット拡張子（png/jpg/svg/gif/webp/pdf）は変換しない。
 *   ※ 変換が発生した場合は警告を出力するが、CI は失敗させない。
 *
 * 公開前チェック（除去後の公開コピーに対して）:
 *   - assets/private への参照禁止
 *   - `*.excalidraw.md` の直接参照禁止
 * 違反があれば何も書き出さず exit 1。
 *
 * 使い方: node scripts/sync-public.mjs [--out <dir>]
 *   --out  staging 出力先（既定: .sync-staging）
 */

import {
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  rmSync,
  existsSync,
} from 'node:fs';
import { join, dirname, relative, basename, extname } from 'node:path';

const ROOT = process.cwd();
const NOTE_DIRS = ['ideas', 'reading'];
const PUBLIC_ASSETS_DIR = join('assets', 'public');

function parseArgs(argv) {
  let out = '.sync-staging';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') out = argv[++i];
  }
  return { out };
}

/** ディレクトリを再帰的に走査して全ファイルの相対パスを返す。 */
function walk(dir) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  const out = [];
  for (const entry of readdirSync(abs)) {
    const rel = join(dir, entry);
    const st = statSync(join(ROOT, rel));
    if (st.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

/** frontmatter に `publish: true` があるか。 */
function hasPublishTrue(content) {
  if (!content.startsWith('---')) return false;
  const end = content.indexOf('\n---', 3);
  if (end === -1) return false;
  const fm = content.slice(3, end);
  return /^\s*publish:\s*true\s*$/m.test(fm);
}

/**
 * reading/ ノートから `## Kindle Highlights` セクションを除去する。
 * 見出し行から、次の同位/上位見出し（level <= 2: `# ` または `## `）または
 * 文末までを削除する。`### ` 以下のより深い見出しは当該セクションの一部として除去する。
 */
function stripKindleHighlights(content) {
  const lines = content.split('\n');
  const start = lines.findIndex((l) => /^##\s+Kindle Highlights\s*$/.test(l));
  if (start === -1) return content;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{1,2}\s/.test(lines[i])) {
      end = i;
      break;
    }
  }
  // セクション直前の空行も巻き込んで削除し、余分な空行を残さない。
  let from = start;
  while (from > 0 && lines[from - 1].trim() === '') from--;
  lines.splice(from, end - from);
  let out = lines.join('\n');
  if (!out.endsWith('\n')) out += '\n';
  return out;
}

/** アセット拡張子（wikilink 変換の対象外）。 */
const ASSET_EXTS = new Set(['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp', '.pdf']);

/**
 * 公開コピーに含まれる wikilink のうち、未公開ノートを指すものを除去する。
 * - `[[private-note]]` → 除去（空文字）
 * - `[[private-note|表示名]]` → 除去（空文字）
 * - `![[private-note]]` embed → 除去（空文字）
 * - 画像・アセット拡張子は変換しない。
 * @param {string} content
 * @param {Set<string>} publishedStems
 * @returns {{ content: string, warnings: string[] }}
 */
function stripPrivateWikilinks(content, publishedStems) {
  const warnings = [];
  const result = content.replace(
    /(!?)\[\[([^\]\|#]+)(?:#[^\]\|]*)?((?:\|[^\]]*)?)\]\]/g,
    (match, embed, target, displayPart) => {
      const ext = extname(target.trim());
      if (ASSET_EXTS.has(ext.toLowerCase())) return match;
      const stem = basename(target.trim(), '.md');
      if (publishedStems.has(stem)) return match;
      warnings.push(`除去: ${match}`);
      return '';
    },
  );
  // リンク除去後に空になったリスト行（`- ` や `* ` のみ残る等）を削除し、
  // 連続する空行を最大 1 行に縮める。
  const cleaned = result
    .split('\n')
    .filter((line) => !/^\s*[-*+]\s*$/.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
  return { content: cleaned.endsWith('\n') ? cleaned : cleaned + '\n', warnings };
}

function copyInto(out, rel) {
  const dest = join(out, rel);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(join(ROOT, rel), dest);
}

/** 変換後のノート本文を staging へ書き出す。 */
function writeNote(out, rel, content) {
  const dest = join(out, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, content, 'utf8');
}

function main() {
  const { out } = parseArgs(process.argv.slice(2));
  const errors = [];
  /** @type {{ rel: string, content: string }[]} */
  const publishedNotes = [];

  for (const dir of NOTE_DIRS) {
    for (const rel of walk(dir)) {
      if (!rel.endsWith('.md')) continue;
      const raw = readFileSync(join(ROOT, rel), 'utf8');
      if (!hasPublishTrue(raw)) continue;
      // reading/ ノートは Kindle ハイライト著作権保護のため
      // `## Kindle Highlights` セクションを公開コピーから除去する。
      const content = /^reading[\/]/.test(rel) ? stripKindleHighlights(raw) : raw;
      // 参照チェックは除去後の公開コピーに対して行う。
      if (/assets[\/]+private/.test(content)) {
        errors.push(`${rel}: 公開ノートが assets/private を参照している`);
      }
      if (/\.excalidraw\.md/.test(content)) {
        errors.push(`${rel}: 公開ノートが *.excalidraw.md を直接参照している`);
      }
      publishedNotes.push({ rel, content });
    }
  }

  const assetFiles = walk(PUBLIC_ASSETS_DIR).filter(
    (f) => !f.endsWith('.excalidraw.md') && !f.endsWith('.gitkeep'),
  );

  if (errors.length > 0) {
    console.error('公開前チェックに失敗しました:');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  // 未公開ノートへの wikilink を plain text に変換する。
  const publishedStems = new Set(publishedNotes.map((n) => basename(n.rel, '.md')));
  for (const note of publishedNotes) {
    const { content, warnings } = stripPrivateWikilinks(note.content, publishedStems);
    note.content = content;
    for (const w of warnings) console.warn(`  警告 [${note.rel}] ${w}`);
  }

  // staging を作り直す。
  const outAbs = join(ROOT, out);
  rmSync(outAbs, { recursive: true, force: true });
  // 管理対象ディレクトリは空でも作る（CI の rsync --delete で正しく反映するため）。
  for (const d of [...NOTE_DIRS, PUBLIC_ASSETS_DIR]) {
    mkdirSync(join(outAbs, d), { recursive: true });
  }

  for (const note of publishedNotes) writeNote(out, note.rel, note.content);
  for (const rel of assetFiles) copyInto(out, rel);

  console.log(
    `公開対象を ${out}/ へ書き出しました: ノート ${publishedNotes.length} 件 / asset ${assetFiles.length} 件`,
  );
  for (const note of publishedNotes) console.log(`  note  ${note.rel}`);
  for (const rel of assetFiles) console.log(`  asset ${rel}`);
}

main();
