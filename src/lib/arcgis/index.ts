import { signal } from '@preact/signals';
import esriConfig from '@arcgis/core/config';
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import OAuthInfo from '@arcgis/core/identity/OAuthInfo';
import Basemap from '@arcgis/core/Basemap';
import WMSLayer from '@arcgis/core/layers/WMSLayer';
import WMTSLayer from '@arcgis/core/layers/WMTSLayer';
import TileLayer from '@arcgis/core/layers/TileLayer';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import VectorTileLayer from '@arcgis/core/layers/VectorTileLayer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import Layer from '@arcgis/core/layers/Layer';
import PortalItem from '@arcgis/core/portal/PortalItem';
import type { LayerConfig } from '../types';
import type { ArcGISCredentials } from '../credentials';

export const PORTAL_URL = 'https://snla.maps.arcgis.com/';
export const OAUTH_CLIENT_ID = 'OieeDHPNPvOHWQtf';
const PORTAL_SHARING_URL = `${PORTAL_URL}sharing`;

function normalizedBaseUrl(): string {
  const prefix = import.meta.env.BASE_URL;
  return prefix.endsWith('/') ? prefix : `${prefix}/`;
}

function isLocalhostHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function shouldUseLocalWmsProxy(): boolean {
  if (typeof window === 'undefined') return false;
  return isLocalhostHost(window.location.hostname);
}

function getWmsProxyEndpoint(): string {
  return `${normalizedBaseUrl()}wms-proxy`;
}

function registerWmsProxyInterceptor(): void {
  if (!shouldUseLocalWmsProxy()) return;

  if (!esriConfig.request.interceptors) {
    esriConfig.request.interceptors = [];
  }

  esriConfig.request.interceptors.push({
    before: (params) => {
      const url = params.url;

      if (url.includes('wms-proxy')) return;

      if (url.includes('arcgis.com') || url.includes('arcgisonline.com')) return;

      const isWmsRequest = /[?&](service=wms|request=getmap|request=getcapabilities)/i.test(url);
      if (!isWmsRequest) return;

      const proxyUrl = getWmsProxyEndpoint();
      params.url = `${window.location.origin}${proxyUrl}?target=${encodeURIComponent(url)}`;
    }
  });
}

const TAG_PARAM = 'hwxtag';

export const layerRequestErrors = signal<Record<string, string>>({});

export function layerTag(identity: string): string {
  let h = 5381;
  for (let i = 0; i < identity.length; i++) h = ((h << 5) + h + identity.charCodeAt(i)) >>> 0;
  return `t${h.toString(36)}`;
}

export function clearLayerRequestError(tag: string): void {
  if (!(tag in layerRequestErrors.value)) return;
  const next = { ...layerRequestErrors.value };
  delete next[tag];
  layerRequestErrors.value = next;
}

function tagFromUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  const match = new RegExp(`[?&]${TAG_PARAM}=(t[a-z0-9]+)`, 'i').exec(url);
  return match ? match[1] : null;
}

function describeRequestError(error: any): string {
  const status = error?.details?.httpStatus;
  if (status) return `HTTP ${status}`;
  const message = typeof error?.message === 'string' ? error.message : '';
  if (/failed to fetch|networkerror|cors/i.test(message)) return 'Blocked (CORS or network)';
  return message || 'Request failed';
}

let errorTrackingRegistered = false;

function registerRequestErrorTracking(): void {
  if (errorTrackingRegistered) return;
  errorTrackingRegistered = true;

  if (!esriConfig.request.interceptors) {
    esriConfig.request.interceptors = [];
  }

  esriConfig.request.interceptors.push({
    after: (response: any) => {
      const tag = tagFromUrl(response?.url);
      if (tag) clearLayerRequestError(tag);
    },
    error: (error: any) => {
      const tag = tagFromUrl(error?.details?.url);
      if (!tag) return;
      layerRequestErrors.value = { ...layerRequestErrors.value, [tag]: describeRequestError(error) };
    }
  });
}

function getOAuthCallbackUrl(): string {
  return `${window.location.origin}${normalizedBaseUrl()}oauth-callback.html`;
}

