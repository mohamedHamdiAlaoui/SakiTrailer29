import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import admin from 'firebase-admin';
import multer from 'multer';
import { randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = Number(process.env.PORT || process.env.AUTH_API_PORT || 4000);
const allowedOrigins = (process.env.AUTH_API_ALLOWED_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const databasePath = process.env.PRODUCTS_DB_PATH || path.join(__dirname, 'data', 'sakitrailer29.sqlite');
const uploadsRoot = path.join(path.dirname(databasePath), 'uploads');
const imageUploadsDirectory = path.join(uploadsRoot, 'images');
const catalogueUploadsDirectory = path.join(uploadsRoot, 'catalogues');

const adminSeedEmail = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
const adminSeedPassword = process.env.ADMIN_SEED_PASSWORD?.trim();
const adminSeedUser =
  adminSeedEmail && adminSeedPassword
    ? {
        id: process.env.ADMIN_SEED_ID || 'admin-001',
        fullName: process.env.ADMIN_SEED_FULL_NAME || 'SakiTrailer29 Admin',
        email: adminSeedEmail,
        password: adminSeedPassword,
        role: 'admin',
        authProvider: 'credentials',
      }
    : null;

const orderStatuses = new Set(['created', 'assigned', 'in_progress', 'ready', 'delivered', 'cancelled']);
const leadPreferredContacts = new Set(['phone', 'whatsapp', 'email']);
const productTransmissionTypes = new Set(['manual', 'automatic', 'semi-automatic']);

mkdirSync(path.dirname(databasePath), { recursive: true });
mkdirSync(imageUploadsDirectory, { recursive: true });
mkdirSync(catalogueUploadsDirectory, { recursive: true });

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => callback(null, imageUploadsDirectory),
    filename: (_request, file, callback) => {
      const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
      callback(null, `${Date.now()}-${randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
    const isImage = file.mimetype.startsWith('image/') || allowedExtensions.has(extension);
    callback(null, isImage);
  },
});

const catalogueUpload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => callback(null, catalogueUploadsDirectory),
    filename: (_request, file, callback) => {
      const extension = path.extname(file.originalname || '').toLowerCase() || '.pdf';
      callback(null, `${Date.now()}-${randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const isPdf = file.mimetype === 'application/pdf' || path.extname(file.originalname || '').toLowerCase() === '.pdf';
    callback(null, isPdf);
  },
});

const database = new DatabaseSync(databasePath);
database.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    product_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at DESC);

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    company_name TEXT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
    auth_provider TEXT NOT NULL DEFAULT 'credentials',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    last_used_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    product_id TEXT,
    notes TEXT,
    status TEXT NOT NULL CHECK(status IN ('created', 'assigned', 'in_progress', 'ready', 'delivered', 'cancelled')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    message TEXT NOT NULL,
    preferred_contact TEXT NOT NULL CHECK(preferred_contact IN ('phone', 'whatsapp', 'email')),
    language TEXT,
    page_url TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_leads_product_id ON leads(product_id);
`);

// Simple migration for adding new columns to existing tables
try {
  database.exec("ALTER TABLE users ADD COLUMN company_name TEXT;");
} catch (error) {
  // Ignore if column already exists
  if (!error.message.includes('duplicate column name')) {
    console.warn('[db] Note: company_name column may already exist or error:', error.message);
  }
}

const getAllProductsStatement = database.prepare(`
  SELECT id, product_json, created_at, updated_at
  FROM products
  ORDER BY datetime(updated_at) DESC;
`);
const getProductByIdStatement = database.prepare(`
  SELECT id, product_json, created_at, updated_at
  FROM products
  WHERE id = ?;
`);
const insertProductStatement = database.prepare(`
  INSERT INTO products (id, product_json, created_at, updated_at)
  VALUES (?, ?, ?, ?);
`);
const updateProductStatement = database.prepare(`
  UPDATE products
  SET product_json = ?, updated_at = ?
  WHERE id = ?;
`);
const upsertProductStatement = database.prepare(`
  INSERT INTO products (id, product_json, created_at, updated_at)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    product_json = excluded.product_json,
    updated_at = excluded.updated_at;
`);
const deleteProductStatement = database.prepare(`
  DELETE FROM products
  WHERE id = ?;
`);
const countProductsStatement = database.prepare(`
  SELECT COUNT(*) AS count
  FROM products;
`);

const getUserByIdStatement = database.prepare(`
  SELECT id, full_name, company_name, email, password_hash, role, auth_provider, created_at, updated_at
  FROM users
  WHERE id = ?;
`);
const getUserByEmailStatement = database.prepare(`
  SELECT id, full_name, company_name, email, password_hash, role, auth_provider, created_at, updated_at
  FROM users
  WHERE email = ?;
`);
const getUsersByRoleStatement = database.prepare(`
  SELECT id, full_name, company_name, email, password_hash, role, auth_provider, created_at, updated_at
  FROM users
  WHERE role = ?
  ORDER BY datetime(created_at) DESC;
`);
const getAllUsersStatement = database.prepare(`
  SELECT id, full_name, company_name, email, password_hash, role, auth_provider, created_at, updated_at
  FROM users
  ORDER BY datetime(created_at) DESC;
`);
const insertUserStatement = database.prepare(`
  INSERT INTO users (id, full_name, company_name, email, password_hash, role, auth_provider, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
`);
const deleteUserStatement = database.prepare(`
  DELETE FROM users
  WHERE id = ?;
`);
const countAdminsStatement = database.prepare(`
  SELECT COUNT(*) AS count
  FROM users
  WHERE role = 'admin';
`);
const updateUserProfileStatement = database.prepare(`
  UPDATE users
  SET full_name = ?, company_name = ?, auth_provider = ?, updated_at = ?
  WHERE id = ?;
`);

const insertSessionStatement = database.prepare(`
  INSERT INTO sessions (token, user_id, created_at, last_used_at)
  VALUES (?, ?, ?, ?);
`);
const getSessionStatement = database.prepare(`
  SELECT
    sessions.token AS token,
    sessions.user_id AS session_user_id,
    sessions.created_at AS session_created_at,
    sessions.last_used_at AS session_last_used_at,
    users.id AS user_id,
    users.full_name AS user_full_name,
    users.company_name AS user_company_name,
    users.email AS user_email,
    users.role AS user_role,
    users.auth_provider AS user_auth_provider,
    users.created_at AS user_created_at,
    users.updated_at AS user_updated_at
  FROM sessions
  INNER JOIN users ON users.id = sessions.user_id
  WHERE sessions.token = ?;
`);
const updateSessionLastUsedStatement = database.prepare(`
  UPDATE sessions
  SET last_used_at = ?
  WHERE token = ?;
`);
const deleteSessionStatement = database.prepare(`
  DELETE FROM sessions
  WHERE token = ?;
`);

const baseOrderSelect = `
  SELECT
    orders.id AS id,
    orders.order_number AS order_number,
    orders.user_id AS user_id,
    orders.product_id AS product_id,
    orders.notes AS notes,
    orders.status AS status,
    orders.created_at AS created_at,
    orders.updated_at AS updated_at,
    users.full_name AS user_name,
    users.email AS user_email
  FROM orders
  LEFT JOIN users ON users.id = orders.user_id
`;

const getAllOrdersStatement = database.prepare(`
  ${baseOrderSelect}
  ORDER BY datetime(orders.updated_at) DESC;
`);
const getOrdersByUserIdStatement = database.prepare(`
  ${baseOrderSelect}
  WHERE orders.user_id = ?
  ORDER BY datetime(orders.updated_at) DESC;
`);
const getOrderByIdStatement = database.prepare(`
  ${baseOrderSelect}
  WHERE orders.id = ?;
`);
const getOrderByNumberStatement = database.prepare(`
  ${baseOrderSelect}
  WHERE orders.order_number = ?;
`);
const insertOrderStatement = database.prepare(`
  INSERT INTO orders (id, order_number, user_id, product_id, notes, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?);
`);
const updateOrderStatement = database.prepare(`
  UPDATE orders
  SET order_number = ?, user_id = ?, product_id = ?, notes = ?, status = ?, updated_at = ?
  WHERE id = ?;
`);
const getAllLeadsStatement = database.prepare(`
  SELECT id, product_id, full_name, phone, email, message, preferred_contact, language, page_url, created_at
  FROM leads
  ORDER BY datetime(created_at) DESC;
`);
const insertLeadStatement = database.prepare(`
  INSERT INTO leads (id, product_id, full_name, phone, email, message, preferred_contact, language, page_url, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
`);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeOptionalString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function createPasswordHash(password) {
  const salt = randomUUID();
  const derivedKey = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') {
    return false;
  }

  const [salt, originalHash] = storedHash.split(':');
  if (!salt || !originalHash) {
    return false;
  }

  const incomingBuffer = scryptSync(password, salt, 64);
  const originalBuffer = Buffer.from(originalHash, 'hex');

  if (incomingBuffer.length !== originalBuffer.length) {
    return false;
  }

  return timingSafeEqual(incomingBuffer, originalBuffer);
}

function toPublicUser(userRow) {
  if (!userRow) {
    return null;
  }

  return {
    id: userRow.id,
    fullName: userRow.full_name ?? userRow.user_full_name,
    companyName: userRow.company_name ?? userRow.user_company_name,
    email: userRow.email ?? userRow.user_email,
    role: userRow.role ?? userRow.user_role,
  };
}

function parseOrderRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id ?? undefined,
    userName: row.user_name ?? undefined,
    userEmail: row.user_email ?? undefined,
    productId: row.product_id ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeOrderNumber(orderNumber) {
  return typeof orderNumber === 'string' ? orderNumber.trim().toUpperCase() : '';
}

function isValidOrderStatus(status) {
  return typeof status === 'string' && orderStatuses.has(status);
}

function isValidLeadPreferredContact(preferredContact) {
  return typeof preferredContact === 'string' && leadPreferredContacts.has(preferredContact);
}

function isValidProductPayload(product) {
  if (!product || typeof product !== 'object') return false;
  if (!isNonEmptyString(product.id)) return false;
  if (!isNonEmptyString(product.title)) return false;
  if (!isNonEmptyString(product.category)) return false;
  if (product.category === 'other' && !isNonEmptyString(product.customCategoryName)) return false;
  if (product.category === 'other' && product.stockType === 'new') return false;
  if (!isNonEmptyString(product.brand)) return false;
  if (!Array.isArray(product.images)) return false;
  if (typeof product.price !== 'number' || Number.isNaN(product.price)) return false;
  if (typeof product.year !== 'number' || Number.isNaN(product.year)) return false;
  if (product.modelYear !== undefined && (typeof product.modelYear !== 'number' || Number.isNaN(product.modelYear))) return false;
  if (product.transmission !== undefined && !productTransmissionTypes.has(product.transmission)) return false;
  if (!isNonEmptyString(product.status)) return false;
  if (product.catalogues !== undefined && !Array.isArray(product.catalogues)) return false;
  return true;
}

function normalizeProductForStorage(product, createdAtOverride) {
  const createdAt = createdAtOverride || (isNonEmptyString(product.createdAt) ? product.createdAt : new Date().toISOString());
  const normalizedCategory = product.category.trim();
  const normalizedCustomCategoryName =
    normalizedCategory === 'other' ? normalizeOptionalString(product.customCategoryName) : undefined;

  return {
    ...product,
    id: product.id.trim(),
    title: product.title.trim(),
    brand: product.brand.trim(),
    category: normalizedCategory,
    customCategoryName: normalizedCustomCategoryName,
    modelYear: typeof product.modelYear === 'number' ? product.modelYear : undefined,
    transmission: productTransmissionTypes.has(product.transmission) ? product.transmission : undefined,
    images: product.images.map((image) => String(image).trim()).filter(Boolean),
    catalogues: Array.isArray(product.catalogues) 
      ? product.catalogues.filter((cat) => cat && typeof cat.name === 'string' && typeof cat.url === 'string')
      : undefined,
    createdAt,
  };
}

function parseProductRow(row) {
  try {
    const parsed = JSON.parse(row.product_json);
    return {
      ...parsed,
      id: parsed.id ?? row.id,
      createdAt: parsed.createdAt ?? row.created_at,
    };
  } catch {
    return null;
  }
}

function parseLeadRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    productId: row.product_id ?? undefined,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email ?? undefined,
    message: row.message,
    preferredContact: row.preferred_contact,
    language: row.language ?? undefined,
    pageUrl: row.page_url ?? undefined,
    createdAt: row.created_at,
  };
}

function getAllProductsFromDatabase() {
  return getAllProductsStatement
    .all()
    .map((row) => parseProductRow(row))
    .filter((product) => product !== null);
}

function createSessionForUser(userId) {
  const now = new Date().toISOString();
  const token = `${randomUUID()}${randomUUID().replace(/-/g, '')}`;
  insertSessionStatement.run(token, userId, now, now);
  return token;
}

function getAuthTokenFromRequest(request) {
  const authorization = request.headers.authorization;
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim();
  }

  const fallbackToken = request.headers['x-session-token'];
  return typeof fallbackToken === 'string' ? fallbackToken.trim() : '';
}

function getAuthContext(request) {
  const token = getAuthTokenFromRequest(request);
  if (!token) {
    return null;
  }

  const sessionRow = getSessionStatement.get(token);
  if (!sessionRow) {
    return null;
  }

  updateSessionLastUsedStatement.run(new Date().toISOString(), token);

  return {
    token,
    user: toPublicUser({
      id: sessionRow.user_id,
      full_name: sessionRow.user_full_name,
      company_name: sessionRow.user_company_name,
      email: sessionRow.user_email,
      role: sessionRow.user_role,
    }),
  };
}

function requireAuth(request, response) {
  const authContext = getAuthContext(request);
  if (!authContext?.user) {
    response.status(401).json({ success: false, error: 'unauthorized' });
    return null;
  }

  return authContext;
}

function requireAdmin(request, response) {
  const authContext = requireAuth(request, response);
  if (!authContext) {
    return null;
  }

  if (authContext.user.role !== 'admin') {
    response.status(403).json({ success: false, error: 'forbidden' });
    return null;
  }

  return authContext;
}

function ensureAdminSeedUser() {
  if (!adminSeedUser) {
    return;
  }

  const existingAdmin = getUserByEmailStatement.get(adminSeedUser.email);
  if (existingAdmin) {
    return;
  }

  const now = new Date().toISOString();
  insertUserStatement.run(
    adminSeedUser.id,
    adminSeedUser.fullName,
    null,
    adminSeedUser.email,
    createPasswordHash(adminSeedUser.password),
    adminSeedUser.role,
    adminSeedUser.authProvider,
    now,
    now
  );
}

function createUser({ fullName, companyName, email, password, role = 'user', authProvider = 'credentials' }) {
  const now = new Date().toISOString();
  const userId = `user-${randomUUID()}`;
  const passwordHash = password ? createPasswordHash(password) : null;

  insertUserStatement.run(
    userId,
    fullName.trim(),
    companyName?.trim() || null,
    normalizeEmail(email),
    passwordHash,
    role,
    authProvider,
    now,
    now
  );

  return getUserByIdStatement.get(userId);
}

function syncGoogleUser({ email, fullName }) {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = getUserByEmailStatement.get(normalizedEmail);
  const normalizedFullName = isNonEmptyString(fullName) ? fullName.trim() : normalizedEmail.split('@')[0] || 'Google User';

  if (!existingUser) {
    return createUser({
      fullName: normalizedFullName,
      companyName: null, // Google tokens do not include companyName
      email: normalizedEmail,
      password: null,
      role: 'user',
      authProvider: 'google',
    });
  }

  const shouldUpdate =
    existingUser.full_name !== normalizedFullName || existingUser.auth_provider !== 'google';

  if (shouldUpdate) {
    updateUserProfileStatement.run(normalizedFullName, existingUser.company_name, 'google', new Date().toISOString(), existingUser.id);
  }

  return getUserByIdStatement.get(existingUser.id);
}

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const firebaseServiceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();

function loadServiceAccountFromFile() {
  if (!firebaseServiceAccountPath) {
    return null;
  }

  const resolvedPath = path.isAbsolute(firebaseServiceAccountPath)
    ? firebaseServiceAccountPath
    : path.resolve(process.cwd(), firebaseServiceAccountPath);

  try {
    const rawFile = readFileSync(resolvedPath, 'utf8');
    const parsed = JSON.parse(rawFile);

    if (
      !isNonEmptyString(parsed.project_id) ||
      !isNonEmptyString(parsed.client_email) ||
      !isNonEmptyString(parsed.private_key)
    ) {
      return { error: 'firebase_service_account_invalid' };
    }

    return {
      credentials: {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      },
      error: null,
    };
  } catch {
    return { error: 'firebase_service_account_read_failed' };
  }
}

function initializeFirebaseAdmin() {
  const serviceAccountFile = loadServiceAccountFromFile();
  if (serviceAccountFile?.credentials) {
    try {
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountFile.credentials),
        });
      }

      return { auth: admin.auth(), error: null };
    } catch {
      return { auth: null, error: 'firebase_admin_init_failed' };
    }
  }

  if (serviceAccountFile?.error) {
    return { auth: null, error: serviceAccountFile.error };
  }

  if (!firebaseProjectId || !firebaseClientEmail || !firebasePrivateKey) {
    return { auth: null, error: 'firebase_admin_not_configured' };
  }

  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseProjectId,
          clientEmail: firebaseClientEmail,
          privateKey: firebasePrivateKey,
        }),
      });
    }

    return { auth: admin.auth(), error: null };
  } catch {
    return { auth: null, error: 'firebase_admin_init_failed' };
  }
}

ensureAdminSeedUser();

const firebase = initializeFirebaseAdmin();
const app = express();

app.set('trust proxy', true);

app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server requests and health checks that do not send Origin.
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  })
);
app.use('/uploads', express.static(uploadsRoot));
app.use(express.json({ limit: '50mb' }));

function buildAbsoluteUrl(request, pathname) {
  return `${request.protocol}://${request.get('host')}${pathname}`;
}

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    firebaseReady: Boolean(firebase.auth),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/auth/session', (request, response) => {
  const authContext = requireAuth(request, response);
  if (!authContext) {
    return;
  }

  response.json({ success: true, user: authContext.user });
});

app.post('/api/auth/login', (request, response) => {
  const email = normalizeEmail(request.body?.email);
  const password = typeof request.body?.password === 'string' ? request.body.password : '';

  if (!email || !password) {
    response.status(400).json({ success: false, error: 'missing_credentials' });
    return;
  }

  const userRow = getUserByEmailStatement.get(email);
  if (!userRow || !verifyPassword(password, userRow.password_hash)) {
    response.status(401).json({ success: false, error: 'invalid_credentials' });
    return;
  }

  const sessionToken = createSessionForUser(userRow.id);
  response.json({ success: true, user: toPublicUser(userRow), sessionToken });
});

app.post('/api/auth/signup', (request, response) => {
  const fullName = typeof request.body?.fullName === 'string' ? request.body.fullName.trim() : '';
  const companyName = typeof request.body?.companyName === 'string' ? request.body.companyName.trim() : null;
  const email = normalizeEmail(request.body?.email);
  const password = typeof request.body?.password === 'string' ? request.body.password : '';

  if (!fullName || !email || password.length < 6) {
    response.status(400).json({ success: false, error: 'invalid_signup_payload' });
    return;
  }

  const existingUser = getUserByEmailStatement.get(email);
  if (existingUser) {
    response.status(409).json({ success: false, error: 'email_exists' });
    return;
  }

  const userRow = createUser({ fullName, companyName, email, password, role: 'user', authProvider: 'credentials' });
  const sessionToken = createSessionForUser(userRow.id);

  response.status(201).json({ success: true, user: toPublicUser(userRow), sessionToken });
});

app.post('/api/auth/logout', (request, response) => {
  const authContext = requireAuth(request, response);
  if (!authContext) {
    return;
  }

  deleteSessionStatement.run(authContext.token);
  response.json({ success: true });
});

app.get('/api/admin/analytics', (request, response) => {
  const authContext = requireAdmin(request, response);
  if (!authContext) return;

  const totalUsers = database.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get();
  const totalProducts = database.prepare("SELECT COUNT(*) as count FROM products").get();
  const totalOrders = database.prepare("SELECT COUNT(*) as count FROM orders").get();
  const activeOrders = database.prepare("SELECT COUNT(*) as count FROM orders WHERE status NOT IN ('delivered', 'cancelled')").get();
  const availableProducts = database
    .prepare("SELECT COUNT(*) as count FROM products WHERE json_extract(product_json, '$.status') = 'available'")
    .get();
  const totalLeads = database.prepare('SELECT COUNT(*) as count FROM leads').get();

  response.json({
    success: true,
    analytics: {
      totalUsers: totalUsers?.count ?? 0,
      totalProducts: totalProducts?.count ?? 0,
      totalOrders: totalOrders?.count ?? 0,
      activeOrders: activeOrders?.count ?? 0,
      availableProducts: availableProducts?.count ?? 0,
      totalLeads: totalLeads?.count ?? 0,
    },
  });
});

app.get('/api/leads', (request, response) => {
  const authContext = requireAdmin(request, response);
  if (!authContext) {
    return;
  }

  response.json({
    success: true,
    leads: getAllLeadsStatement.all().map((row) => parseLeadRow(row)).filter(Boolean),
  });
});

app.post('/api/leads', (request, response) => {
  const fullName = typeof request.body?.fullName === 'string' ? request.body.fullName.trim() : '';
  const phone = typeof request.body?.phone === 'string' ? request.body.phone.trim() : '';
  const email = normalizeOptionalString(request.body?.email);
  const message = typeof request.body?.message === 'string' ? request.body.message.trim() : '';
  const preferredContact = request.body?.preferredContact;
  const productId = normalizeOptionalString(request.body?.productId);
  const language = normalizeOptionalString(request.body?.language);
  const pageUrl = normalizeOptionalString(request.body?.pageUrl);

  if (!fullName || !phone || message.length < 10 || !isValidLeadPreferredContact(preferredContact)) {
    response.status(400).json({ success: false, error: 'invalid_lead_payload' });
    return;
  }

  const leadId = `lead-${randomUUID()}`;
  const createdAt = new Date().toISOString();
  insertLeadStatement.run(
    leadId,
    productId ?? null,
    fullName,
    phone,
    email ?? null,
    message,
    preferredContact,
    language ?? null,
    pageUrl ?? null,
    createdAt
  );

  response.status(201).json({
    success: true,
    lead: {
      id: leadId,
      productId,
      fullName,
      phone,
      email,
      message,
      preferredContact,
      language,
      pageUrl,
      createdAt,
    },
  });
});

app.post(
  '/api/uploads/images',
  (request, response, next) => {
    const authContext = requireAdmin(request, response);
    if (!authContext) {
      return;
    }

    next();
  },
  (request, response, next) => {
    imageUpload.single('image')(request, response, (error) => {
      if (!error) {
        next();
        return;
      }

      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        response.status(400).json({ success: false, error: 'image_too_large' });
        return;
      }

      response.status(400).json({ success: false, error: 'image_upload_failed' });
    });
  },
  (request, response) => {
    if (!request.file) {
      response.status(400).json({ success: false, error: 'missing_image_file' });
      return;
    }

    const publicPath = `/uploads/images/${request.file.filename}`;
    response.status(201).json({
      success: true,
      file: {
        name: request.file.originalname,
        url: buildAbsoluteUrl(request, publicPath),
      },
    });
  }
);

