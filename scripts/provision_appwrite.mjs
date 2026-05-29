#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Permission, Role } from 'appwrite';

const COLLECTIONS = {
  tools: {
    permissions: [Permission.read(Role.any())],
    attributes: [
      { key: 'slug', type: 'string', size: 256, required: true },
      { key: 'name', type: 'string', size: 256, required: true },
      { key: 'description', type: 'string', size: 1024, required: true },
      { key: 'category', type: 'string', size: 128, required: true },
      { key: 'subcategory', type: 'string', size: 128, required: false },
      { key: 'is_free', type: 'boolean', required: true, default: true },
      { key: 'is_new', type: 'boolean', required: false, default: false },
      { key: 'function_id', type: 'string', size: 128, required: true },
      { key: 'icon', type: 'string', size: 1024, required: false },
      { key: 'tags', type: 'string', size: 256, required: false, array: true },
      { key: 'max_file_size_free', type: 'integer', required: false },
      { key: 'max_file_size_pro', type: 'integer', required: false },
      { key: 'accepted_types', type: 'string', size: 256, required: false, array: true },
      { key: 'output_type', type: 'string', size: 128, required: false },
      { key: 'created_at', type: 'datetime', required: false },
      { key: 'updated_at', type: 'datetime', required: false },
    ],
    indexes: [
      { key: 'slug_unique', type: 'unique', attributes: ['slug'] },
      { key: 'category_idx', type: 'key', attributes: ['category'] },
      { key: 'is_free_idx', type: 'key', attributes: ['is_free'] },
      { key: 'is_new_idx', type: 'key', attributes: ['is_new'] },
    ],
  },
  users_meta: {
    permissions: [Permission.read(Role.users())],
    attributes: [
      { key: 'user_id', type: 'string', size: 128, required: true },
      { key: 'plan', type: 'string', size: 32, required: true, default: 'free' },
      { key: 'plan_expires_at', type: 'datetime', required: false },
      { key: 'payment_ref', type: 'string', size: 256, required: false },
      { key: 'tools_used', type: 'integer', required: false, default: 0 },
      { key: 'files_processed', type: 'integer', required: false, default: 0 },
      { key: 'storage_used', type: 'integer', required: false, default: 0 },
      { key: 'created_at', type: 'datetime', required: false },
      { key: 'updated_at', type: 'datetime', required: false },
    ],
    indexes: [
      { key: 'user_id_unique', type: 'unique', attributes: ['user_id'] },
      { key: 'plan_idx', type: 'key', attributes: ['plan'] },
    ],
  },
  tool_executions: {
    permissions: [Permission.read(Role.users())],
    attributes: [
      { key: 'user_id', type: 'string', size: 128, required: false },
      { key: 'tool_slug', type: 'string', size: 128, required: true },
      { key: 'tool_name', type: 'string', size: 256, required: true },
      { key: 'category', type: 'string', size: 128, required: true },
      { key: 'status', type: 'string', size: 32, required: true },
      { key: 'input_filename', type: 'string', size: 512, required: false },
      { key: 'input_size', type: 'integer', required: false },
      { key: 'output_filename', type: 'string', size: 512, required: false },
      { key: 'output_size', type: 'integer', required: false },
      { key: 'download_url', type: 'string', size: 1024, required: false },
      { key: 'download_url_expires', type: 'datetime', required: false },
      { key: 'error_message', type: 'string', size: 1024, required: false },
      { key: 'duration_ms', type: 'integer', required: false },
      { key: 'created_at', type: 'datetime', required: false },
      { key: 'updated_at', type: 'datetime', required: false },
    ],
    indexes: [
      { key: 'user_idx', type: 'key', attributes: ['user_id'] },
      { key: 'tool_slug_idx', type: 'key', attributes: ['tool_slug'] },
      { key: 'status_idx', type: 'key', attributes: ['status'] },
      { key: 'created_at_desc', type: 'key', attributes: ['created_at'], orders: ['DESC'] },
    ],
  },
  tool_views: {
    permissions: [Permission.read(Role.any())],
    attributes: [
      { key: 'tool_slug', type: 'string', size: 128, required: true },
      { key: 'count', type: 'integer', required: true, default: 0 },
      { key: 'likes', type: 'integer', required: true, default: 0 },
    ],
    indexes: [{ key: 'tool_slug_unique', type: 'unique', attributes: ['tool_slug'] }],
  },
  tool_likes: {
    permissions: [Permission.read(Role.users())],
    attributes: [
      { key: 'user_id', type: 'string', size: 128, required: true },
      { key: 'tool_slug', type: 'string', size: 128, required: true },
      { key: 'created_at', type: 'datetime', required: false },
    ],
    indexes: [
      { key: 'user_tool_unique', type: 'unique', attributes: ['user_id', 'tool_slug'] },
      { key: 'tool_slug_idx', type: 'key', attributes: ['tool_slug'] },
    ],
  },
  recently_viewed: {
    permissions: [Permission.read(Role.users())],
    attributes: [
      { key: 'user_id', type: 'string', size: 128, required: true },
      { key: 'tool_slug', type: 'string', size: 128, required: true },
      { key: 'tool_name', type: 'string', size: 256, required: true },
      { key: 'category', type: 'string', size: 128, required: true },
      { key: 'viewed_at', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'user_idx', type: 'key', attributes: ['user_id'] },
      { key: 'user_tool_unique', type: 'unique', attributes: ['user_id', 'tool_slug'] },
      { key: 'viewed_at_desc', type: 'key', attributes: ['viewed_at'], orders: ['DESC'] },
    ],
  },
  subscriptions: {
    permissions: [Permission.read(Role.users())],
    attributes: [
      { key: 'user_id', type: 'string', size: 128, required: true },
      { key: 'plan', type: 'string', size: 64, required: true },
      { key: 'status', type: 'string', size: 64, required: true },
      { key: 'payment_provider', type: 'string', size: 64, required: true },
      { key: 'payment_sub_id', type: 'string', size: 256, required: true },
      { key: 'payment_customer', type: 'string', size: 256, required: false },
      { key: 'current_period_start', type: 'datetime', required: false },
      { key: 'current_period_end', type: 'datetime', required: false },
      { key: 'cancelled_at', type: 'datetime', required: false },
      { key: 'created_at', type: 'datetime', required: false },
    ],
    indexes: [
      { key: 'user_id_unique', type: 'unique', attributes: ['user_id'] },
      { key: 'payment_sub_id_unique', type: 'unique', attributes: ['payment_sub_id'] },
      { key: 'status_idx', type: 'key', attributes: ['status'] },
    ],
  },
  whats_new: {
    permissions: [Permission.read(Role.any())],
    attributes: [
      { key: 'title', type: 'string', size: 256, required: true },
      { key: 'body', type: 'string', size: 2048, required: true },
      { key: 'type', type: 'string', size: 64, required: true },
      { key: 'author', type: 'string', size: 128, required: true, default: 'Mohd Zaheer Uddin' },
      { key: 'published', type: 'boolean', required: false, default: false },
      { key: 'created_at', type: 'datetime', required: false },
      { key: 'updated_at', type: 'datetime', required: false },
    ],
    indexes: [
      { key: 'created_at_desc', type: 'key', attributes: ['created_at'], orders: ['DESC'] },
      { key: 'published_idx', type: 'key', attributes: ['published'] },
    ],
  },
  contact_messages: {
    permissions: [Permission.create(Role.any())],
    attributes: [
      { key: 'name', type: 'string', size: 256, required: true },
      { key: 'email', type: 'string', size: 256, required: true },
      { key: 'subject', type: 'string', size: 512, required: true },
      { key: 'message', type: 'string', size: 4096, required: true },
      { key: 'read', type: 'boolean', required: false, default: false },
      { key: 'created_at', type: 'datetime', required: false },
    ],
    indexes: [{ key: 'created_at_desc', type: 'key', attributes: ['created_at'], orders: ['DESC'] }],
  },
  notifications: {
    permissions: [Permission.read(Role.users())],
    attributes: [
      { key: 'user_id', type: 'string', size: 128, required: true },
      { key: 'title', type: 'string', size: 256, required: true },
      { key: 'message', type: 'string', size: 2048, required: true },
      { key: 'type', type: 'string', size: 32, required: false, default: 'info' },
      { key: 'read', type: 'boolean', required: false, default: false },
      { key: 'link', type: 'string', size: 512, required: false },
      { key: 'created_at', type: 'datetime', required: false },
    ],
    indexes: [
      { key: 'user_id_idx', type: 'key', attributes: ['user_id'] },
      { key: 'read_idx', type: 'key', attributes: ['read'] },
      { key: 'created_at_desc', type: 'key', attributes: ['created_at'], orders: ['DESC'] },
    ],
  },
};

