import axios from "axios";
import { createHash } from "crypto";
import type { ConfigMap } from "./configuracionService";
import * as configuracionService from "./configuracionService";
import suscriptorRepository from "../repositories/suscriptorRepository";

type SyncProvider = "mailrelay" | "mailchimp";
type ActiveProvider = SyncProvider | "local";

type SyncError = {
  email: string;
  reason: string;
};

export type SubscriberSyncStatus = {
  activeProvider: ActiveProvider;
  enabledAccounts: {
    mailrelay: boolean;
    mailchimp: boolean;
  };
  providerReady: boolean;
  autoSyncEnabled: boolean;
  hourlyBatchSize: number;
  pending: {
    mailrelay: number;
    mailchimp: number;
    activeProvider: number;
  };
};

export type SubscriberSyncRunResult = {
  provider: SyncProvider;
  source: "manual" | "auto";
  processed: number;
  synced: number;
  failed: number;
  remaining: number;
  errors: SyncError[];
};

function parseBooleanValue(value: string | null | undefined): boolean {
  return String(value ?? "false").trim().toLowerCase() === "true";
}

function parseBatchSize(value: string | null | undefined): number {
  const parsed = Number(value ?? "25");
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 25;
  }

  return Math.min(200, Math.floor(parsed));
}

function normalizeString(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function getActiveProvider(config: ConfigMap): ActiveProvider {
  const preferred = normalizeString(config.email_provider_default).toLowerCase();
  const mailrelayEnabled = parseBooleanValue(config.mailrelay_enabled);
  const mailchimpEnabled = parseBooleanValue(config.mailchimp_enabled);

  if (preferred === "mailrelay" && mailrelayEnabled) {
    return "mailrelay";
  }

  if (preferred === "mailchimp" && mailchimpEnabled) {
    return "mailchimp";
  }

  if (mailrelayEnabled) {
    return "mailrelay";
  }

  if (mailchimpEnabled) {
    return "mailchimp";
  }

  return "local";
}

function isProviderReady(provider: SyncProvider, config: ConfigMap): boolean {
  if (provider === "mailrelay") {
    return (
      parseBooleanValue(config.mailrelay_enabled) &&
      Boolean(normalizeString(config.mailrelay_api_url)) &&
      Boolean(normalizeString(config.mailrelay_api_key)) &&
      Boolean(normalizeString(config.mailrelay_group_id))
    );
  }

  return (
    parseBooleanValue(config.mailchimp_enabled) &&
    Boolean(normalizeString(config.mailchimp_api_key)) &&
    Boolean(normalizeString(config.mailchimp_server_prefix)) &&
    Boolean(normalizeString(config.mailchimp_audience_id))
  );
}

function getMissingConfigFields(provider: SyncProvider, config: ConfigMap): string[] {
  if (provider === "mailrelay") {
    const required: Array<[string, string | null | undefined]> = [
      ["mailrelay_enabled", parseBooleanValue(config.mailrelay_enabled) ? "true" : "false"],
      ["mailrelay_api_url", config.mailrelay_api_url],
      ["mailrelay_api_key", config.mailrelay_api_key],
      ["mailrelay_group_id", config.mailrelay_group_id],
    ];

    return required
      .filter(([key, value]) => {
        if (key === "mailrelay_enabled") {
          return value !== "true";
        }
        return !normalizeString(value);
      })
      .map(([key]) => key);
  }

  const required: Array<[string, string | null | undefined]> = [
    ["mailchimp_enabled", parseBooleanValue(config.mailchimp_enabled) ? "true" : "false"],
    ["mailchimp_api_key", config.mailchimp_api_key],
    ["mailchimp_server_prefix", config.mailchimp_server_prefix],
    ["mailchimp_audience_id", config.mailchimp_audience_id],
  ];

  return required
    .filter(([key, value]) => {
      if (key === "mailchimp_enabled") {
        return value !== "true";
      }
      return !normalizeString(value);
    })
    .map(([key]) => key);
}

function getAutoSyncEnabled(config: ConfigMap): boolean {
  return parseBooleanValue(config.subscriber_auto_sync_enabled);
}

function getHourlyBatchSize(config: ConfigMap): number {
  return parseBatchSize(config.subscriber_auto_sync_batch_size);
}

function normalizeMailrelaySubscribersUrl(rawUrl: string): string {
  const trimmed = rawUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/subscribers") ? trimmed : `${trimmed}/subscribers`;
}

function buildAxiosErrorMessage(
  provider: SyncProvider,
  error: unknown,
  context?: Record<string, unknown>
): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const responseData = error.response?.data
      ? JSON.stringify(error.response.data).slice(0, 400)
      : "sin body";
    const requestInfo = context ? ` | context=${JSON.stringify(context)}` : "";
    return `${provider} HTTP ${status ?? "N/A"}${statusText ? ` ${statusText}` : ""}: ${responseData}${requestInfo}`;
  }

  const base = error instanceof Error ? error.message : "Error desconocido";
  const requestInfo = context ? ` | context=${JSON.stringify(context)}` : "";
  return `${provider}: ${base}${requestInfo}`;
}