app.post(
  '/api/uploads/catalogues',
  (request, response, next) => {
    const authContext = requireAdmin(request, response);
    if (!authContext) {
      return;
    }

    next();
  },
  (request, response, next) => {
    catalogueUpload.single('catalogue')(request, response, (error) => {
      if (!error) {
        next();
        return;
      }

      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        response.status(400).json({ success: false, error: 'catalogue_too_large' });
        return;
      }

      response.status(400).json({ success: false, error: 'catalogue_upload_failed' });
    });
  },
  (request, response) => {
    if (!request.file) {
      response.status(400).json({ success: false, error: 'missing_catalogue_file' });
      return;
    }

    const publicPath = `/uploads/catalogues/${request.file.filename}`;
    response.status(201).json({
      success: true,
      file: {
        name: request.file.originalname,
        url: buildAbsoluteUrl(request, publicPath),
      },
    });
  }
);

app.get('/api/users', (request, response) => {
  const authContext = requireAdmin(request, response);
  if (!authContext) {
    return;
  }

  const roleFilter = typeof request.query.role === 'string' ? request.query.role.trim() : '';
  const userRows = roleFilter ? getUsersByRoleStatement.all(roleFilter) : getAllUsersStatement.all();
  response.json({
    success: true,
    users: userRows.map((userRow) => toPublicUser(userRow)).filter(Boolean),
  });
});

