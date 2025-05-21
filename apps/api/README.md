# SAML SSO サンプルアプリケーション

[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![Passport](https://img.shields.io/badge/Passport-0.7.0-green.svg)](http://www.passportjs.org/)
[![SAML](https://img.shields.io/badge/SAML-2.0-orange.svg)](https://samltool.com)

## 🚀 クイックスタート

### インストール

```bash
# 依存パッケージのインストール
pnpm install
```

### 実行

```bash
pnpm nx serve api
```

サーバーが起動したら、ブラウザで http://localhost:3000/login にアクセスしてSSOフローを開始します。

## ⚙️ 詳細設定

### 1. 証明書設定

IdPの証明書を設定します：

```typescript
// src/cert.ts
export const idpCert = `
-----BEGIN CERTIFICATE-----
IdPから取得した証明書をここに貼り付け
-----END CERTIFICATE-----
`;
```

`src/cert.ts.example` を参考に作成してください。

### 2. IdP側の設定

IdP（Entra IDなど）に以下の情報を登録します：

| 項目 | 値 |
|------|-----|
| Entity ID / Identifier | `urn:my-app` |
| Reply URL / ACS URL | `http://localhost:3000/login/callback` |
| SPメタデータURL | `http://localhost:3000/metadata` |

### 3. アプリケーション設定

`src/main.ts` で以下のSAML設定を環境に合わせて変更します：

```typescript
const samlStrategy = new Strategy(
  {
    entryPoint: 'https://login.microsoftonline.com/[テナントID]/saml2',
    issuer: 'urn:my-app',
    callbackUrl: 'http://localhost:3000/login/callback',
    // 他の設定...
  },
  // ...
);
```
