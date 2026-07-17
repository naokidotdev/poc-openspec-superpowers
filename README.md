# poc-openspec-superpowers

OpenSpec（要件整理・仕様管理）と Superpowers（実装フェーズの TDD 強制）を組み合わせた PoC リポジトリです。

## リポジトリ構成

- 本リポジトリ（public）: 実装コード（`src/` など）を管理します。
- `openspec/`: private リポジトリ [`naokidotdev/poc-openspec-superpowers-specs`](https://github.com/naokidotdev/poc-openspec-superpowers-specs) を参照する git submodule です。要件整理・仕様（proposal / design / delta specs）はすべてこちら側で管理されます。

役割分担の詳細なルールは [`CLAUDE.md`](./CLAUDE.md) を参照してください。

## セットアップ

```bash
git clone --recurse-submodules git@github.com:naokidotdev/poc-openspec-superpowers.git
# 既にcloneしている場合
git submodule update --init --recursive
```

`git config submodule.recurse true` を設定済みのため、以降の `git pull` / `checkout` 等では submodule も自動的に追従します。

## openspec/ へのコミットについて

`openspec/` 配下のファイルを編集した場合は、必ず `openspec/` を作業ディレクトリとしてコミット・push してください（private リポジトリ側）。

```bash
cd openspec
git add .
git commit -m "..."
git push
cd ..
git add openspec   # gitlink参照(コミットハッシュ)の更新のみをpublicリポジトリ側にコミット
git commit -m "Update openspec submodule reference"
```

`openspec/` 配下の実体ファイルが public リポジトリ側に直接コミットされそうになった場合は `.git/hooks/pre-commit` が検知して拒否します。

## GitHub Actions から openspec/ (private submodule) にアクセスする場合の手順（将来対応用）

現時点では `openspec/` にアクセスする GitHub Actions ジョブは存在しません。将来必要になった場合は、以下のいずれかの方法で認証情報を用意し、**人間が** Secrets に登録してください（Claude Code はここでは手順の記載のみ行います）。

### 方法A: Fine-grained Personal Access Token（推奨）

1. GitHub の Settings → Developer settings → Fine-grained tokens で新規トークンを発行する。
   - Repository access: `naokidotdev/poc-openspec-superpowers-specs` のみに限定する。
   - Permissions: `Contents: Read-only`（読み取りのみで十分な場合）。
2. 発行したトークンを、本リポジトリ（`poc-openspec-superpowers`）の Settings → Secrets and variables → Actions に `OPENSPEC_SPECS_PAT` という名前で登録する。
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
2. 公開鍵（`deploy_key.pub`）を private リポジトリ `naokidotdev/poc-openspec-superpowers-specs` の Settings → Deploy keys に登録する（Read-only）。
3. 秘密鍵（`deploy_key`）を本リポジトリの Actions Secrets に `OPENSPEC_SPECS_DEPLOY_KEY` として登録する。
4. ワークフロー側で `webfactory/ssh-agent` などを使い、submodule checkout 前に秘密鍵をロードする。

いずれの方法でも、トークン・秘密鍵は private リポジトリへの読み取り権限に限定し、public リポジトリ側の Secrets に平文でコミットしないこと。