app.post('/api/admin/users', (request, response) => {
  const authContext = requireAdmin(request, response);
  if (!authContext) {
    return;
  }

  const fullName = typeof request.body?.fullName === 'string' ? request.body.fullName.trim() : '';
  const email = normalizeEmail(request.body?.email);
  const password = typeof request.body?.password === 'string' ? request.body.password : '';

  if (!fullName || !email || password.length < 6) {
    response.status(400).json({ success: false, error: 'invalid_admin_payload' });
    return;
  }

  const existingUser = getUserByEmailStatement.get(email);
  if (existingUser) {
    response.status(409).json({ success: false, error: 'email_exists' });
    return;
  }

  const userRow = createUser({
    fullName,
    companyName: null,
    email,
    password,
    role: 'admin',
    authProvider: 'credentials',
  });

  response.status(201).json({ success: true, user: toPublicUser(userRow) });
});

app.delete('/api/admin/users/:userId', (request, response) => {
  const authContext = requireAdmin(request, response);
  if (!authContext) {
    return;
  }

  const userId = typeof request.params.userId === 'string' ? request.params.userId.trim() : '';
  if (!userId) {
    response.status(400).json({ success: false, error: 'invalid_user_id' });
    return;
  }

  if (userId === authContext.user.id) {
    response.status(400).json({ success: false, error: 'cannot_delete_current_admin' });
    return;
  }

  const userRow = getUserByIdStatement.get(userId);
  if (!userRow) {
    response.status(404).json({ success: false, error: 'user_not_found' });
    return;
  }

  if (userRow.role !== 'admin') {
    response.status(400).json({ success: false, error: 'user_not_admin' });
    return;
  }

  if (adminSeedUser && (userRow.id === adminSeedUser.id || userRow.email === adminSeedUser.email)) {
    response.status(400).json({ success: false, error: 'cannot_delete_seed_admin' });
    return;
  }

  const adminCount = countAdminsStatement.get();
  if ((adminCount?.count ?? 0) <= 1) {
    response.status(400).json({ success: false, error: 'cannot_delete_last_admin' });
    return;
  }

  deleteUserStatement.run(userId);
  response.json({ success: true });
});

