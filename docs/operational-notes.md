# 運用ルールの背景・経緯

`CLAUDE.md` の各ルールについて、「なぜそうなっているか」の詳しい経緯をまとめた資料です。日常の作業では `CLAUDE.md` 本体の結論だけ読めば十分ですが、経緯を理解したい・ルール変更を検討する際はここを参照してください。

## OpenSpec delta制約

`openspec` CLI は「change には最低1件の delta（ADDED/MODIFIED/REMOVED/RENAMED requirement）が必要」という制約を、ワークフロー schema とは独立したコアのデータモデル（`ChangeSchema`）にハードコードしている。project-local schema を fork してもこの制約は回避できない。

そのため、ユーザー向けの振る舞いを一切変えない技術リファクタ（例: 内部実装の置き換え、依存ライブラリの移行）であっても、proposal.md の Capabilities を両方空にすることはできない。この制約を回避するための実務上の対処が `CLAUDE.md` 本体のルールになっている。

## OpenSpec-Superpowers 互換性

`openspec/schemas/spec-driven/` に project-local schema を fork 済み。tasks artifact の見出し形式を `## Task N: <Title>` に固定している。

既定の `## N. Title` のままだと、superpowers:subagent-driven-development の `task-brief` スクリプトが見出しを `Task` という単語でマッチングするため、タスクを検出できずエラーになる。この非互換性を吸収するために schema を fork した。

## detached HEAD事故パターン

detached HEAD のままコミットすると意図したブランチに反映されない孤立コミットになり、`git push` が「Everything up-to-date」で無言で失敗する。gitlink 参照更新のために `git checkout <SHA>` した後、detached のまま新規開発を続けてしまうのが典型的な事故パターン。

## cwd安全性の事故例

bash の作業ディレクトリはツール呼び出しをまたいで保持されるため、`cd openspec && ...` で移動した後に戻し忘れると、以降のコマンドが誤って openspec/ 側を対象にしてしまう。

特に、`git rev-parse HEAD`（レビュー用のベースコミット記録など）や `superpowers:subagent-driven-development` 付属の `task-brief`/`review-package` スクリプトは `git rev-parse --show-toplevel` で cwd 依存にリポジトリルートを解決するため、cwd が openspec/ 側に残ったままだと以下のような事故につながる:

- ブリーフファイルが `openspec/.superpowers/` 配下に誤って書き込まれる
- レビュー対象のベースコミットが openspec 側の HEAD になり、`review-package` が `Invalid revision range` で失敗する