async function syncWithMailrelay(
  input: {
    email: string;
    nombre: string | null;
  },
  config: ConfigMap
): Promise<void> {
  const apiUrl = normalizeString(config.mailrelay_api_url);
  const endpoint = normalizeMailrelaySubscribersUrl(apiUrl);
  const apiKey = normalizeString(config.mailrelay_api_key);
  const groupId = normalizeString(config.mailrelay_group_id);
  const groupIdNumber = Number(groupId);

  const payload: Record<string, unknown> = {
    status: "active",
    email: input.email,
    name: input.nombre?.trim() || input.email.split("@")[0],
    group_ids: Number.isFinite(groupIdNumber) ? [groupIdNumber] : [groupId],
  };

  let response;
  try {
    response = await axios.post(endpoint, payload, {
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
        "X-AUTH-TOKEN": apiKey,
      },
    });
  } catch (error) {
    throw new Error(
      buildAxiosErrorMessage("mailrelay", error, {
        endpoint,
        email: input.email,
        hasGroup: Boolean(groupId),
      })
    );
  }

  const serialized = JSON.stringify(response.data ?? {}).toLowerCase();
  const looksLikeError =
    serialized.includes('"status":false') ||
    serialized.includes('"error"') ||
    serialized.includes("invalid");
  const alreadyExists = serialized.includes("already") && serialized.includes("exist");

  if (looksLikeError && !alreadyExists) {
    throw new Error(
      `Mailrelay rechazo el contacto: ${JSON.stringify(response.data ?? {}).slice(0, 400)}`
    );
  }
}