app.put('/api/users/profile', (request, response) => {
  const authContext = requireAuth(request, response);
  if (!authContext) {
    return;
  }

  const fullName = typeof request.body?.fullName === 'string' ? request.body.fullName.trim() : '';
  const companyName = typeof request.body?.companyName === 'string' ? request.body.companyName.trim() : null;

  if (!fullName) {
    response.status(400).json({ success: false, error: 'invalid_profile_payload' });
    return;
  }

  const userRow = getUserByIdStatement.get(authContext.user.id);
  if (!userRow) {
    response.status(404).json({ success: false, error: 'user_not_found' });
    return;
  }

  updateUserProfileStatement.run(fullName, companyName, userRow.auth_provider, new Date().toISOString(), authContext.user.id);

  const updatedUserRow = getUserByIdStatement.get(authContext.user.id);
  response.json({ success: true, user: toPublicUser(updatedUserRow) });
});

app.delete('/api/users/profile', (request, response) => {
  const authContext = requireAuth(request, response);
  if (!authContext) {
    return;
  }

  try {
    const userId = authContext.user.id;
    
    // Unassign orders assigned to this user instead of deleting the orders
    database.exec(`UPDATE orders SET user_id = NULL WHERE user_id = '${userId}'`);
    
    // Delete the user (this cascades to sessions automatically due to schema)
    const stmt = database.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(userId);
    
    response.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    response.status(500).json({ success: false, error: 'internal_server_error' });
  }
});

