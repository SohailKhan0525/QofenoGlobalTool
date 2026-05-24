import { Account, Client, Databases, Functions, Realtime, Storage } from 'appwrite';

const env = import.meta.env;
const endpoint = env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = env.VITE_APPWRITE_PROJECT_ID || '69c58725000ef2b43f18';

export const DATABASE_ID = env.VITE_APPWRITE_DATABASE_ID || 'qofeno_db';

export const FUNCTION_IDS = {
  jsonFormatter: env.VITE_APPWRITE_FUNCTION_JSON_FORMATTER_ID || '2217055e890645a5af054eb1d6186efe',
  wordCounter: env.VITE_APPWRITE_FUNCTION_WORD_COUNTER_ID || '4291a710a39643dca3c0f28615496583',
  base64Encoder: env.VITE_APPWRITE_FUNCTION_BASE64_ENCODER_ID || 'e63948affa5e460085fc9fc8b2a14dde',
  textCaseConverter: env.VITE_APPWRITE_FUNCTION_TEXT_CASE_CONVERTER_ID || '8be86de4f76b44d59fbfba912b749482',
  trackEvent: env.VITE_APPWRITE_FUNCTION_TRACK_EVENT_ID || '2ae3ea71599748069626086a6ffcc629',
  authWebhook: env.VITE_APPWRITE_FUNCTION_AUTH_WEBHOOK_ID || '8d7fa5f13e644837ab789e8753b0ef48',
  paymentWebhook: env.VITE_APPWRITE_FUNCTION_PAYMENT_WEBHOOK_ID || '4bc2da1ea61b4ff896ebecada97afa75',
  createDownloadLink: env.VITE_APPWRITE_FUNCTION_CREATE_DOWNLOAD_LINK_ID || 'c461e7073a8f4ad2b177132d9864dcec',
};

const client = new Client().setEndpoint(endpoint).setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export const realtime = new Realtime(client);

export function isAppwriteConfigured() {
  return Boolean(endpoint && projectId);
}

export async function executeJsonFunction(functionId: string, payload: Record<string, unknown>) {
  const execution = await functions.createExecution(functionId, JSON.stringify(payload), false);
  const raw = execution.responseBody || '{}';
  if (typeof raw !== 'string') {
    return raw;
  }
  return JSON.parse(raw);
}

export async function trackEvent(eventType: 'view' | 'like' | 'unlike' | 'recent', toolSlug: string, userId?: string) {
  if (!FUNCTION_IDS.trackEvent) return null;
  try {
    return await executeJsonFunction(FUNCTION_IDS.trackEvent, {
      event_type: eventType,
      tool_slug: toolSlug,
      user_id: userId || null,
    });
  } catch {
    return null;
  }
}

export async function runJsonFormatter(input: string, action: 'format' | 'minify' | 'validate' = 'format') {
  return executeJsonFunction(FUNCTION_IDS.jsonFormatter, { json: input, action });
}

export async function runWordCounter(text: string) {
  return executeJsonFunction(FUNCTION_IDS.wordCounter, { text });
}

export async function runBase64Encoder(input: string, action: 'encode' | 'decode' = 'encode') {
  if (!FUNCTION_IDS.base64Encoder) {
    throw new Error('Base64 encoder function is not configured');
  }
  return executeJsonFunction(FUNCTION_IDS.base64Encoder, { text: input, action });
}
