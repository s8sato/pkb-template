# 意思決定記録

本書は、[requirements.md](requirements.md)（要求 / What）と [vault-design.md](vault-design.md)（設計 / How）を繋ぐ意思決定を記録する。各決定には、対応する要求 ID（R / F / N / C）と設計節（§）を併記し、要求と設計のトレーサビリティを保つ。

## 凡例

| 状態 | 意味 |
| --- | --- |
| 採用 | 本プロジェクトで採用した決定 |
| 却下 | 検討の上、採用しなかった選択肢 |
| 保留 | 現時点では採用せず、必要時に再検討する選択肢 |

## 1. 母艦ツール（知識ベース）

**採用: Obsidian を Vault 母艦とする。** Markdown + ノート間リンク + Excalidraw 連携 + Git 管理を素直に満たすため。
→ 関連: R-004, R-006, R-012, R-013, N-001 / vault-design §1, §11

| 対象 | 判断 | 根拠 | 関連 |
| --- | --- | --- | --- |
| Xmind を母艦にする | 却下 | 1 枚のマインドマップや本単位の構造化には強いが、Vault 全体の Markdown / Git / Quartz 公開 / 知識グラフ管理には向かない。`.xmind` は Git 差分管理もしにくい。 | R-006, R-012, N-001 |
| Logseq を母艦にする | 却下 | ブロック指向は魅力だが、Markdown がアウトライナー色が強く、静的サイト公開時の素直さでは Obsidian + Quartz に劣る。 | N-001, R-018 |
| Heptabase / Scrintal | 却下 | 視覚的カード整理は魅力だが、Git 管理・Markdown 中心・Quartz 公開・Linux 中心運用との相性が弱い。 | N-001, R-012, C-002 |
| Tana / Capacities / Anytype | 却下 | 知識 OS / 個人 DB 寄りで強力だが、プレーン Markdown の Git 差分管理・静的サイト化では Obsidian に劣る。 | N-001, N-008 |
| RemNote | 却下 | 暗記・反復学習に特化しており、知識ベース母艦としては学習ツール寄りで過剰。暗記学習はスコープ対象外。 | スコープ対象外 |
| Zettlr | 却下 | Markdown・研究執筆にはよいが、Obsidian 的なリンク体験・Excalidraw 連携・Vault 運用の中心にはしにくい。 | R-005, R-006 |

## 2. 手書き・図解

**採用: Excalidraw を用い、編集元（`.excalidraw.md`）と auto-export した SVG / PNG を同一ディレクトリに置く。** 公開サイトでは生成画像のみを参照する。
→ 関連: R-004, R-005, F-007, F-008, F-010 / §6, §7

| 対象 | 判断 | 根拠 | 関連 |
| --- | --- | --- | --- |
| Quartz で Excalidraw を直接レンダリングする | 却下 | 編集元を直接公開・レンダリングするより、auto-export した SVG / PNG を Markdown から参照するほうが安定。Excalidraw plugin も auto-export と keep-in-sync をサポートする。[3] | R-005, F-010 / §7 |
| Excalidraw の `source/` と `generated/` をディレクトリ分離する | 却下 | auto-export は編集元と同じ場所に SVG / PNG を置く運用と相性がよい。出力先を分けると hook 等が必要で初期仕様として重い。 | F-008 / §6 |
| `onImageExportPathHook` で出力先を制御する | 保留 | 出力先の厳密な制御が必要になれば有力。現時点では auto-export を編集元と同じ場所に置く運用で十分。 | F-008 |
| iPad + Freeform / Apple メモ | 保留 | 外出先での手書きやマルチデバイス入力が必要になれば有力。現時点では Linux 上の Excalidraw で十分。 | C-002, C-003 |

## 3. 静的サイト生成・公開

**採用: Quartz で静的サイトを生成し、GitHub Pages で公開する。Vault 本体は private（`pkb`）、生成物のみ public（`pkb-site`）の 2 リポジトリ分割とする。**
→ 関連: R-018, R-019, F-011, F-012, N-011, C-001, C-004, C-005 / §2, §8

| 対象 | 判断 | 根拠 | 関連 |
| --- | --- | --- | --- |
| Docusaurus / Astro Starlight / Material for MkDocs を主系にする | 却下 | 整った技術ドキュメントサイトには強いが、デジタルガーデン・wikilink / backlink / graph 運用では Quartz のほうが素直。[1] | R-006, N-011 / §8 |
| Obsidian Publish | 却下 | 公開は楽だが、有料の独自ホスティングで、無料 GitHub Pages＋private repo からの選択公開（C-001, R-019）と噛み合わない。 | R-019, C-001 |
| private repo から直接 GitHub Pages 公開 | 却下 | 無料個人プランでは Pages は public repository が対象。よって `pkb` から直接出さず、生成物だけを `pkb-site` に出す。[2] | R-019, C-001 / §2 |
| Cloudflare Pages + Access を初期採用 | 保留 | 認証付き公開が必要になれば有力。現時点では GitHub Pages で十分。 | C-005 |

## 4. 公開制御