app.get('/api/products', (_request, response) => {
  response.json({ success: true, products: getAllProductsFromDatabase() });
});

app.post('/api/products/bootstrap', (request, response) => {
  const existingCount = Number(countProductsStatement.get()?.count ?? 0);
  if (existingCount > 0) {
    response.json({ success: true, products: getAllProductsFromDatabase() });
    return;
  }

  const products = Array.isArray(request.body?.products) ? request.body.products : [];
  if (products.length === 0) {
    response.status(400).json({ success: false, error: 'missing_products' });
    return;
  }

  const now = new Date().toISOString();
  for (const product of products) {
    if (!isValidProductPayload(product)) {
      continue;
    }

    const normalizedProduct = normalizeProductForStorage(product);
    upsertProductStatement.run(
      normalizedProduct.id,
      JSON.stringify(normalizedProduct),
      normalizedProduct.createdAt,
      now
    );
  }

  response.json({ success: true, products: getAllProductsFromDatabase() });
});

app.post('/api/products', (request, response) => {
  const authContext = requireAdmin(request, response);
  if (!authContext) {
    return;
  }

  const product = request.body?.product;
  if (!isValidProductPayload(product)) {
    response.status(400).json({ success: false, error: 'invalid_product_payload' });
    return;
  }

  const normalizedProduct = normalizeProductForStorage(product);
  const existing = getProductByIdStatement.get(normalizedProduct.id);
  if (existing) {
    response.status(409).json({ success: false, error: 'product_id_exists' });
    return;
  }

  const now = new Date().toISOString();
  insertProductStatement.run(
    normalizedProduct.id,
    JSON.stringify(normalizedProduct),
    normalizedProduct.createdAt,
    now
  );

  response.status(201).json({ success: true, product: normalizedProduct });
});

