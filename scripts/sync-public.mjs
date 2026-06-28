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
 *
 * 公開前チェック（公開対象ノートに対して）:
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
  mkdirSync,
  copyFileSync,
  rmSync,
  existsSync,
} from 'node:fs';
import { join, dirname, relative } from 'node:path';

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

function copyInto(out, rel) {
  const dest = join(out, rel);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(join(ROOT, rel), dest);
}

function main() {
  const { out } = parseArgs(process.argv.slice(2));
  const errors = [];
  const publishedNotes = [];

  for (const dir of NOTE_DIRS) {
    for (const rel of walk(dir)) {
      if (!rel.endsWith('.md')) continue;
      const content = readFileSync(join(ROOT, rel), 'utf8');
      if (!hasPublishTrue(content)) continue;
      if (/assets[\\/]+private/.test(content)) {
        errors.push(`${rel}: 公開ノートが assets/private を参照している`);
      }
      if (/\.excalidraw\.md/.test(content)) {
        errors.push(`${rel}: 公開ノートが *.excalidraw.md を直接参照している`);
      }
      publishedNotes.push(rel);
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

  // staging を作り直す。
  const outAbs = join(ROOT, out);
  rmSync(outAbs, { recursive: true, force: true });
  // 管理対象ディレクトリは空でも作る（CI の rsync --delete で正しく反映するため）。
  for (const d of [...NOTE_DIRS, PUBLIC_ASSETS_DIR]) {
    mkdirSync(join(outAbs, d), { recursive: true });
  }

  for (const rel of publishedNotes) copyInto(out, rel);
  for (const rel of assetFiles) copyInto(out, rel);

  console.log(
    `公開対象を ${out}/ へ書き出しました: ノート ${publishedNotes.length} 件 / asset ${assetFiles.length} 件`,
  );
  for (const rel of publishedNotes) console.log(`  note  ${rel}`);
  for (const rel of assetFiles) console.log(`  asset ${rel}`);
}

main();
