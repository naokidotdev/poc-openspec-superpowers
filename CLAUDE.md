# poc-openspec-superpowers

## 用語

- **superproject**: 本リポジトリ本体（public, `poc-openspec-superpowers`）。
- **openspec/**: superproject に submodule としてマウントされた仕様管理用リポジトリ（private, `poc-openspec-superpowers-specs`）。

## ドキュメント管理

**対象**: `README.md`, `CLAUDE.md` など、このプロジェクトが独自に管理する Markdown。`.claude/` 配下のスキル/コマンド定義や `openspec/`（別リポジトリ）はプラグイン・仕様管理側の管轄なので対象外。

1. **Progressive disclosure（段階的な情報開示）** — 各ドキュメントは、それ単体で読者に必要な「浅い理解」が完結するように書く。要約・結論レベルの記述が複数箇所に現れることは許容する。一方、手順の詳細や運用ルールの正確な条件分岐など「深い理解」が必要な内容は1箇所にまとめ、他のドキュメントはそこへの要約＋導線に留める。
   判断基準: 「これは要約か、コピペか？」— 1〜2文の要約はOK、詳細手順の複製はNG。
2. **ドキュメントごとに役割を1つに絞る** — 例: `README.md`=人間向け概要・セットアップ、`CLAUDE.md`=Claude Code向け運用ルール。新規ドキュメントを増やす前に、既存ファイルの役割に収まらないか確認する。
3. **リンクは深掘り導線として使う** — 「もっと詳しく知りたい人向け」の導線であり、基本的な理解のために毎回リンク先を辿らないと読めない状態（ポインタ地獄）を作らない。読者がリンクを一切踏まなくても、そのドキュメントの主目的は達成できることを基準にする。
4. **成長パス** — `CLAUDE.md` が肥大化したり、特定領域（例: openspec/ 配下限定）でしか関係しないルールが増えてきたら、`.claude/rules/*.md`（path-scoped、該当領域で作業する時だけ自動読み込み）への切り出しを検討する。人間向けの深掘り詳細（設計背景・長い経緯説明など）が必要になったら `docs/*` に集約し、`CLAUDE.md`/`README.md` からは要約＋リンクに留める。

## 計画フェーズ（要件整理）

- このプロジェクトの要件整理・仕様管理は OpenSpec で行う。Superpowers の brainstorming / writing-plans スキルは使用しないこと。
- 機能要望や仕様変更の相談を受けたら、まず /opsx:explore → /opsx:propose の順で対応すること。
- 仕様の成果物（proposal.md, design.md, delta specs）は openspec/ 配下にのみ書き込むこと。
- proposal.md の Capabilities は両方空にしないこと。ユーザー向けの振る舞いを一切変えない技術リファクタ（内部実装の置き換え・依存ライブラリの移行など）であっても、その変更が実際に提供する性質・保証（型安全性、パフォーマンス、エラー処理の一貫性など）を最低1件、既存 capability への `ADDED Requirements` として明示すること（「validate を通すためのダミー要件」ではなく、変更の本来の動機を正確に言語化したもの）。理由: [docs/operational-notes.md#openspec-delta制約](./docs/operational-notes.md#openspec-delta制約)
  - 本当に外部から観測可能な性質変化が一切ない変更（例: コメント整理、フォーマット調整のみ）は、そもそも OpenSpec の change プロセスに乗せる必要がない。

## 実装フェーズ

- /opsx:apply でタスクを実行する際は、タスクを直接実装しないこと。必ず Skill ツールで superpowers:subagent-driven-development を明示的に呼び出し、tasks.md を渡すこと。
- 各タスクは red → green → refactor の順で実装し、テストを書く前にコードを書かないこと。
- 全タスク完了後、Superpowers の requesting-code-review でレビューしてから /opsx:archive に進むこと。
- superpowers:subagent-driven-development の implementer は openspec の tasks.md のチェックボックスを自動更新しない。各タスクのレビューが Approved になったら、コントローラー（このセッション）が対応する tasks.md の `- [ ]` を `- [x]` に更新し、openspec/ を作業ディレクトリとしてコミットすること。

## OpenSpec ↔ Superpowers 統合上の互換性対応

- `openspec/schemas/spec-driven/` に project-local schema を fork 済み。tasks artifact の見出し形式を `## Task N: <Title>` に固定している。理由: [docs/operational-notes.md#openspec-superpowers-互換性](./docs/operational-notes.md#openspec-superpowers-互換性)
- /opsx:propose で生成される tasks.md はこの schema を使うため、通常通り生成すればそのまま subagent-driven-development に渡して良い。
- `openspec/schemas/spec-driven/schema.yaml` と `templates/tasks.md` の見出し形式は変更しないこと。

## Git運用

### コミットメッセージ

- [Conventional Commits](https://www.conventionalcommits.org/) 形式を使用する。
- superproject・openspec/ どちらのコミットにも適用する。
- `<description>` と `[optional body]` は日本語で書く。ただし `<type>`（`feat`/`fix`/`docs`/`chore` 等）、`Closes #N` などの GitHub 連携キーワード、`Co-Authored-By:` トレーラーはツール連携に必要なため英語のまま使用する。

```text
<type>[optional scope]: <description>

[optional body]

[optional footers]
```

### ブランチ

`main` / `develop` / `feature/*` の3種類のみを使用する。`main` はリリース済みの安定版、`develop` は開発中の変更を統合するブランチ。作業を開始する前に、必ず以下いずれかのモードで `develop` から `feature/*` ブランチを作成して着手すること（`main` / `develop` 上で直接作業しない）。判定基準は「作業が openspec/ 配下のファイル変更を伴うか」。ブランチ名は `feature/<slug>` 形式を使用する。`<slug>` は kebab-case・英語で、変更内容を短く要約する。

#### 同期モード

openspec/ 配下の変更を伴う作業（仕様追加・変更など）。superproject と openspec/ の両方で、それぞれの `develop` から同名の `feature/<name>` ブランチを作成し、並行して作業する。`<slug>` は openspec の change ID（`openspec/changes/<change-id>`）と一致させる（例: `feature/add-todo-app`）。

#### 単独モード

openspec/ 配下を変更しない作業（ドキュメント修正、リファクタリングなど）。superproject のみ `develop` から `feature/*` を作成して切り替え、openspec/ には変更を加えない。`<slug>` は変更内容を要約した任意の値を使う（例: `feature/unify-repo-terminology`）。gitlink 参照更新のみを行うブランチもここに含まれる（openspec/ 配下のファイル自体は変更しないため）。命名は `feature/update-openspec-gitlink-<change-id>` の形式に揃える（例: `feature/update-openspec-gitlink-use-hono-rpc`）。

### PR

feature/* ブランチでの修正が完了したら、`feature/*` → `develop` の PR を作成する。GitHub リポジトリの既定ブランチは `main` のため、`gh pr create` 等で PR を作成する際は `--base develop` を明示すること。`develop` → `main` の PR は人間が判断して作成し、Claude Code は明示的な指示なくこの PR 作成・マージを行わないこと。

- PR のタイトル・本文は日本語で書く。[`.github/pull_request_template.md`](./.github/pull_request_template.md) のセクション見出し（`## Summary` 等）はテンプレートの構造要素なので英語のまま使用してよい。
- 同期モードでは、openspec 側・superproject 側の PR を両方作成した後、**先に作成した方の PR 本文に戻り、プレースホルダーを後から作成した PR への実リンクに更新すること**。PR 番号は作成時にしか確定しないため、先に作る側は後続 PR へのリンクをプレースホルダー（例: `#(作成予定)`）にせざるを得ないが、両方揃った時点で更新を忘れると片方向リンクのまま放置される。

#### gitlink 参照更新コミットの PR

- gitlink 参照更新コミットは、実装内容を含む feature PR には含めず、**別の独立した chore PR** として作成する（`chore: update openspec submodule reference to merged <change-id> change` 形式）。実装 feature PR は openspec 側 PR のマージ確定を待たずに push・PR 作成してよい。
- openspec 側 PR がマージされたら、`develop` から新しい feature ブランチ（例: `feature/update-openspec-gitlink-<change-id>`）を切り、gitlink 参照のみを更新するコミットを作成して PR にする（マージ済み PR には後から commit を追加できないため、実装 PR と同一にはできない）。
- この chore PR は gitlink 参照のみの機械的な更新で判断を伴わないため、Claude Code が作成後に人間のレビューを待たず即座に `develop` へマージしてよい。他の `feature/*` → `develop` PR とは異なる扱い。

### openspec/ 配下の操作

- `git add` / `git commit` は必ず openspec/ を対象として実行すること。`git -C openspec add ...` / `git -C openspec commit ...` の形を使い、`cd openspec && ...` は使わないこと。superproject のルートから直接パス指定でコミットしないこと。
- openspec/ の実体ファイルが superproject のステージングに直接追加されようとした場合は、コミット前に必ず人間に確認すること。
- 新規コミットを作る前に、必ず `git -C openspec branch --show-current` 等で HEAD が detached になっていないか確認すること。空文字が返る場合は detached HEAD なので、先に同期モードなら対応する `feature/<name>`、単独モードなら `develop` へ `git -C openspec checkout <ブランチ>` してから作業すること。事故パターン: [docs/operational-notes.md#detached-head事故パターン](./docs/operational-notes.md#detached-head事故パターン)
- `git rev-parse HEAD` や `task-brief`/`review-package` スクリプトなど、cwd に依存してリポジトリルートを解決するコマンドの実行前には、`pwd` で superproject のルートにいることを確認すること。仕組みと事故例（submodule 起因のパス事故防止）: [docs/operational-notes.md#cwd安全性の事故例](./docs/operational-notes.md#cwd安全性の事故例)
- openspec/ 内でのコミット自体はタスク単位（tasks.md のチェックボックス更新、schema修正など）で都度行って良いが、push（openspec/ へのpush、および superproject 側でのgitlink参照更新コミット・push）は毎回まとめて行う必要はない。一区切りついたタイミング（例: subagent-driven-development の全タスク完了時、フェーズの切り替わり時、人間に進捗を報告する直前）にまとめて1回行うこと。まとめて push する直前には、`git -C openspec branch --show-current` と `git -C openspec log --oneline -3` で develop ブランチ（または対象の feature/* ブランチ）かつ意図したコミットが揃っていることを再確認してから push すること。