app.put('/api/products/:id', (request, response) => {
  const authContext = requireAdmin(request, response);
  if (!authContext) {
    return;
  }

  const productId = request.params.id;
  const product = request.body?.product;

  if (!isValidProductPayload(product)) {
    response.status(400).json({ success: false, error: 'invalid_product_payload' });
    return;
  }

  if (product.id !== productId) {
    response.status(400).json({ success: false, error: 'product_id_mismatch' });
    return;
  }

  const existingRow = getProductByIdStatement.get(productId);
  if (!existingRow) {
    response.status(404).json({ success: false, error: 'product_not_found' });
    return;
  }

  const existingProduct = parseProductRow(existingRow);
  const normalizedProduct = normalizeProductForStorage(product, existingProduct?.createdAt || existingRow.created_at);
  updateProductStatement.run(JSON.stringify(normalizedProduct), new Date().toISOString(), productId);

  response.json({ success: true, product: normalizedProduct });
});

app.delete('/api/products/:id', (request, response) => {
  const authContext = requireAdmin(request, response);
  if (!authContext) {
    return;
  }

  const result = deleteProductStatement.run(request.params.id);
  if ((result?.changes ?? 0) === 0) {
    response.status(404).json({ success: false, error: 'product_not_found' });
    return;
  }

  response.json({ success: true });
});

