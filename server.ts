import express from 'express';
import path from 'node:path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  consumePrincipalBootstrapChallenge,
  evaluateServerAuthorization,
  getBootstrapOwnerEmail,
  getFirebaseProjectId,
  hashVerificationCode,
  isServerBootstrapMarkedComplete,
  issuePrincipalBootstrapChallenge,
  requireVerifiedFirebaseUser,
  validatePasswordStrength,
  verifyHashedCode,
  type AuthenticatedRequest,
  type CollegeActionKey,
  type CollegeModuleKey,
  type CollegeRole,
  type ModulePermissions,
} from './server/security.ts';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  // Basic security headers for API & SPA responses
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Health & non-sensitive configuration status
  app.get('/api/health', (_req, res) => {
    try {
      const projectId = getFirebaseProjectId();
      res.json({
        status: 'ok',
        phase: 1,
        firebaseConfigured: Boolean(projectId),
        serverBootstrapCompleted: isServerBootstrapMarkedComplete(),
      });
    } catch (err) {
      res.status(500).json({
        status: 'error',
        error: err instanceof Error ? err.message : 'Configuration check failed',
      });
    }
  });

  // Password complexity verification (never logs or stores plaintext passwords)
  app.post('/api/security/validate-password', (req, res) => {
    const body = req.body as { password?: unknown; email?: unknown };
    if (typeof body?.password !== 'string') {
      res.status(400).json({ valid: false, score: 0, issues: ['password_required'] });
      return;
    }
    const email = typeof body.email === 'string' ? body.email : undefined;
    const result = validatePasswordStrength(body.password, email);
    res.json(result);
  });

  // Protected: Verify current Firebase ID token on server
  app.get('/api/auth/session', requireVerifiedFirebaseUser, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    res.json({
      uid: user.uid,
      email: user.email ?? null,
      emailVerified: Boolean(user.email_verified),
      isAuthorizedBootstrapOwner: (user.email ?? '').toLowerCase() === getBootstrapOwnerEmail(),
      tokenIssuedAt: user.iat,
    });
  });

  // Protected: Issue one-time Principal setup ceremony challenge
  app.post('/api/bootstrap/issue-ceremony', requireVerifiedFirebaseUser, (req: AuthenticatedRequest, res) => {
    try {
      const user = req.authUser!;
      const email = user.email ?? '';
      const challenge = issuePrincipalBootstrapChallenge(user.uid, email);
      res.json({
        nonce: challenge.nonce,
        expiresAt: challenge.expiresAt,
        authorizedEmail: getBootstrapOwnerEmail(),
      });
    } catch (err) {
      res.status(403).json({
        error: err instanceof Error ? err.message : 'Not authorized for Principal setup.',
      });
    }
  });

  // Protected: Consume one-time Principal setup ceremony challenge
  app.post('/api/bootstrap/confirm-ceremony', requireVerifiedFirebaseUser, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const body = req.body as { nonce?: unknown };
    if (typeof body?.nonce !== 'string' || !body.nonce.trim()) {
      res.status(400).json({ verified: false, error: 'Missing ceremony nonce.' });
      return;
    }
    const verified = consumePrincipalBootstrapChallenge(user.uid, user.email ?? '', body.nonce);
    if (!verified) {
      res.status(403).json({ verified: false, error: 'Invalid, expired, or already used setup challenge.' });
      return;
    }
    res.json({ verified: true });
  });

  // Protected: Hash parent-child verification code using scrypt + CSPRNG salt
  app.post('/api/security/hash-verification-code', requireVerifiedFirebaseUser, (req: AuthenticatedRequest, res) => {
    try {
      const body = req.body as { code?: unknown };
      if (typeof body?.code !== 'string') {
        res.status(400).json({ error: 'Verification code string is required.' });
        return;
      }
      const hash = hashVerificationCode(body.code);
      res.json({ hash });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to hash code.' });
    }
  });

  // Protected: Verify parent-child verification code against stored scrypt hash
  app.post('/api/security/verify-code', requireVerifiedFirebaseUser, (req: AuthenticatedRequest, res) => {
    const body = req.body as { code?: unknown; storedHash?: unknown };
    if (typeof body?.code !== 'string' || typeof body?.storedHash !== 'string') {
      res.status(400).json({ matched: false, error: 'Both code and storedHash are required.' });
      return;
    }
    const matched = verifyHashedCode(body.code, body.storedHash);
    res.json({ matched });
  });

  // Protected: Server-side authorization evaluator (verifies Firebase ID token + RBAC matrix)
  app.post('/api/auth/authorize-action', requireVerifiedFirebaseUser, (req: AuthenticatedRequest, res) => {
    const body = req.body as {
      role?: CollegeRole;
      status?: string;
      modules?: ModulePermissions | null;
      moduleKey?: CollegeModuleKey;
      action?: CollegeActionKey;
      isParentChildVerified?: boolean;
    };

    if (!body?.role || !body?.status || !body?.moduleKey || !body?.action) {
      res.status(400).json({ allowed: false, reason: 'Incomplete authorization check payload.' });
      return;
    }

    const decision = evaluateServerAuthorization({
      role: body.role,
      status: body.status,
      modules: body.modules ?? null,
      moduleKey: body.moduleKey,
      action: body.action,
      isParentChildVerified: body.isParentChildVerified,
    });

    if (!decision.allowed) {
      res.status(403).json(decision);
      return;
    }
    res.json(decision);
  });

  // Vite middleware in dev, static dist/ in production
  if (process.env.NODE_ENV !== 'production') {
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ...(disableHmr ? { ws: false } : {}),
      },
      ...(disableHmr
        ? {
            plugins: [
              {
                name: 'disable-vite-client-ws-when-hmr-off',
                enforce: 'post',
                transform(code, id) {
                  if (id.includes('/vite/dist/client/client.mjs')) {
                    return code
                      .replace(
                        'transport.connect(createHMRHandler(handleMessage));',
                        '/* HMR disabled via DISABLE_HMR=true: skip WebSocket connection */'
                      )
                      .replace(
                        'this.transport.send(payload).catch((err) => {\n\t\t\tthis.logger.error(err);\n\t\t});',
                        'this.transport.send(payload).catch((err) => {\n\t\t\tif (err?.name !== "SendBeforeConnectError") this.logger.error(err);\n\t\t});'
                      );
                  }
                },
              },
            ],
          }
        : {}),
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Al EAMAN Management System server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