function getSignedInUserId(): string | null {
  try {
    const cred = IdentityManager.findCredential(PORTAL_SHARING_URL);
    return (cred as any)?.userId || null;
  } catch {
    return null;
  }
}

export interface ArcGISState {
  initialized: boolean;
  apiKeySet: boolean;
  portalAuthenticated: boolean;
  oauthClientId?: string;
  signedInUserId?: string | null;
  error: string | null;
}

export interface LayerPreviewResult {
  success: boolean;
  layer?: __esri.Layer;
  error?: string;
}

export const arcgisState = signal<ArcGISState>({
  initialized: false,
  apiKeySet: false,
  portalAuthenticated: false,
  oauthClientId: undefined,
  signedInUserId: null,
  error: null
});

let oauthInfo: OAuthInfo | null = null;

export function isOAuthConfigured(): boolean {
  return !!OAUTH_CLIENT_ID;
}

function ensureOAuthRegistered(): boolean {
  if (oauthInfo) return true;
  if (!OAUTH_CLIENT_ID) return false;

  oauthInfo = new OAuthInfo({
    appId: OAUTH_CLIENT_ID,
    portalUrl: PORTAL_URL,
    popup: true,
    popupCallbackUrl: getOAuthCallbackUrl()
  });
  IdentityManager.registerOAuthInfos([oauthInfo]);

  arcgisState.value = {
    ...arcgisState.value,
    oauthClientId: OAUTH_CLIENT_ID
  };

  return true;
}

export async function refreshPortalAuthStatus(): Promise<void> {
  if (!ensureOAuthRegistered()) {
    arcgisState.value = {
      ...arcgisState.value,
      portalAuthenticated: false,
      signedInUserId: null
    };
    return;
  }

  try {
    await IdentityManager.checkSignInStatus(PORTAL_SHARING_URL);
    arcgisState.value = {
      ...arcgisState.value,
      portalAuthenticated: true,
      signedInUserId: getSignedInUserId()
    };
  } catch {
    arcgisState.value = {
      ...arcgisState.value,
      portalAuthenticated: false,
      signedInUserId: null
    };
  }
}

export async function signInWithOAuth(): Promise<void> {
  if (!ensureOAuthRegistered()) {
    throw new Error('OAuth is not configured. No OAuth Client ID available.');
  }
  console.info('[arcgis] opening OAuth sign-in popup', {
    portal: PORTAL_SHARING_URL,
    callbackUrl: getOAuthCallbackUrl(),
    clientId: OAUTH_CLIENT_ID,
  });
  try {
    await IdentityManager.getCredential(PORTAL_SHARING_URL);
  } catch (e) {
    console.error('[arcgis] OAuth sign-in failed (popup blocked or redirect URI not registered):', e);
    throw e;
  }
  await refreshPortalAuthStatus();
}

export function signOutFromOAuth(): void {
  IdentityManager.destroyCredentials();
  arcgisState.value = {
    ...arcgisState.value,
    portalAuthenticated: false,
    signedInUserId: null
  };
}