async function syncWithMailchimp(
  input: {
    email: string;
    nombre: string | null;
  },
  config: ConfigMap
): Promise<void> {
  const apiKey = normalizeString(config.mailchimp_api_key);
  const serverPrefix = normalizeString(config.mailchimp_server_prefix);
  const audienceId = normalizeString(config.mailchimp_audience_id);
  const tagsRaw = normalizeString(config.mailchimp_tags_default);
  const subscriberHash = createHash("md5").update(input.email.toLowerCase()).digest("hex");

  const endpoint = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`;

  await axios.put(
    endpoint,
    {
      email_address: input.email,
      status_if_new: "subscribed",
      status: "subscribed",
      merge_fields: {
        FNAME: input.nombre?.trim() || "",
      },
    },
    {
      timeout: 15000,
      auth: {
        username: "indumex",
        password: apiKey,
      },
    }
  );

  const tags = tagsRaw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (tags.length > 0) {
    await axios.post(
      `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}/tags`,
      {
        tags: tags.map((name) => ({ name, status: "active" })),
      },
      {
        timeout: 15000,
        auth: {
          username: "indumex",
          password: apiKey,
        },
      }
    );
  }
}

async function syncSingleSubscriber(
  provider: SyncProvider,
  subscriber: {
    id: number;
    email: string;
    nombre: string | null;
  },
  config: ConfigMap
): Promise<void> {
  if (provider === "mailrelay") {
    await syncWithMailrelay(subscriber, config);
    return;
  }

  await syncWithMailchimp(subscriber, config);
}

class SuscriptorSyncService {
  async getStatus(): Promise<SubscriberSyncStatus> {
    const config = await configuracionService.getAll();
    const activeProvider = getActiveProvider(config);
    const pendingMailrelay = await suscriptorRepository.countPendingForProvider("mailrelay");
    const pendingMailchimp = await suscriptorRepository.countPendingForProvider("mailchimp");

    return {
      activeProvider,
      enabledAccounts: {
        mailrelay: parseBooleanValue(config.mailrelay_enabled),
        mailchimp: parseBooleanValue(config.mailchimp_enabled),
      },
      providerReady: activeProvider !== "local" ? isProviderReady(activeProvider, config) : false,
      autoSyncEnabled: getAutoSyncEnabled(config),
      hourlyBatchSize: getHourlyBatchSize(config),
      pending: {
        mailrelay: pendingMailrelay,
        mailchimp: pendingMailchimp,
        activeProvider:
          activeProvider === "mailrelay"
            ? pendingMailrelay
            : activeProvider === "mailchimp"
              ? pendingMailchimp
              : 0,
      },
    };
  }

  async setAutoSync(enabled: boolean, batchSize?: number): Promise<SubscriberSyncStatus> {
    const entries: Array<{ clave: string; valor: string | null }> = [
      {
        clave: "subscriber_auto_sync_enabled",
        valor: enabled ? "true" : "false",
      },
    ];

    if (typeof batchSize === "number" && Number.isFinite(batchSize) && batchSize > 0) {
      entries.push({
        clave: "subscriber_auto_sync_batch_size",
        valor: String(Math.min(200, Math.floor(batchSize))),
      });
    }

    await configuracionService.updateMany(entries);
    return this.getStatus();
  }

  async runManualSync(input?: {
    provider?: SyncProvider | "active";
    limit?: number;
  }): Promise<SubscriberSyncRunResult> {
    const config = await configuracionService.getAll();
    const activeProvider = getActiveProvider(config);

    const selectedProvider =
      input?.provider && input.provider !== "active" ? input.provider : activeProvider;

    if (selectedProvider === "local") {
      throw new Error("No hay proveedor activo para sincronizar (Mailrelay/Mailchimp).");
    }

    if (!isProviderReady(selectedProvider, config)) {
      const missing = getMissingConfigFields(selectedProvider, config);
      const missingText = missing.length > 0 ? ` Faltan: ${missing.join(", ")}.` : "";
      throw new Error(
        `La cuenta activa de ${selectedProvider} no esta configurada correctamente.${missingText}`
      );
    }

    const limit = Math.min(200, Math.max(1, Math.floor(input?.limit ?? 25)));
    const subscribers = await suscriptorRepository.findPendingForProvider(selectedProvider, limit);

    let synced = 0;
    let failed = 0;
    const errors: SyncError[] = [];

    for (const subscriber of subscribers) {
      try {
        await syncSingleSubscriber(selectedProvider, subscriber, config);
        await suscriptorRepository.updateSyncStatus(
          subscriber.id,
          selectedProvider,
          "sincronizado",
          null
        );
        synced += 1;
      } catch (error) {
        failed += 1;
        const reason = error instanceof Error
          ? error.message
          : buildAxiosErrorMessage(selectedProvider, error, { email: subscriber.email });

        errors.push({
          email: subscriber.email,
          reason,
        });

        console.error(`[Suscriptores] Error sync ${selectedProvider} para ${subscriber.email}: ${reason}`);

        await suscriptorRepository.updateSyncStatus(
          subscriber.id,
          selectedProvider,
          "error",
          `${selectedProvider}: ${reason}`.slice(0, 500)
        );
      }
    }

    const remaining = await suscriptorRepository.countPendingForProvider(selectedProvider);

    return {
      provider: selectedProvider,
      source: "manual",
      processed: subscribers.length,
      synced,
      failed,
      remaining,
      errors,
    };
  }

  async runAutomaticTick(): Promise<SubscriberSyncRunResult | null> {
    const status = await this.getStatus();

    if (!status.autoSyncEnabled || status.activeProvider === "local" || !status.providerReady) {
      return null;
    }

    const result = await this.runManualSync({
      provider: status.activeProvider,
      limit: status.hourlyBatchSize,
    });

    return {
      ...result,
      source: "auto",
    };
  }
}

export default new SuscriptorSyncService();
