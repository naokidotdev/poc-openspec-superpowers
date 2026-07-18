# poc-openspec-superpowers

OpenSpec（要件整理・仕様管理）と Superpowers（実装フェーズの TDD 強制）を組み合わせた PoC リポジトリです。

## リポジトリ構成

- スーパープロジェクト（public, `poc-openspec-superpowers`）: 実装コード（`src/` など）を管理します。
- `openspec/`（private, [`naokidotdev/poc-openspec-superpowers-specs`](https://github.com/naokidotdev/poc-openspec-superpowers-specs)）: スーパープロジェクトに参照される git submodule です。要件整理・仕様（proposal / design / delta specs）はすべてこちら側で管理されます。

役割分担・ブランチ運用・コミットメッセージ規約の詳細なルールは [`CLAUDE.md`](./CLAUDE.md) を参照してください。

## ワークフロー（OpenSpec × Superpowers × 人間）

作業内容が openspec/ 配下のファイル変更を伴うかどうかで、**同期モード**と**単独モード**の2パターンがあります（詳細は [`CLAUDE.md`](./CLAUDE.md) を参照）。

### 同期モード（openspec/ 配下の変更を伴う作業: 仕様追加・変更など）

```mermaid
sequenceDiagram
    actor 人間
    participant OpenSpec as OpenSpec (/opsx:*)
    participant Superpowers as Superpowers (Skill)
    participant GitSuper as Git（スーパープロジェクト）
    participant GitSpecs as Git（openspec/）

    人間->>OpenSpec: 機能要望・仕様変更を相談
    OpenSpec->>GitSuper: feature/<slug> を作成・checkout
    OpenSpec->>GitSpecs: 同名の feature/<slug> を作成・checkout
    OpenSpec->>OpenSpec: /opsx:explore で要件整理
    OpenSpec->>OpenSpec: /opsx:propose で proposal.md / design.md / delta specs / tasks.md を生成
    OpenSpec->>GitSpecs: git add/commit（openspec/ を作業ディレクトリとして）
    OpenSpec-->>人間: 提案内容を提示
    人間->>OpenSpec: レビュー・承認

    人間->>OpenSpec: /opsx:apply で実装開始を指示
    OpenSpec->>Superpowers: tasks.md を渡す（subagent-driven-development を明示的に呼び出し）
    loop 各タスク
        Superpowers->>Superpowers: red → green → refactor で実装
        Superpowers->>GitSuper: 実装コードをコミット
    end
    Superpowers-->>OpenSpec: 各タスク実装完了・レビュー Approved
    OpenSpec->>GitSpecs: tasks.md の該当チェックボックスを更新してコミット
    OpenSpec->>Superpowers: 全タスク完了後 requesting-code-review を実行
    Superpowers-->>人間: レビュー結果を提示

    Note over OpenSpec,GitSpecs: 一区切りのタイミングでまとめて push
    OpenSpec->>GitSpecs: feature/<slug> を push → PR作成・マージ
    OpenSpec->>GitSuper: gitlink参照更新コミット（openspec/ の参照先を更新）
    OpenSpec->>GitSuper: feature/<slug> を push → PR作成・マージ
    人間->>OpenSpec: /opsx:archive で変更を確定
```

### 単独モード（openspec/ 配下を変更しない作業: ドキュメント修正・リファクタリングなど）

```mermaid
sequenceDiagram
    actor 人間
    participant Agent as Claude Code
    participant GitSuper as Git（スーパープロジェクト）

    人間->>Agent: 作業を依頼（openspec/ 配下は変更しない）
    Agent->>GitSuper: feature/<slug> を作成・checkout（openspec/ は main のまま）
    Agent->>Agent: 実装・修正
    Agent->>GitSuper: git add/commit（Conventional Commits）
    Agent->>GitSuper: push → PR作成
    人間->>GitSuper: レビュー・マージ
```

## セットアップ

```bash
git clone --recurse-submodules git@github.com:naokidotdev/poc-openspec-superpowers.git
# 既にcloneしている場合
git submodule update --init --recursive
```

`git config submodule.recurse true` を設定済みのため、以降の `git pull` / `checkout` 等では submodule も自動的に追従します。

## openspec/ へのコミットについて

`openspec/` 配下のファイルを編集した場合は、必ず `openspec/` を作業ディレクトリとしてコミット・push してください。

```bash
cd openspec
git add .
git commit -m "docs: ..."   # Conventional Commits 形式
git push
cd ..
git add openspec   # gitlink参照(コミットハッシュ)の更新のみをスーパープロジェクト側にコミット
git commit -m "chore: update openspec submodule reference"
```

`openspec/` 配下の実体ファイルがスーパープロジェクト側に直接コミットされそうになった場合は `.git/hooks/pre-commit` が検知して拒否します。

## GitHub Actions から openspec/ (private submodule) にアクセスする場合の手順（将来対応用）

現時点では `openspec/` にアクセスする GitHub Actions ジョブは存在しません。将来必要になった場合は、以下のいずれかの方法で認証情報を用意し、**人間が** Secrets に登録してください（Claude Code はここでは手順の記載のみ行います）。

### 方法A: Fine-grained Personal Access Token（推奨）

1. GitHub の Settings → Developer settings → Fine-grained tokens で新規トークンを発行する。
    - Repository access: `naokidotdev/poc-openspec-superpowers-specs` のみに限定する。
    - Permissions: `Contents: Read-only`（読み取りのみで十分な場合）。
2. 発行したトークンを、スーパープロジェクト（`poc-openspec-superpowers`）の Settings → Secrets and variables → Actions に `OPENSPEC_SPECS_PAT` という名前で登録する。
3. ワークフロー側で submodule checkout 時にトークンを利用する:

    ```yaml
    - uses: actions/checkout@v4
      with:
        submodules: recursive
        token: ${{ secrets.OPENSPEC_SPECS_PAT }}
    ```

    ただし `actions/checkout` の `token` はメインリポジトリの checkout に使われるため、submodule 側の private リポジトリ用には `.gitmodules` の URL 書き換え、もしくは `git config --global url."https://x-access-token:${TOKEN}@github.com/".insteadOf "https://github.com/"` のような設定を別途ステップで行う必要がある。

### 方法B: Deploy Key

1. `ssh-keygen -t ed25519 -f deploy_key -N ""` でキーペアを生成する。
2. 公開鍵（`deploy_key.pub`）を openspec/（`naokidotdev/poc-openspec-superpowers-specs`）の Settings → Deploy keys に登録する（Read-only）。
3. 秘密鍵（`deploy_key`）をスーパープロジェクトの Actions Secrets に `OPENSPEC_SPECS_DEPLOY_KEY` として登録する。
4. ワークフロー側で `webfactory/ssh-agent` などを使い、submodule checkout 前に秘密鍵をロードする。

いずれの方法でも、トークン・秘密鍵は openspec/ への読み取り権限に限定し、スーパープロジェクト側の Secrets に平文でコミットしないこと。
