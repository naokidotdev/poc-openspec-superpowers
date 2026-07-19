# poc-openspec-superpowers

OpenSpec（要件整理・仕様管理）と Superpowers（実装フェーズの TDD 強制）を組み合わせた PoC リポジトリです。

## リポジトリ構成

- superproject（public, `poc-openspec-superpowers`）: 実装コード（`src/` など）を管理します。
- `openspec/`（private, [`naokidotdev/poc-openspec-superpowers-specs`](https://github.com/naokidotdev/poc-openspec-superpowers-specs)）: superproject に参照される git submodule です。要件整理・仕様（proposal / design / delta specs）はすべてこちら側で管理されます。

役割分担・ブランチ運用・コミットメッセージ規約の詳細なルールは [`CLAUDE.md`](./CLAUDE.md) を参照してください。

## ワークフロー（OpenSpec × Superpowers × 人間）

作業内容が openspec/ 配下のファイル変更を伴うかどうかで、**同期モード**と**単独モード**の2パターンがあります（詳細は [`CLAUDE.md`](./CLAUDE.md) を参照）。

### 同期モード（openspec/ 配下の変更を伴う作業: 仕様追加・変更など）

```mermaid
sequenceDiagram
    actor 人間
    participant OpenSpec as OpenSpec (/opsx:*)
    participant Superpowers as Superpowers (Skill)
    participant GitSuper as Git（superproject）
    participant GitSpecs as Git（openspec/）

    人間->>OpenSpec: 機能要望・仕様変更を相談
    OpenSpec->>GitSuper: develop から feature/{slug} を作成・checkout
    OpenSpec->>GitSpecs: develop から同名の feature/{slug} を作成・checkout
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

    Note over OpenSpec,GitSpecs: 同じfeatureブランチ内でarchiveしてからPRを作成する
    OpenSpec->>GitSpecs: /opsx:archive で変更を確定（main specsへdeltaをマージし、変更フォルダをarchive/へ移動）してコミット

    Note over OpenSpec,GitSpecs: 一区切りのタイミングでまとめて push
    par 実装PRとopenspec側PRは互いのマージを待たずに独立して進行
        OpenSpec->>GitSuper: feature/{slug} を push → 実装PR作成 → develop へマージ
    and
        OpenSpec->>GitSpecs: feature/{slug}（archive済み）を push → PR作成 → develop へマージ
    end

    Note over OpenSpec,GitSuper: openspec側PRのマージ確定後、実装PRとは別のchore PRで対応（実装PRが既にマージ済みでも追加commitできないため）
    OpenSpec->>GitSuper: develop から feature/update-openspec-gitlink-{slug} を作成
    OpenSpec->>GitSuper: gitlink参照更新コミット（openspec/ の参照先を更新）→ push → chore PR作成
    Note over OpenSpec,GitSuper: 機械的な参照更新のみのため、人間のレビューを待たずAgentが即座にマージしてよい
    OpenSpec->>GitSuper: develop へマージ

    Note over 人間,GitSuper: develop → main のリリースマージは人間が判断して実施
```

### 単独モード（openspec/ 配下を変更しない作業: ドキュメント修正など）

```mermaid
sequenceDiagram
    actor 人間
    participant Agent as Claude Code
    participant GitSuper as Git（superproject）

    人間->>Agent: 作業を依頼（openspec/ 配下は変更しない）
    Agent->>GitSuper: develop から feature/{slug} を作成・checkout（openspec/ には変更を加えない）
    Agent->>Agent: 実装・修正
    Agent->>GitSuper: git add/commit（Conventional Commits）
    Agent->>GitSuper: push → PR作成
    人間->>GitSuper: レビュー → develop へマージ

    Note over 人間,GitSuper: develop → main のリリースマージは人間が判断して実施
```

## セットアップ

```bash
git clone --recurse-submodules git@github.com:naokidotdev/poc-openspec-superpowers.git
# 既にcloneしている場合
git submodule update --init --recursive
```

`git config submodule.recurse true` を設定済みのため、以降の `git pull` / `checkout` 等では submodule も自動的に追従します。

`pnpm install` 実行時に `postinstall` スクリプトが `git config core.hooksPath .githooks` を自動設定するため、[`.githooks/`](./.githooks) 配下のフック（`pre-commit` など）が有効になります。`pnpm install` を実行しない場合は手動で同コマンドを実行してください。

## 環境変数（ログイン機能）

`apps/api` はID/パスワードログイン機能のため、以下の環境変数を必須とします。未設定の場合ログインは常に失敗します。

- `AUTH_USER_ID`: ログインID（平文）
- `AUTH_PASSWORD_HASH`: パスワードのハッシュ値（`<saltHex>:<hashHex>` 形式）

このプロジェクトには `.env` を自動読み込みする仕組みは現状ないため（`apps/api` の `dev`/`test` スクリプトはいずれも `dotenv` 等を経由しません）、`apps/api` を起動する際にプロセスの環境変数として直接設定してください（例: `AUTH_USER_ID=... AUTH_PASSWORD_HASH=... pnpm --filter api dev`）。

`AUTH_PASSWORD_HASH` は `apps/api/src/auth/password.ts` の `hashPassword()` を使って生成します（Node 24 のネイティブTypeScriptサポートによりビルド不要、リポジトリルートから実行可能）。

```bash
node --input-type=module -e 'import { hashPassword } from "./apps/api/src/auth/password.ts"; console.log(hashPassword("your-password"))'
```

平文パスワードや生成したハッシュ値を `.env` などのファイルに保存する場合は、誤ってコミットしないよう注意してください。`.env` / `.env.*` は `.gitignore` で除外済みです。

## openspec/ へのコミットについて

`openspec/` 配下のファイルを編集した場合は、必ず `openspec/` を作業ディレクトリとしてコミット・push してください。

```bash
cd openspec
git add .
git commit -m "docs: ..."   # Conventional Commits 形式
git push
cd ..
git add openspec   # gitlink参照(コミットハッシュ)の更新のみを superproject 側にコミット
git commit -m "chore: update openspec submodule reference to merged <change-id> change"
```

上記はシェルを操作する人間向けの例です。Claude Code がこの操作を行う場合は `cd openspec && ...` ではなく `git -C openspec <subcommand>` の形を使うこと、また gitlink 参照更新コミットは実装PRとは別PRにすることなど、詳細なルールは [`CLAUDE.md`](./CLAUDE.md#gitlink-参照更新コミットの-pr) を参照してください。

`openspec/` 配下の実体ファイルが superproject 側に直接コミットされそうになった場合は [`.githooks/pre-commit`](./.githooks/pre-commit) が検知して拒否します。

## GitHub Actions から openspec/ (private submodule) にアクセスする場合の手順（将来対応用）

現時点では `openspec/` にアクセスする GitHub Actions ジョブは存在しません。将来必要になった場合は、以下のいずれかの方法で認証情報を用意し、**人間が** Secrets に登録してください（Claude Code はここでは手順の記載のみ行います）。

### 方法A: Fine-grained Personal Access Token（推奨）

1. GitHub の Settings → Developer settings → Fine-grained tokens で新規トークンを発行する。
    - Repository access: `naokidotdev/poc-openspec-superpowers-specs` のみに限定する。
    - Permissions: `Contents: Read-only`（読み取りのみで十分な場合）。
2. 発行したトークンを、superproject（`poc-openspec-superpowers`）の Settings → Secrets and variables → Actions に `OPENSPEC_SPECS_PAT` という名前で登録する。
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
3. 秘密鍵（`deploy_key`）を superproject の Actions Secrets に `OPENSPEC_SPECS_DEPLOY_KEY` として登録する。
4. ワークフロー側で `webfactory/ssh-agent` などを使い、submodule checkout 前に秘密鍵をロードする。

いずれの方法でも、トークン・秘密鍵は openspec/ への読み取り権限に限定し、superproject 側の Secrets に平文でコミットしないこと。