const BUCKETS = {
  tool_inputs: {
    bucketId: 'tool_inputs',
    name: 'tool_inputs',
    maximumFileSize: 500 * 1024 * 1024,
    encryption: true,
    antivirus: true,
    fileSecurity: true,
    permissions: [Permission.create(Role.any())],
  },
  tool_outputs: {
    bucketId: 'tool_outputs',
    name: 'tool_outputs',
    maximumFileSize: 500 * 1024 * 1024,
    encryption: true,
    antivirus: false,
    fileSecurity: true,
    permissions: [Permission.read(Role.any())],
  },
};

function loadEnv() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), '.env.server'),
    path.resolve(process.cwd(), 'QofenoGlobalTool', '.env.server'),
    path.resolve(scriptDir, '..', '.env.server'),
  ];
  const envPath = candidates.find(candidate => fs.existsSync(candidate));
  if (!envPath) throw new Error('Unable to find .env.server in repo root or QofenoGlobalTool folder');

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(\w+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  }
  return envPath;
}

function assertEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required in .env.server`);
  return value;
}

async function request(method, pathName, body) {
  const base = assertEnv('APPWRITE_ENDPOINT').replace(/\/$/, '');
  const res = await fetch(`${base}${pathName}`, {
    method,
    headers: {
      'X-Appwrite-Project': assertEnv('APPWRITE_PROJECT_ID'),
      'X-Appwrite-Key': assertEnv('APPWRITE_API_KEY'),
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!res.ok) {
    const error = new Error(`Appwrite ${method} ${pathName} failed: ${res.status} ${typeof json === 'string' ? json : JSON.stringify(json)}`);
    error.status = res.status;
    error.body = json;
    throw error;
  }

  return json;
}

async function ensureDatabase() {
  const databaseId = assertEnv('DATABASE_ID');
  try {
    await request('GET', `/databases/${databaseId}`);
    console.log(`Database exists: ${databaseId}`);
  } catch (error) {
    if (error.status !== 404) throw error;
    await request('POST', '/databases', { databaseId, name: 'Qofeno' });
    console.log(`Created database: ${databaseId}`);
  }
}

async function ensureCollection(collectionId, config) {
  const databaseId = assertEnv('DATABASE_ID');
  try {
    await request('GET', `/databases/${databaseId}/collections/${collectionId}`);
    console.log(`Collection exists: ${collectionId}`);
    await request('PUT', `/databases/${databaseId}/collections/${collectionId}`, {
      permissions: config.permissions,
      documentSecurity: true,
      enabled: true,
      name: collectionId,
    });
    console.log(`Updated collection permissions: ${collectionId}`);
  } catch (error) {
    if (error.status !== 404) throw error;
    await request('POST', `/databases/${databaseId}/collections`, {
      collectionId,
      name: collectionId,
      permissions: config.permissions,
      documentSecurity: true,
      enabled: true,
    });
    console.log(`Created collection: ${collectionId}`);
  }
}

async function ensureAttribute(collectionId, attribute) {
  const databaseId = assertEnv('DATABASE_ID');
  const endpoint = `/databases/${databaseId}/collections/${collectionId}/attributes/${attribute.type}`;
  const payload = {
    key: attribute.key,
    required: attribute.required ?? false,
    array: attribute.array ?? false,
  };
  if (attribute.size != null) payload.size = attribute.size;
  if (attribute.default !== undefined) {
    if (payload.required) {
      console.warn(`Skipping default for required attribute ${collectionId}.${attribute.key} because Appwrite rejects required+default at create time.`);
    } else {
      payload.default = attribute.default;
    }
  }

  try {
    await request('POST', endpoint, payload);
    console.log(`Added attribute ${collectionId}.${attribute.key}`);
  } catch (error) {
    if (error.status === 409 || /already exists/i.test(String(error.body))) {
      console.log(`Attribute exists: ${collectionId}.${attribute.key}`);
      return;
    }
    throw error;
  }
}

async function ensureIndex(collectionId, index) {
  const databaseId = assertEnv('DATABASE_ID');
  const payload = {
    key: index.key,
    type: index.type,
    attributes: index.attributes,
  };
  if (index.orders) payload.orders = index.orders;

  try {
    await request('POST', `/databases/${databaseId}/collections/${collectionId}/indexes`, payload);
    console.log(`Added index ${collectionId}.${index.key}`);
  } catch (error) {
    if (error.status === 409 || /already exists/i.test(String(error.body))) {
      console.log(`Index exists: ${collectionId}.${index.key}`);
      return;
    }
    throw error;
  }
}

async function ensureBucket(bucket) {
  try {
    await request('GET', `/storage/buckets/${bucket.bucketId}`);
    console.log(`Bucket exists: ${bucket.bucketId}`);
  } catch (error) {
    if (error.status !== 404) throw error;
    await request('POST', '/storage/buckets', bucket);
    console.log(`Created bucket: ${bucket.bucketId}`);
  }
}

async function main() {
  const envPath = loadEnv();
  console.log(`Loaded env: ${envPath}`);
  assertEnv('APPWRITE_ENDPOINT');
  assertEnv('APPWRITE_PROJECT_ID');
  assertEnv('APPWRITE_API_KEY');
  assertEnv('DATABASE_ID');

  await ensureDatabase();

  for (const [collectionId, config] of Object.entries(COLLECTIONS)) {
    await ensureCollection(collectionId, config);
    for (const attribute of config.attributes) {
      await ensureAttribute(collectionId, attribute);
    }
    for (const index of config.indexes) {
      await ensureIndex(collectionId, index);
    }
  }

  for (const bucket of Object.values(BUCKETS)) {
    await ensureBucket(bucket);
  }

  console.log('Step 1 and Step 2 provisioning finished.');
}

main().catch(error => {
  console.error(error?.message || error);
  process.exit(1);
});