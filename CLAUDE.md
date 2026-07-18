# poc-openspec-superpowers

## 用語

- **スーパープロジェクト**: 本リポジトリ本体（public, `poc-openspec-superpowers`）。
- **openspec/**: スーパープロジェクトに submodule としてマウントされた仕様管理用リポジトリ（private, `poc-openspec-superpowers-specs`）。

## 計画フェーズ（要件整理）

- このプロジェクトの要件整理・仕様管理は OpenSpec で行う。Superpowers の brainstorming / writing-plans スキルは使用しないこと。
- 機能要望や仕様変更の相談を受けたら、まず /opsx:explore → /opsx:propose の順で対応すること。
- 仕様の成果物（proposal.md, design.md, delta specs）は openspec/ 配下にのみ書き込むこと。

## 実装フェーズ

- /opsx:apply でタスクを実行する際は、タスクを直接実装しないこと。必ず Skill ツールで superpowers:subagent-driven-development を明示的に呼び出し、tasks.md を渡すこと。
- 各タスクは red → green → refactor の順で実装し、テストを書く前にコードを書かないこと。
- 全タスク完了後、Superpowers の requesting-code-review でレビューしてから /opsx:archive に進むこと。
- superpowers:subagent-driven-development の implementer は openspec の tasks.md のチェックボックスを自動更新しない。各タスクのレビューが Approved になったら、コントローラー（このセッション）が対応する tasks.md の `- [ ]` を `- [x]` に更新し、openspec/ を作業ディレクトリとしてコミットすること。

## OpenSpec ↔ Superpowers 統合上の互換性対応

- `openspec/schemas/spec-driven/` に project-local schema を fork 済み。tasks artifact の見出し形式を `## Task N: <Title>` に固定している。
- 既定の `## N. Title` のままだと、superpowers:subagent-driven-development の `task-brief` スクリプトが見出しを `Task` という単語でマッチングするため、タスクを検出できずエラーになる。
- /opsx:propose で生成される tasks.md はこの schema を使うため、通常通り生成すればそのまま subagent-driven-development に渡して良い。
- `openspec/schemas/spec-driven/schema.yaml` と `templates/tasks.md` の見出し形式は変更しないこと。

## Git運用

### コミットメッセージ

- [Conventional Commits](https://www.conventionalcommits.org/) 形式を使用する。
- スーパープロジェクト・openspec/ どちらのコミットにも適用する。

```text
<type>[optional scope]: <description>

[optional body]

[optional footers]
```

### ブランチ

`main` / `develop` / `feature/*` の3種類のみを使用する。`main` はリリース済みの安定版、`develop` は開発中の変更を統合するブランチ。作業を開始する前に、必ず以下いずれかのモードで `develop` から `feature/*` ブランチを作成して着手すること（`main` / `develop` 上で直接作業しない）。判定基準は「作業が openspec/ 配下のファイル変更を伴うか」。

- **同期モード**（openspec/ 配下の変更を伴う作業: 仕様追加・変更など）: スーパープロジェクトと openspec/ の両方で、それぞれの `develop` から同名の `feature/<name>` ブランチを作成し、並行して作業する。openspec 側の `feature/<name>` を `develop` にマージ・push したら、スーパープロジェクト側で gitlink 参照更新コミットを行う。
- **単独モード**（openspec/ 配下を変更しない作業: ドキュメント修正、リファクタリングなど）: スーパープロジェクトのみ `develop` から `feature/*` を作成して切り替え、openspec/ には変更を加えない。

`feature/*` の変更は PR で `develop` にマージする。GitHub リポジトリの既定ブランチが `main` のままの場合、`gh pr create` 等で PR を作成する際は `--base develop` を明示すること。`develop` → `main` へのリリースマージは人間が判断して行い、Claude Code は明示的な指示なくこのマージを行わないこと。

#### 命名規則

`feature/<slug>` 形式を使用する。`<slug>` は kebab-case・英語で、変更内容を短く要約する。

- 同期モード: openspec の change ID（`openspec/changes/<change-id>`）と一致させる（例: `feature/add-todo-app`）。
- 単独モード: 変更内容を要約した任意の slug を使う（例: `feature/unify-repo-terminology`）。

### openspec/ 配下の操作

- `git add` / `git commit` は必ず openspec/ を作業ディレクトリとして実行すること（例: `cd openspec && git add ... && git commit`）。スーパープロジェクトのルートから直接パス指定でコミットしないこと。
- openspec/ の実体ファイルがスーパープロジェクトのステージングに直接追加されようとした場合は、コミット前に必ず人間に確認すること。
- 新規コミットを作る前に、必ず `git -C openspec branch --show-current` 等で HEAD が detached になっていないか確認すること。空文字が返る場合は detached HEAD なので、先に同期モードなら対応する `feature/<name>`、単独モードなら `develop` へ `cd openspec && git checkout <ブランチ>` してから作業すること。
  - detached HEAD のままコミットすると意図したブランチに反映されない孤立コミットになり、`git push` が「Everything up-to-date」で無言で失敗する（gitlink 参照更新のために `git checkout <SHA>` した後に detached のまま新規開発を続けてしまうのが典型的な事故パターン）。

#### コミットと push の粒度

- openspec/ 内でのコミット自体はタスク単位（tasks.md のチェックボックス更新、schema修正など）で都度行って良いが、push（openspec/ へのpush、およびスーパープロジェクト側でのgitlink参照更新コミット・push）は毎回まとめて行う必要はない。一区切りついたタイミング（例: subagent-driven-development の全タスク完了時、フェーズの切り替わり時、人間に進捗を報告する直前）にまとめて1回行うこと。
- まとめて push する直前には、`git -C openspec branch --show-current` と `git -C openspec log --oneline -3` で develop ブランチ（または対象の feature/* ブランチ）かつ意図したコミットが揃っていることを再確認してから push すること（push頻度を下げる分、1回の確認漏れの影響が大きくなるため省略しない）。
