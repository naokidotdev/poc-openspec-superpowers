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

### git操作の注意
- openspec/ 配下のファイルに対して git add / git commit を行う際は、必ず openspec/ を作業ディレクトリとして実行すること（例: cd openspec && git add ... && git commit）。スーパープロジェクトのルートから直接パス指定でコミットしようとしないこと。
- openspec/ の実体ファイルが public リポジトリのステージングに直接追加されようとした場合は、コミット前に必ず人間に確認すること。