app.get('/api/orders', (request, response) => {
  const authContext = requireAuth(request, response);
  if (!authContext) {
    return;
  }

  const rows = authContext.user.role === 'admin'
    ? getAllOrdersStatement.all()
    : getOrdersByUserIdStatement.all(authContext.user.id);

  response.json({
    success: true,
    orders: rows.map((row) => parseOrderRow(row)).filter(Boolean),
  });
});

app.post('/api/orders', (request, response) => {
  const authContext = requireAdmin(request, response);
  if (!authContext) {
    return;
  }

  const orderNumber = normalizeOrderNumber(request.body?.orderNumber);
  const userId = request.body?.userId === null ? null : normalizeOptionalString(request.body?.userId);
  const productId = normalizeOptionalString(request.body?.productId);
  const notes = normalizeOptionalString(request.body?.notes);
  const status = request.body?.status;

  if (!orderNumber) {
    response.status(400).json({ success: false, error: 'invalid_order_number' });
    return;
  }

  if (!isValidOrderStatus(status)) {
    response.status(400).json({ success: false, error: 'invalid_order_status' });
    return;
  }

  if (getOrderByNumberStatement.get(orderNumber)) {
    response.status(409).json({ success: false, error: 'duplicate_order_number' });
    return;
  }

  let assignedUser = null;
  if (userId) {
    assignedUser = getUserByIdStatement.get(userId);
    if (!assignedUser) {
      response.status(404).json({ success: false, error: 'user_not_found' });
      return;
    }
  }

  const now = new Date().toISOString();
  const orderId = `order-${randomUUID()}`;
  insertOrderStatement.run(orderId, orderNumber, assignedUser?.id ?? null, productId ?? null, notes ?? null, status, now, now);

  const createdOrder = parseOrderRow(getOrderByIdStatement.get(orderId));
  response.status(201).json({ success: true, order: createdOrder });
});

app.put('/api/orders/:id', (request, response) => {
  const authContext = requireAdmin(request, response);
  if (!authContext) {
    return;
  }

  const existingOrderRow = getOrderByIdStatement.get(request.params.id);
  if (!existingOrderRow) {
    response.status(404).json({ success: false, error: 'order_not_found' });
    return;
  }

  const orderNumber = normalizeOrderNumber(request.body?.orderNumber ?? existingOrderRow.order_number);
  const productId =
    request.body?.productId !== undefined ? normalizeOptionalString(request.body?.productId) : existingOrderRow.product_id ?? undefined;
  const notes =
    request.body?.notes !== undefined ? normalizeOptionalString(request.body?.notes) : existingOrderRow.notes ?? undefined;
  const status = request.body?.status ?? existingOrderRow.status;

  if (!orderNumber) {
    response.status(400).json({ success: false, error: 'invalid_order_number' });
    return;
  }

  if (!isValidOrderStatus(status)) {
    response.status(400).json({ success: false, error: 'invalid_order_status' });
    return;
  }

  const duplicateOrder = getOrderByNumberStatement.get(orderNumber);
  if (duplicateOrder && duplicateOrder.id !== request.params.id) {
    response.status(409).json({ success: false, error: 'duplicate_order_number' });
    return;
  }

  let assignedUserId = existingOrderRow.user_id ?? null;
  if (request.body?.userId !== undefined) {
    if (request.body.userId === null) {
      assignedUserId = null;
    } else {
      const nextUserId = normalizeOptionalString(request.body.userId);
      const assignedUser = nextUserId ? getUserByIdStatement.get(nextUserId) : null;
      if (nextUserId && !assignedUser) {
        response.status(404).json({ success: false, error: 'user_not_found' });
        return;
      }
      assignedUserId = assignedUser?.id ?? null;
    }
  }

  updateOrderStatement.run(
    orderNumber,
    assignedUserId,
    productId ?? null,
    notes ?? null,
    status,
    new Date().toISOString(),
    request.params.id
  );

  response.json({ success: true, order: parseOrderRow(getOrderByIdStatement.get(request.params.id)) });
});

