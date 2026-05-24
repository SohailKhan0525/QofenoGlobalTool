/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT?: string;
  readonly VITE_APPWRITE_PROJECT_ID?: string;
  readonly VITE_APPWRITE_DATABASE_ID?: string;
  readonly VITE_APPWRITE_FUNCTION_JSON_FORMATTER_ID?: string;
  readonly VITE_APPWRITE_FUNCTION_WORD_COUNTER_ID?: string;
  readonly VITE_APPWRITE_FUNCTION_BASE64_ENCODER_ID?: string;
  readonly VITE_APPWRITE_FUNCTION_TEXT_CASE_CONVERTER_ID?: string;
  readonly VITE_APPWRITE_FUNCTION_TRACK_EVENT_ID?: string;
  readonly VITE_APPWRITE_FUNCTION_AUTH_WEBHOOK_ID?: string;
  readonly VITE_APPWRITE_FUNCTION_PAYMENT_WEBHOOK_ID?: string;
  readonly VITE_APPWRITE_FUNCTION_CREATE_DOWNLOAD_LINK_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
