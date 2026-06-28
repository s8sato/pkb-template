# Obsidian Vault 設計

## 1. 目的

本書は設計（How）を定義する。目的・要求の全体像は [requirements.md](requirements.md) を正本とする。

## 2. Repository

```text
private repository:
  pkb

public repository:
  pkb-site
```

`pkb` は Obsidian Vault 本体（private）を管理する。
`pkb-site` は Quartz (v5) のサイトリポジトリ（public）。`pkb` の CI が公開ノートと公開 asset のみを `pkb-site` の `content/` へ同期し、`pkb-site` が Quartz build と GitHub Pages 公開を担う。

## 3. Directory structure

```text
pkb/
  ideas/
  reading/

  assets/
    public/
      images/
      handwritten/
    private/
      images/
      handwritten/

  .obsidian/
  .github/
    workflows/

  scripts/

  .gitignore
  README.md
```

Quartz の設定（`quartz.config.yaml` / `package.json`）は `pkb` ではなく `pkb-site` 側に置く。`scripts/` には `pkb` から `pkb-site` へ公開対象を抽出・同期するスクリプトを置く。

## 4. Directory roles

### `ideas/`

アイデア、概念、考察、思考メモを置く。

未整理メモも最初から `ideas/` に置く。

1 ノートには原則としてひとつのアイデア・概念・問いを扱う。
最初は断片でよく、後から追記・改名・リンク追加・公開対象化して育てる。

```text
ideas/
  アウトプット速度についての断片.md
  イシュー設定.md
  作業範囲の制御.md
```

### `reading/`

読書メモを置く。

Kindle ハイライト同期ノートも `reading/` に置く。

```text
reading/
  イシューからはじめよ.md
  具体と抽象.md
```

読書メモの基本形：

```md
# イシューからはじめよ

## Notes

- ...

## Links

- [[ideas/アウトプット速度]]
- [[ideas/イシュー設定]]

## Kindle highlights

- ...
```

### Web クリップ

Web ページからのテキスト抜粋・コピー&ペーストは、思考の断片として `ideas/` に Markdown ノートとして保存する。引用元 URL を本文に併記する。

```md
# 記事タイトルからの抜粋

> 引用したテキスト

出典: https://example.com/article

## Notes

- 自分のコメント
```

Web ページ由来の画像は asset として保存し、公開可否に応じて配置先を分ける。

```text
assets/public/images/   公開してよい Web 画像
assets/private/images/  非公開の Web 画像
```

### `assets/public/images/`

公開してよい通常画像を置く。

通常画像には、スクリーンショット、写真、Web 画像、図表などを含める。

### `assets/private/images/`

非公開の通常画像を置く。

### `assets/public/handwritten/`

公開してよい手書き・図解関連ファイルを置く。

Excalidraw の編集元と自動生成された SVG / PNG は同じディレクトリに置く。

例：

```text
assets/public/handwritten/output-speed.excalidraw.md
assets/public/handwritten/output-speed.svg
```

公開サイトでは SVG / PNG のみを使用する。

### `assets/private/handwritten/`

非公開の手書き・図解関連ファイルを置く。

例：

```text
assets/private/handwritten/raw-thought.excalidraw.md
assets/private/handwritten/raw-thought.svg
```

## 5. Visibility rules

Markdown の公開可否は frontmatter で制御する。

公開するノートのみ `publish: true` を付ける。

```md
---
publish: true
---

# ノートタイトル
```

`publish: true` がない Markdown は公開しない。

公開ノートから参照してよい asset は以下のみとする。

```text
assets/public/images/
assets/public/handwritten/
```

公開ノートから以下を参照してはならない。

```text
assets/private/
```

また、公開ノートから `.excalidraw.md` を直接参照してはならない。
公開ノートでは、Excalidraw から生成された `.svg` または `.png` を参照する。

```md
![[../assets/public/handwritten/output-speed.svg]]
```

## 6. Asset rules

`assets/` 以下では、公開可否を最上位の境界にする。

```text
assets/
  public/
  private/
```

`images/` と `handwritten/` は分ける。

```text
images/
  通常画像、スクリーンショット、写真、図表

handwritten/
  Excalidraw などの手書き・図解
```

`handwritten/` では、編集元と生成物をディレクトリでは分けない。

```text
output-speed.excalidraw.md
output-speed.svg
```

編集元と生成物は拡張子で区別する。

```text
.excalidraw.md
  Excalidraw 編集元

.svg / .png
  Quartz 公開用または Obsidian 埋め込み用の生成物
```

## 7. Excalidraw rules

Excalidraw の自動生成先は、編集元と同じディレクトリにする。

公開してよい図は `assets/public/handwritten/` に置く。

```text
assets/public/handwritten/output-speed.excalidraw.md
assets/public/handwritten/output-speed.svg
```

非公開の図は `assets/private/handwritten/` に置く。

```text
assets/private/handwritten/raw-thought.excalidraw.md
assets/private/handwritten/raw-thought.svg
```

公開ノートでは生成済み画像を参照する。

```md
![[../assets/public/handwritten/output-speed.svg]]
```

