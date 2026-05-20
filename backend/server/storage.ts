// Preconfigured storage helpers for JoinMe
// Uses the S3-compatible storage proxy (Authorization: Bearer <token>)

import { ENV } from './env';

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }

  try {
    new URL(baseUrl);
  } catch {
    throw new Error(
      "Invalid BUILT_IN_FORGE_API_URL"
    );
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}


export function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

export async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
) {
  const downloadApiUrl =
    new URL(
      "v1/storage/downloadUrl",
      ensureTrailingSlash(baseUrl)
    );

  downloadApiUrl.searchParams.set(
    "path",
    normalizeKey(relKey)
  );

  const response =
    await fetch(
      downloadApiUrl,
      {
        method: "GET",

        headers:
          buildAuthHeaders(
            apiKey
          ),
      }
    );

  if (!response.ok) {
    throw new Error(
      `Storage download URL failed (${response.status})`
    );
  }

  const json =
    await response.json();

  if (!json?.url) {
    throw new Error(
      "Storage response missing url field"
    );
  }

  return json.url;
}

export function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

export function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

export function buildAuthHeaders(
  apiKey: string
) {
  return {
    Authorization:
      `Bearer ${apiKey}`,
  };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      `Storage upload failed (${response.status})`
    );
  }

  const json = await response.json();

  if (!json?.url) {
    throw new Error(
      "Storage response missing url field"
    );
  }

  const url = json.url;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey),
  };
}

