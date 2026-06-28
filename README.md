# pkb — Personal Knowledge Base

あらゆる知識（アイデア、読書メモ、手書き図解、Web 抜粋、技術メモ）を単一の空間に
継続的に蓄積・接続し、再利用可能な知識ベースとして育てるための Obsidian Vault。
蓄積した知識のうち公開してよいものだけを選択し、Quartz で Web サイトとして公開する。

- 要求: [docs/requirements.md](docs/requirements.md)
- 設計: [docs/vault-design.md](docs/vault-design.md)
- 採否の根拠: [docs/decision-record.md](docs/decision-record.md)

## 対象ユーザ

- 読書・仕事・思考整理で生まれるアイデアを、散逸させず長期に育てたい個人
- フォルダ階層ではなくノート間リンクで知識を接続したい人
- プレーンな Markdown ＋ Git で知識を長期保管し、特定サービスに閉じ込められたくない人
- 整理された思考の一部だけを、無料で Web 公開したい人（非公開がデフォルト）

## 構成

```text
pkb/  … private repository（この Vault 本体）
  ideas/        アイデア・概念・思考メモ・Web 抜粋
  reading/      読書メモ・Kindle ハイライト
  assets/
    public/     公開してよい asset（images / handwritten）
    private/    非公開の asset
  .obsidian/    Obsidian 最小設定
  scripts/      公開対象を抽出・同期するスクリプト
  .github/      公開 CI

pkb-site/  … public repository（Quartz v5 サイト。別途作成）
```

公開フローは「`pkb` で公開対象だけを抽出 → `pkb-site` で build・公開」の 2 リポジトリ構成
（無料プランでも private な Vault を public に晒さずに公開するため）。詳細は
[docs/vault-design.md](docs/vault-design.md) を参照。

## 日常ワークフロー

- **書く（Capture）**: 思いついたら QuickAdd のホットキーで即時に `ideas/` へ。未整理でよい。
- **繋ぐ（Connect）**: ノートから他ノートへ `[[wikilink]]`。読書メモは自分のアイデアへリンク。
- **描く（Draw）**: Excalidraw で作図し、同じディレクトリへ `.svg` / `.png` を auto-export。
  公開図は `assets/public/handwritten/`、非公開図は `assets/private/handwritten/`。
- **育てる（Cultivate）**: 断片を後から追記・改名・リンク追加し、必要になれば公開対象にする。
- **公開する（Publish）**: 公開したい Markdown の frontmatter に `publish: true` を付ける。

### 公開ルール

- `publish: true` のない Markdown は公開されない（非公開がデフォルト）。
- 公開ノートが参照してよい asset は `assets/public/` 配下のみ。`assets/private/` は参照しない。
- 公開ノートは Excalidraw 編集元（`*.excalidraw.md`）を直接参照せず、生成された `.svg` / `.png` を参照する。
- これらは `scripts/sync-public.mjs` と CI が機械的に検査する（違反時はビルドを止める）。

ローカルでの抽出確認:

```bash
node scripts/sync-public.mjs --out .sync-staging
```

## 本手法の再現方法

1. **`pkb`（private）を用意する**
   - このリポジトリを private で作成し、Obsidian で Vault として開く。
   - コミュニティプラグインを導入: `Excalidraw` / `Linter` / `Templater` / `QuickAdd`
     （Settings → Community plugins からインストール・有効化）。
   - QuickAdd にホットキーを割り当て、`ideas/` への即時キャプチャを設定する。
   - 画像の既定貼り付け先は `assets/public/images/`。非公開画像は `assets/private/images/` へ移す。

2. **`pkb-site`（public）を Quartz v5 で作成する**

   ```bash
   git clone https://github.com/jackyzha0/quartz.git pkb-site
   cd pkb-site
   npm i
   npx quartz create        # テンプレートと baseUrl を設定
   ```

   - 公開制御に `publish: true` を使うため、Quartz の **ExplicitPublish** フィルタを有効にする。
   - GitHub Pages 用の `deploy.yml` を追加し、リポジトリの Settings → Pages で Source を
     「GitHub Actions」にする（Quartz 公式の Hosting 手順に従う）。
   - `pkb-site` を GitHub に push する。

3. **`pkb` → `pkb-site` の同期を有効にする**
   - `pkb-site` へ push できる PAT（または deploy key）を発行する。
   - `pkb` リポジトリの Settings → Secrets に `PKB_SITE_TOKEN` として登録する。
   - 以降 `pkb` の `main` へ push すると、CI（[.github/workflows/publish.yml](.github/workflows/publish.yml)）が
     公開対象だけを `pkb-site/content/` へ同期し、`pkb-site` が build → GitHub Pages で公開する。

4. **確認**
   - `publish: true` のノートだけが公開され、`assets/private/` や `*.excalidraw.md` が
     公開成果物に含まれないことを確認する。

> CI は公開ノートと公開 asset を `pkb-site` の `content/` へ**同期**するだけで、サイトの
> **生成（build）と公開（Pages デプロイ）は `pkb-site` 側**が担う。

## Quartz v5 の既知の問題と対処

### `content/index.md` に `publish: true` が必要

Quartz の **ExplicitPublish** フィルタを有効にすると、`content/index.md` もフィルタ対象になる。
`publish: true` を付けない場合、サイトのルート（`/`）が空になり RSS フィードが表示される。

**対処**: `content/index.md` の frontmatter に `publish: true` を追加する。

```md
---
title: （サイト名）
publish: true
---
```

### `pkb-site` の `.gitignore` が `content/assets/public/` を無視する

Quartz のデフォルト `.gitignore` は `public`（アンカーなし）を除外パターンに含む。
これはビルド出力の `public/` ディレクトリを除外する意図だが、
`content/assets/public/` も一致して無視されるため、asset が git に追加されない。

**対処**: `.gitignore` の `public` を `/public`（ルートアンカー付き）に変更する。

```diff
-public
+/public
```

### ノート本文の `# 見出し` とページタイトルが二重表示される

Quartz のデフォルト設定では `article-title` コンポーネントがファイル名（または frontmatter の `title`）を
ページ上部に表示する。ノート本文に `# 同名の見出し` がある場合、タイトルが二重に表示される。

**対処**: `quartz.config.yaml` の `article-title` コンポーネントを無効化する。

```yaml
- source: github:quartz-community/article-title
  enabled: false
```

ノート本文の `# 見出し` がページタイトルを兼ねるため、frontmatter の `title` キーは不要になる。

## ライセンス / 公開範囲

`pkb` 本体は private。`pkb-site` には `publish: true` を付けた公開対象のみが配置される。
