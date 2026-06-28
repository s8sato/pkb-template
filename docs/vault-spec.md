# Obsidian Vault 仕様

## 1. 目的

個人のアイデア、読書メモ、手書き図解、知識リンクを Obsidian Vault として管理し、選択したコンテンツのみを Quartz 経由で静的サイトとして公開する。

## 2. Repository

```text
private repository:
  pkb

public repository:
  pkb-site
```

`pkb` は Obsidian Vault 本体を管理する。
`pkb-site` は Quartz の生成物のみを公開する。

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

  quartz.config.ts
  package.json
  .gitignore
  README.md
```

## 4. Directory roles

### `ideas/`

アイデア、概念、考察、思考メモを置く。

未整理メモも最初から `ideas/` に置く。

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

## Kindle highlights

- ...

## Notes

- ...

## Links

- [[ideas/アウトプット速度]]
- [[ideas/イシュー設定]]
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
![[assets/public/handwritten/output-speed.svg]]
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
![[assets/public/handwritten/output-speed.svg]]
```

Quartz / CI では `.excalidraw.md` を公開成果物から除外する。

## 8. Quartz

Quartz は静的サイト生成ツールとして使用する。

```text
Markdown / assets
  ↓
Quartz build
  ↓
HTML / CSS / JS
```

Quartz の生成物は `pkb-site` public repository に push する。

```text
pkb private repository
  ↓
Quartz build
  ↓
pkb-site public repository
  ↓
GitHub Pages
```

Quartz / CI では以下を除外する。

```text
assets/private/**
**/*.excalidraw.md
```

## 9. `package.json`

Quartz の依存関係と実行コマンドを管理する。

```json
{
  "scripts": {
    "preview": "quartz build --serve",
    "build": "quartz build"
  },
  "dependencies": {
    "@quartz-org/quartz": "latest"
  }
}
```

実行コマンド：

```bash
npm run preview
npm run build
```

## 10. `.gitignore`

最小構成に留める。

```gitignore
# Node
node_modules/

# Quartz
public/
.quartz-cache/

# Obsidian workspace state
.obsidian/workspace.json
.obsidian/workspace-mobile.json

# OS
.DS_Store
```

`.obsidian/` 全体は ignore しない。

## 11. Obsidian plugins

最小構成：

```text
Excalidraw
Linter
Templater
```

必要になったら検討する plugin：

```text
Dataview
QuickAdd
Advanced URI
Obsidian Git
Kindle Highlights / Readwise 系 plugin
```

## 12. Workflow

```text
思いつく
→ ideas/ に書く

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
→ Quartz build
→ pkb-site に生成物だけ push
→ GitHub Pages で公開する
```

## 13. Pre-publish checks

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
