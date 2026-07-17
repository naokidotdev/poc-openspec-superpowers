# OpenSpec × Superpowers — private要件整理 / public実装の役割分担構築

## 目的

このプロジェクトに、OpenSpec（要件整理・仕様管理）とSuperpowers（実装フェーズのTDD強制）を安全に組み合わせた仕組みを構築してください。

- **要件整理・仕様（proposal / design / delta specs）は private リポジトリで管理する**
- **実装コード（src以下）は現行の public リポジトリに置く**
- 両ツールの役割が重複・衝突しないよう、CLAUDE.mdに明示的な配線ルールを設定する

## 前提条件（実行前に必ず確認すること）

- 対象リポジトリ: `naokidotdev/poc-openspec-superpowers` （public, GitHub）
- 新規作成する仕様専用リポジトリ: `naokidotdev/poc-openspec-superpowers-specs` （private, GitHub）
- GitHub CLI（`gh`）が認証済みであること
- **重要**: もし `openspec/` ディレクトリが既に存在する場合、それが一度でも public リポジトリに push されているかを最初に確認すること。push済みの場合は作業を中断し、内容を人間に報告すること（git historyに残った仕様は削除・書き換えでは完全に消せず、「漏洩したもの」として扱う必要があるため、独断で `git rm --cached` や履歴の書き換えを行わない）

## タスク1: private仕様リポジトリの作成

1. `gh repo create naokidotdev/poc-openspec-superpowers-specs --private` でprivateリポジトリを作成する
2. 空のOpenSpec用ディレクトリ構成（`specs/`, `changes/`）を用意し、初期コミットをpushする

## タスク2: submoduleとしての接続

1. 前提条件の確認が済んだうえで、既存の `openspec/` がpublicリポジトリの追跡下にある場合は `git rm -r --cached openspec` で追跡を外す
2. `git submodule add https://github.com/naokidotdev/poc-openspec-superpowers-specs.git openspec` でsubmoduleとして接続する
3. `.gitmodules` が正しく生成されていることを確認する

## タスク3: OpenSpecの初期化

1. OpenSpecが未導入であればインストールする
2. `openspec init` を実行する
3. `openspec/config.yaml` を作成し、デフォルトschemaを `spec-driven` に設定する

## タスク4: Superpowersの導入

1. `/plugin marketplace add obra/superpowers-marketplace` を実行する
2. `/plugin install superpowers@superpowers-marketplace` を実行する

## タスク5: CLAUDE.mdへの配線ルール追加

プロジェクトルートの `CLAUDE.md` に、以下の内容を追記すること（既存内容がある場合は末尾に追加する）。

```markdown
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
```

## タスク6: 安全装置の設置

1. `.git/hooks/pre-commit`（プロジェクトに既存のフック管理の仕組みがあればそこ）に、`openspec/` 配下の実体ファイルが public リポジトリのステージングに直接追加されようとした場合はコミットを拒否するチェックを追加する（gitlinkとしての参照更新は許可する）
2. `git config submodule.recurse true` をリポジトリ設定に追加する
3. `openspec/` にアクセスする GitHub Actions ジョブが今後必要になった場合に備えて、fine-grained PAT または deploy key を Secrets に登録する手順を README に残す（実際の登録は人間が行うため、Claude Codeはここでは手順の記載のみ行う）

## タスク7: 動作確認

1. ダミーの小さな要件（例：「テスト用のダミー機能」）で `/opsx:explore` → `/opsx:propose` を実行し、成果物が `openspec/changes/` 配下（private repo側）にのみ書き込まれ、publicリポジトリのgit historyに仕様本文が含まれていないことを確認する
2. 承認後 `/opsx:apply` を実行し、`superpowers:subagent-driven-development` が実際に Skill ツール経由で呼び出され、テストファーストの手順が踏まれることを確認する
3. 確認結果を簡潔に報告する

## 実行時の注意

- 破壊的な操作（`git rm --cached`、force pushなど）を行う前には必ず内容を説明し、人間の確認を取ってから実行すること
- 各タスク完了時に簡潔な進捗報告を行うこと
- 不明点や既存構成との矛盾があれば、独断で進めず質問すること