export async function initializeArcGIS(credentials: ArcGISCredentials): Promise<void> {
  try {
    arcgisState.value = {
      ...arcgisState.value,
      error: null
    };

    if (credentials.apiKey) {
      esriConfig.apiKey = credentials.apiKey;
      arcgisState.value = {
        ...arcgisState.value,
        apiKeySet: true
      };
    }

    if (ensureOAuthRegistered()) {
      await refreshPortalAuthStatus();
    }

    registerWmsProxyInterceptor();
    registerRequestErrorTracking();

    arcgisState.value = {
      ...arcgisState.value,
      initialized: true
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to initialize ArcGIS';
    arcgisState.value = {
      ...arcgisState.value,
      error: errorMessage
    };
    throw error;
  }
}

export function destroyArcGIS(): void {
  IdentityManager.destroyCredentials();
  esriConfig.apiKey = '';
  oauthInfo = null;
  arcgisState.value = {
    initialized: false,
    apiKeySet: false,
    portalAuthenticated: false,
    oauthClientId: undefined,
    signedInUserId: null,
    error: null
  };
}

export async function createLayerFromConfig(config: LayerConfig, tag?: string): Promise<LayerPreviewResult> {
  let layer: __esri.Layer;

  switch (config.type) {
    case 'wms': {
      const useProxy = shouldUseLocalWmsProxy();
      const url = useProxy ? getWmsProxyEndpoint() : config.source;
      const customParameters: Record<string, string> = {};

      if (config.options) {
        Object.entries(config.options).forEach(([key, value]) => {
          if (key !== 'layerNames' && key !== 'opacity' && key !== 'layerId') {
            customParameters[key] = String(value);
          }
        });
      }

      if (useProxy) {
        customParameters.target = config.source;
      }

      if (tag) {
        customParameters[TAG_PARAM] = tag;
      }

      layer = new WMSLayer({
        url,
        sublayers: config.options?.layerNames?.map(name => ({ name })) || [],
        opacity: config.options?.opacity ?? 1,
        customParameters: Object.keys(customParameters).length > 0 ? customParameters : undefined,
        useViewTime: true
      });
      break;
    }

    case 'tiled':
      layer = new TileLayer({
        url: config.source,
        opacity: config.options?.opacity ?? 1
      });
      break;

    case 'mapImage':
      layer = new MapImageLayer({
        url: config.source,
        opacity: config.options?.opacity ?? 1
      });
      break;

    case 'vectorTiled':
      layer = new VectorTileLayer({
        url: config.source,
        opacity: config.options?.opacity ?? 1
      });
      break;

    case 'feature':
      layer = new FeatureLayer({
        url: config.source,
        opacity: config.options?.opacity ?? 1
      });
      break;

    case 'portalItem': {
      const portalItem = new PortalItem({
        id: config.source,
        portal: { url: PORTAL_URL }
      });
      const rawLayerId = config.options?.layerId;
      const layerId = rawLayerId !== undefined ? Number(rawLayerId) : undefined;

      const portalLayer = await Layer.fromPortalItem({
        portalItem,
        layerId: Number.isFinite(layerId) ? layerId : undefined
      } as any);

      if (!portalLayer) {
        return { success: false, error: 'Failed to create layer from portal item' };
      }

      portalLayer.opacity = config.options?.opacity ?? 1;
      layer = portalLayer;
      break;
    }

    case 'wmts': {
      if (config.sourceKind === 'portalItem') {
        const portalItem = new PortalItem({
          id: config.source,
          portal: { url: PORTAL_URL }
        });

        const portalLayer = await Layer.fromPortalItem({ portalItem });

        if (!portalLayer) {
          return { success: false, error: 'Failed to create WMTS layer from portal item' };
        }

        portalLayer.opacity = config.options?.opacity ?? 1;
        layer = portalLayer;
        break;
      }

      const useProxy = shouldUseLocalWmsProxy();
      const url = useProxy ? getWmsProxyEndpoint() : config.source;
      const customParameters: Record<string, string> = {};

      if (config.options) {
        Object.entries(config.options).forEach(([key, value]) => {
          if (key !== 'layerNames' && key !== 'opacity' && key !== 'layerId' && key !== 'serviceMode') {
            customParameters[key] = String(value);
          }
        });
      }

      if (useProxy) {
        customParameters.target = config.source;
      }

      if (tag) {
        customParameters[TAG_PARAM] = tag;
      }

      const wmtsOptions: __esri.WMTSLayerProperties = {
        url,
        opacity: config.options?.opacity ?? 1,
        customParameters: Object.keys(customParameters).length > 0 ? customParameters : undefined
      };

      if (config.options?.serviceMode) {
        wmtsOptions.serviceMode = config.options.serviceMode as 'RESTful' | 'KVP';
      }

      const activeLayerId = config.options?.layerId ?? config.options?.layerNames?.[0];
      if (activeLayerId) {
        wmtsOptions.activeLayer = {
          id: String(activeLayerId)
        };
      }

      layer = new WMTSLayer(wmtsOptions);
      break;
    }

    default:
      return { success: false, error: `Unsupported layer type: ${(config as any).type}` };
  }

  return { success: true, layer };
}

export { Basemap };