**採用: 公開可否は、Markdown では frontmatter `publish: true`（Quartz ExplicitPublish）、asset では `assets/public` / `assets/private` のディレクトリ境界で管理する。**
→ 関連: R-014, R-015, R-016, R-017, F-009, F-010, N-006 / §5, §6

| 対象 | 判断 | 根拠 | 関連 |
| --- | --- | --- | --- |
| `status:` を公開制御の必須項目にする | 却下 | `status:` は Quartz の特別機能ではなく任意の frontmatter。公開制御は ExplicitPublish が通す `publish: true` を使う。[4] | F-009, N-006 / §5 |
| `.pub.svg` のようなファイル名で公開可否を管理する | 却下 | ファイル名規則は見落としやすい。公開可否は `assets/public` / `assets/private` のディレクトリ境界で管理する。 | R-016, N-006 / §6 |
| `assets/source/public` のように source / generated を上位にする | 却下 | 公開可否が安全境界なので、`public` / `private` を上位に置くほうが安全。 | R-017, N-006 / §6 |

## 5. ディレクトリ構成

**採用: `ideas/` と `reading/` のフラット構成とし、階層よりリンクで接続する。**
→ 関連: R-002, R-003, R-006, R-007, F-001, F-002, N-003 / §3, §4

| 対象 | 判断 | 根拠 | 関連 |
| --- | --- | --- | --- |
| `00_inbox/` を作る | 却下 | 未整理メモ置き場は放置箱になりやすい。最初から `ideas/` に入れ、未整理状態は本文やプロパティで表す。 | R-002, R-003 / §4 |
| `concepts/` ディレクトリ名 | 却下 | `concepts/` は整理済みの概念という印象が強い。未成熟な思いつきも受け入れるため `ideas/` を採用。 | R-002, R-010 / §4 |

## 6. キャプチャ

**採用: QuickAdd のホットキーで `ideas/` へ即時記録する。Web ページのクリップ（テキスト）も思考の断片として `ideas/` に Markdown で保存し、引用元 URL を併記する。**
→ 関連: R-001, R-002, スコープ（Web クリップ）, A-009 / §4, §11, §12

| 対象 | 判断 | 根拠 | 関連 |
| --- | --- | --- | --- |
| 専用の `clips/` や Web クリッパーを情報の正本にする | 却下 | クリップも思考の断片として `ideas/` に取り込めば十分。ディレクトリ増加と運用分岐を避ける。 | N-003 / §4 |
| QuickAdd を「必要になったら」扱いにする | 却下 | 予備動作・心理的抵抗の最小化（R-001）は中核要求のため、最小プラグインに昇格する。 | R-001 / §11 |

## 7. 検索・AI 親和性

**採用: 検索は Obsidian 標準検索と Quartz の全文検索を用い、特別なデータベースを導入しない。Vault 全体をプレーン Markdown・一貫した構造・安定したパスで保ち、AI が読み書きしやすい状態を維持する。**
→ 関連: N-001, N-008, N-009, N-010, N-011 / §14, §15

| 対象 | 判断 | 根拠 | 関連 |
| --- | --- | --- | --- |
| 専用の検索 DB / インデックスを導入する | 却下 | Obsidian 標準検索と Quartz 検索で要求を満たせる。プレーン Markdown のまま検索可能な状態を保つほうが可搬性・AI 親和性が高い。 | N-008, N-009, N-010 / §14 |

## 8. 運用ツール分担

**採用: 日常の知識作成は Obsidian、Git / Quartz / CI / 一括置換などの整備は VS Code・terminal に分離する。README は入口に留め、詳細は requirements.md / vault-design.md に置く。**
→ 関連: R-001, R-013, N-004 / §9, §10, §13

| 対象 | 判断 | 根拠 | 関連 |
| --- | --- | --- | --- |
| VS Code を執筆母艦にする | 却下 | リンク・図解・思考集中の執筆体験は Obsidian が優れるため、日常の知識作成は Obsidian を主にし、VS Code は Git / Quartz / CI 整備に充てる。 | R-001 |
| Obsidian 内に terminal 運用を寄せる | 却下 | 思考中に運用作業が混ざるため、terminal は VS Code / shell 側に分離する。 | R-001, N-004 |
| README に長い仕様書を置く | 却下 | README は repo の入口に留め、詳細は `docs/requirements.md`（要求）と `docs/vault-design.md`（設計）に置くほうが見通しがよい。 | N-004 |
| Obsidian Git plugin を初期必須にする | 保留 | Obsidian 内で完結した同期が必要になれば有力。現時点では Git は VS Code / terminal に分離し、Obsidian は思考・リンク・図解に集中させる。 | R-013 |

## 参考

[1]: https://quartz.jzhao.xyz/ "Welcome to Quartz 4"
[2]: https://docs.github.com/articles/creating-project-pages-manually "Creating a GitHub Pages site"
[3]: https://github.com/zsviczian/obsidian-excalidraw-plugin "A plugin to edit and view Excalidraw drawings in Obsidian"
[4]: https://quartz.jzhao.xyz/plugins/ExplicitPublish "ExplicitPublish"
