## OpenSpec × Superpowers 役割分担ルール

### 計画フェーズ（要件整理）
- このプロジェクトの要件整理・仕様管理は OpenSpec で行う。
- Superpowers の brainstorming / writing-plans スキルは使用しないこと。
- 機能要望や仕様変更の相談を受けたら、まず /opsx:explore → /opsx:propose の順で対応すること。
- 仕様の成果物（proposal.md, design.md, delta specs）は openspec/ 配下（private submodule）にのみ書き込むこと。

### 実装フェーズ
- /opsx:apply でタスクを実行する際は、タスクを直接実装しないこと。
- 必ず Skill ツールで superpowers:subagent-driven-development を明示的に呼び出し、tasks.md を渡すこと。
- 各タスクは red → green → refactor の順で実装し、テストを書く前にコードを書かないこと。
- 全タスク完了後、Superpowers の requesting-code-review でレビューしてから /opsx:archive に進むこと。
- superpowers:subagent-driven-development の implementer は openspec の tasks.md のチェックボックスを自動更新しない。各タスクのレビューが Approved になったら、コントローラー（このセッション）が対応する tasks.md の `- [ ]` を `- [x]` に更新し、openspec/ を作業ディレクトリとしてコミットすること。

### OpenSpec ↔ Superpowers 統合上の互換性対応
- `openspec/schemas/spec-driven/` に project-local schema を fork 済み。tasks artifact の見出し形式を `## Task N: <Title>` に固定してある（package既定の `## N. Title` のままだと、superpowers:subagent-driven-development の `task-brief` スクリプトが見出しを `Task` という単語でマッチングするため、タスクを検出できずエラーになる）。/opsx:propose で生成される tasks.md はこの schema を使うため、通常通り生成すればそのまま subagent-driven-development に渡してよい。`openspec/schemas/spec-driven/schema.yaml` と `templates/tasks.md` の見出し形式は変更しないこと。

### git操作の注意
- openspec/ 配下のファイルに対して git add / git commit を行う際は、必ず openspec/ を作業ディレクトリとして実行すること（例: cd openspec && git add ... && git commit）。スーパープロジェクトのルートから直接パス指定でコミットしようとしないこと。
- openspec/ の実体ファイルが public リポジトリのステージングに直接追加されようとした場合は、コミット前に必ず人間に確認すること。