Quartz / CI では `.excalidraw.md` を公開成果物から除外する。

## 8. Quartz

Quartz (v5) を静的サイト生成ツールとして使用する。Quartz 本体・設定（`quartz.config.yaml` / `package.json`）は `pkb-site` リポジトリに置き、コンテンツは `pkb-site` の `content/` 配下で扱う。

```text
Markdown / assets
  ↓
Quartz build
  ↓
HTML / CSS / JS
```

公開フローは「pkb で抽出 → pkb-site で build・公開」の 2 リポジトリ構成とする。`pkb` の CI が公開ノート（`publish: true`）と公開 asset（`assets/public/`）のみを抽出し、`pkb-site` の `content/` へ同期する。非公開ノートや `assets/private/`、`*.excalidraw.md` は同期しない。

```text
pkb private repository
  ideas / reading / assets
  ↓ CI: 公開対象のみ抽出（フィルタ）
pkb-site public repository
  content/
  ↓ npx quartz build
  public/（生成物）
  ↓ GitHub Actions
GitHub Pages
```

公開サイトでは、閲覧性・検索性・ナビゲーション性を高めるため、Quartz の以下の機能を有効にする。

```text
全文検索 (Search)
グラフビュー (Graph)
バックリンク (Backlinks)
エクスプローラ / 目次によるナビゲーション
```

## 9. Build スクリプト

Quartz v5 はリポジトリ（`pkb-site`）をクローンして使う。`package.json` と `quartz.config.yaml` は `pkb-site` 側に置く。

`pkb-site` での実行コマンド：

```bash
npm ci                      # 依存をインストール
npx quartz plugin install   # lockfile からプラグインを導入
npx quartz build --serve    # ローカルプレビュー
npx quartz build            # 本番ビルド（public/ を生成）
```

## 10. `.gitignore`

最小構成に留める。

```gitignore
# Node
node_modules/

# Obsidian workspace state
.obsidian/workspace.json
.obsidian/workspace-mobile.json

# OS
.DS_Store
```

`.obsidian/` 全体は ignore しない。Quartz のビルド成果物（`public/` / `.quartz-cache/`）は `pkb` ではなく `pkb-site` 側の `.gitignore` で扱う。

## 11. Obsidian plugins

Obsidian を Vault 母艦として用いる。plugin は最小構成に留める。

最小構成：

```text
Excalidraw
Linter
Templater
QuickAdd
```

QuickAdd は、ホットキーからの即時キャプチャ（予備動作・心理的抵抗の最小化）に用いる。

必要になったら検討する plugin：

```text
Dataview
Advanced URI
Obsidian Git
Kindle Highlights / Readwise 系 plugin
```

## 12. Workflow

```text
思いつく
→ QuickAdd のホットキーで即時に ideas/ へ記録する

読む
→ Kindle ハイライトを reading/ に同期
→ 自分のコメントを追記
→ ideas/ にリンクする

描く
→ 公開してよい図は assets/public/handwritten/ に保存する
→ 非公開の図は assets/private/handwritten/ に保存する
→ Excalidraw から SVG / PNG を同じディレクトリに自動生成する

公開する
→ Markdown に publish: true を付ける
→ 参照 asset が assets/public/ 配下のみであることを確認する
→ .excalidraw.md を直接参照していないことを確認する
→ pkb に push（CI が公開対象のみを pkb-site の content/ へ同期）
→ pkb-site が Quartz build → GitHub Pages で公開する
```

## 13. Pre-publish checks

これらは CI の同期・ビルド時に実行する。同期前に `pkb` 側の公開対象を、ビルド後に `pkb-site` の生成物 `public/` を検査する。

```bash
# 公開成果物に private というパスが混ざっていないか
find public -iname '*private*'

# 公開成果物に .excalidraw.md が混ざっていないか
find public -iname '*.excalidraw.md'

# 公開成果物に出したくない語が混ざっていないか
rg "private|非公開|career|journal|raw" public

# 公開ノートが private assets を参照していないか
rg "assets/private" .

# 公開ノートが Excalidraw 編集元を直接参照していないか
rg "\.excalidraw\.md" ideas reading
```

## 14. 検索

知識ベース全体の検索性を確保する。

```text
Obsidian:
  標準の全文検索・タグ検索・リンク検索を用いる。
  Vault 全体を対象に、本文・タイトル・リンクを横断して検索する。

公開サイト:
  Quartz の全文検索を用いる。
```

特別なファイル形式やデータベースを導入せず、プレーンテキスト Markdown のままで検索可能な状態を保つ。

## 15. AI 親和性

Vault 全体を、AI による読み取り・編集に適した状態に保つ。

```text
形式:
  すべてのノートをプレーンテキスト Markdown で保存する。

構造:
  ディレクトリ構成と frontmatter を一貫させ、機械的に解釈しやすくする。

パス:
  リンクや asset 参照のパスを安定させ、移動・改名を最小限にする。
```

これにより、AI が Vault 全体を文脈として読み取り、ノートの追記・リンク提案・整理を行いやすくする。