app.post('/api/auth/firebase/verify', async (request, response) => {
  if (!firebase.auth) {
    response.status(503).json({ success: false, error: firebase.error || 'firebase_admin_unavailable' });
    return;
  }

  const idToken = typeof request.body?.idToken === 'string' ? request.body.idToken : '';
  if (!idToken) {
    response.status(400).json({ success: false, error: 'missing_id_token' });
    return;
  }

  try {
    const decodedToken = await firebase.auth.verifyIdToken(idToken, true);
    const email = decodedToken.email?.trim().toLowerCase();

    if (!email) {
      response.status(400).json({ success: false, error: 'missing_email_in_token' });
      return;
    }

    response.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email,
        fullName: decodedToken.name || email.split('@')[0] || 'Google User',
        picture: decodedToken.picture,
        emailVerified: decodedToken.email_verified === true,
      },
    });
  } catch {
    response.status(401).json({ success: false, error: 'invalid_id_token' });
  }
});

app.post('/api/auth/firebase/session', async (request, response) => {
  if (!firebase.auth) {
    response.status(503).json({ success: false, error: firebase.error || 'firebase_admin_unavailable' });
    return;
  }

  const idToken = typeof request.body?.idToken === 'string' ? request.body.idToken : '';
  if (!idToken) {
    response.status(400).json({ success: false, error: 'missing_id_token' });
    return;
  }

  try {
    const decodedToken = await firebase.auth.verifyIdToken(idToken, true);
    const email = decodedToken.email?.trim().toLowerCase();

    if (!email) {
      response.status(400).json({ success: false, error: 'missing_email_in_token' });
      return;
    }

    if (!decodedToken.email_verified) {
      response.status(403).json({ success: false, error: 'email_not_verified' });
      return;
    }

    const userRow = syncGoogleUser({
      email,
      fullName: decodedToken.name || email.split('@')[0] || 'Google User',
    });
    const sessionToken = createSessionForUser(userRow.id);

    response.json({ success: true, user: toPublicUser(userRow), sessionToken });
  } catch {
    response.status(401).json({ success: false, error: 'invalid_id_token' });
  }
});

app.post('/api/auth/firebase/register', async (request, response) => {
  if (!firebase.auth) {
    response.status(503).json({ success: false, error: 'firebase_admin_unavailable' });
    return;
  }

  const idToken = typeof request.body?.idToken === 'string' ? request.body.idToken : '';
  const fullName = typeof request.body?.fullName === 'string' ? request.body.fullName.trim() : '';
  const companyName = typeof request.body?.companyName === 'string' ? request.body.companyName.trim() : null;

  if (!idToken || !fullName) {
    response.status(400).json({ success: false, error: 'invalid_register_payload' });
    return;
  }

  try {
    const decodedToken = await firebase.auth.verifyIdToken(idToken, true);
    const email = decodedToken.email?.trim().toLowerCase();

    if (!email) {
      response.status(400).json({ success: false, error: 'missing_email_in_token' });
      return;
    }

    const existingUser = getUserByEmailStatement.get(email);
    if (existingUser) {
      response.status(409).json({ success: false, error: 'email_exists' });
      return;
    }

    const authProvider = decodedToken.firebase?.sign_in_provider === 'password' ? 'firebase_email' : 'google';

    const userRow = createUser({
      fullName,
      companyName,
      email,
      password: null, // Password is managed by Firebase
      role: 'user',
      authProvider,
    });

    response.status(201).json({ success: true, user: toPublicUser(userRow) });
  } catch (error) {
    response.status(401).json({ success: false, error: 'invalid_id_token' });
  }
});

app.listen(port, () => {
  console.log(`[api] running on http://localhost:${port}`);
  console.log(`[api] data DB: ${databasePath}`);
  if (!adminSeedUser) {
    console.warn('[api] No admin seed user configured. Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD if you need an initial admin.');
  }
  if (!firebase.auth) {
    console.warn('[api] Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_* env vars.');
  }
});
