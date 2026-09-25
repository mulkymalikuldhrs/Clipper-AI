export const PROVIDER_SETTINGS_KEY = "clipper-ai.provider.v1";
export const PROVIDER_SETTINGS_LEGACY_KEY = "superclipper.provider.v1";
export const PROVIDER_API_KEY_SESSION_KEY = "clipper-ai.provider.api-key.v1";

export type ProviderConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
};

export const EMPTY_PROVIDER_CONFIG: ProviderConfig = {
  baseUrl: "",
  model: "",
  apiKey: "",
};

export type ProviderValidation =
  | { ok: true; value: ProviderConfig }
  | { ok: false; error: string };

/** Validate a provider endpoint without ever persisting the secret in Convex. */
export function validateProviderConfig(input: Partial<ProviderConfig>): ProviderValidation {
  const baseUrl = input.baseUrl?.trim() ?? "";
  const model = input.model?.trim() ?? "";
  const apiKey = input.apiKey?.trim() ?? "";

  if (!baseUrl) return { ok: false, error: "Base URL wajib diisi." };
  if (baseUrl.length > 500) return { ok: false, error: "Base URL terlalu panjang." };
  if (!model) return { ok: false, error: "Model wajib diisi." };
  if (model.length > 160) return { ok: false, error: "Nama model terlalu panjang." };
  if (apiKey.length > 512) return { ok: false, error: "API key terlalu panjang." };

  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return { ok: false, error: "Base URL harus berupa URL yang valid." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Base URL hanya boleh memakai http atau https." };
  }
  if (url.username || url.password || url.search || url.hash) {
    return { ok: false, error: "Base URL tidak boleh berisi credential, query, atau hash." };
  }

  return {
    ok: true,
    value: {
      baseUrl: url.toString().replace(/\/$/, ""),
      model,
      apiKey,
    },
  };
}

export function readNonSecretProviderConfig(value: string | null): Omit<ProviderConfig, "apiKey"> {
  if (!value) return { baseUrl: "", model: "" };
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { baseUrl: "", model: "" };
    }
    const record = parsed as Record<string, unknown>;
    return {
      baseUrl: typeof record.baseUrl === "string" ? record.baseUrl.slice(0, 500) : "",
      model: typeof record.model === "string" ? record.model.slice(0, 160) : "",
    };
  } catch {
    return { baseUrl: "", model: "" };
  }
}
