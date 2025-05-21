import express, { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { VerifiedCallback, Strategy } from 'passport-saml';
import fs from 'fs';
import * as path from 'node:path';
import session from 'express-session';
import { idpCert } from './cert';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: 'YOUR_SESSION_SECRET',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// ─── ユーザーのシリアライズ／デシリアライズ ────────────────────────────
passport.serializeUser((user: Express.User, done) => {
  done(null, user);
});
passport.deserializeUser((user: Express.User, done) => {
  done(null, user);
});

// ─── SAML ストラテジー設定 ──────────────────────────────────────────
const samlStrategy = new Strategy(
  {
    // IdP（Entra ID）側から取得したエンドポイント
    entryPoint:
      'https://login.microsoftonline.com/7e9b0ae3-62c2-412f-8061-ea3e60918a5d/saml2',
    // SP（このアプリ）を一意に示す値
    issuer: 'urn:my-app',
    // Assertion Consumer Service URL
    callbackUrl: 'http://localhost:3000/login/callback',
    // IdP の証明書
    cert: idpCert,
    // 署名検証等のオプション
    validateInResponseTo: true,
    disableRequestedAuthnContext: true,
  },
  // 認証後コールバック
  (profile: any, done: VerifiedCallback) => {
    /*
      profile: SAML アサーションで返ってくる情報。
      必要に応じてユーザー登録や DB への検索などを行う。
    */
    return done(null, profile);
  }
);

passport.use(samlStrategy);

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});
// ─── ルーティング ───────────────────────────────────────────────

// SP メタデータ取得エンドポイント
app.get('/metadata', (req: Request, res: Response) => {
  const metadata = samlStrategy.generateServiceProviderMetadata(
    fs.readFileSync(path.join(__dirname, 'sp_cert.pem'), 'utf-8'),
    fs.readFileSync(path.join(__dirname, 'sp_key.pem'), 'utf-8')
  );
  res.type('application/xml').send(metadata);
});

// SSO ログイン開始
app.get(
  '/login',
  passport.authenticate('saml', {
    failureRedirect: '/',
  }),
  (_req, res) => {
    res.redirect('/');
  }
);

// Assertion Consumer Service (ACS)
app.post(
  '/login/callback',
  passport.authenticate('saml', {
    failureRedirect: '/',
  }),
  (req: Request, res: Response) => {
    // 認証成功後のリダイレクト先
    res.redirect('/protected');
  }
);

// 保護されたルート
app.get('/protected', (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.send(`Hello ${(req.user as any).nameID}! SAML 認証成功`);
  } else {
    res.redirect('/login');
  }
});

// ログアウト
app.get('/logout', (req: Request, res: Response) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// ルート
app.get('/', (_req, res) => {
  res.send('<a href="/login">Login via SAML</a>');
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
