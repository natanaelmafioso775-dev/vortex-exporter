// ============================================================================
// Figma API Client — Conexão completa com a REST API do Figma
// ============================================================================

import axios, { AxiosInstance } from 'axios';
import { config, FigmaApiError, logger } from '../../shared';
import { FigmaFileResponse, FigmaImageResponse, FigmaVariablesResponse } from '../types';

const FIGMA_BASE = `${config.figmaApiBaseUrl}/${config.figmaApiVersion}`;

export class FigmaClient {
  private api: AxiosInstance;

  constructor(token?: string) {
    this.api = axios.create({
      headers: { 'X-Figma-Token': token || '' },
      timeout: 60000,
    });
  }

  setToken(token: string): void {
    this.api.defaults.headers['X-Figma-Token'] = token;
  }

  // ====================================================================
  // TOKEN VALIDATION
  // ====================================================================

  async validateToken(): Promise<{ valid: boolean; message?: string }> {
    try {
      // Testa o token com um endpoint leve (GET /me)
      const res = await this.api.get(`${FIGMA_BASE}/me`);
      return { valid: true };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 403) {
          return { valid: false, message: 'Token inválido ou sem permissão. Gere um novo token em https://www.figma.com/developers/api' };
        }
        if (status === 429) {
          return { valid: false, message: 'Rate limit excedido na API do Figma. Aguarde 60 segundos e tente novamente.' };
        }
      }
      return { valid: false, message: `Erro ao validar token: ${error.message}` };
    }
  }

  // ====================================================================
  // RETRY HELPER
  // ====================================================================

  private async withRetry<T>(fn: () => Promise<T>, context: string, maxRetries: number = 1): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        const status = error?.response?.status || error?.statusCode || 0;
        
        if (status === 429) {
          const retryAfter = error?.response?.headers?.['retry-after'];
          const planTier = error?.response?.headers?.['x-figma-plan-tier'];
          const upgradeLink = error?.response?.headers?.['x-figma-upgrade-link'];
          
          // Se o retry-after for muito longo (>5 min), é bloqueio permanente do plano gratuito
          if (retryAfter && parseInt(retryAfter) > 300) {
            const msg = `Sua conta Figma (${planTier || 'starter'}) foi bloqueada da API REST.`;
            const hint = upgradeLink ? `Faça upgrade em: ${upgradeLink}` : 'Crie um token pessoal em https://www.figma.com/developers/api';
            throw new FigmaApiError(`${msg} ${hint}`, 429, { retryAfter, planTier, upgradeLink });
          }
          
          // Rate limit normal - tenta novamente
          if (attempt < maxRetries) {
            const waitMs = Math.min(parseInt(retryAfter || '30') * 1000, 60000);
            logger.warn(`[FigmaAPI] Rate limit hit on "${context}", retrying in ${waitMs/1000}s (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitMs));
            continue;
          }
        }
        throw error;
      }
    }
    throw new FigmaApiError(`Max retries exceeded for: ${context}`, 429, {});
  }

  // ====================================================================
  // FILE OPERATIONS
  // ====================================================================

  async getFile(fileKey: string): Promise<FigmaFileResponse> {
    logger.info(`[FigmaAPI] Fetching file: ${fileKey}`);
    return this.withRetry(async () => {
      const res = await this.api.get<FigmaFileResponse>(`${FIGMA_BASE}/files/${fileKey}`);
      return res.data;
    }, `getFile(${fileKey})`);
  }

  async getFileNodes(fileKey: string, nodeIds: string[]): Promise<FigmaFileResponse> {
    const ids = nodeIds.join(',');
    logger.info(`[FigmaAPI] Fetching nodes: ${ids}`);
    try {
      const res = await this.api.get<FigmaFileResponse>(`${FIGMA_BASE}/files/${fileKey}/nodes`, {
        params: { ids },
      });
      return res.data;
    } catch (error: any) {
      throw this.handleError(error, `Failed to fetch nodes: ${ids}`);
    }
  }

  // ====================================================================
  // IMAGE OPERATIONS
  // ====================================================================

  async getImageUrls(fileKey: string, nodeIds: string[], format: string = 'png'): Promise<FigmaImageResponse> {
    const ids = nodeIds.join(',');
    logger.info(`[FigmaAPI] Fetching image URLs (${format}): ${ids}`);
    try {
      const res = await this.api.get<FigmaImageResponse>(`${FIGMA_BASE}/images/${fileKey}`, {
        params: { ids, format, use_absolute_bounds: true },
      });
      return res.data;
    } catch (error: any) {
      throw this.handleError(error, `Failed to fetch image URLs`);
    }
  }

  async getSvgContent(fileKey: string, nodeId: string): Promise<string> {
    logger.info(`[FigmaAPI] Fetching SVG: ${nodeId}`);
    try {
      const res = await this.api.get<FigmaImageResponse>(`${FIGMA_BASE}/images/${fileKey}`, {
        params: { ids: nodeId, format: 'svg', svg_include_id: true },
      });
      const imageUrl = res.data.images[nodeId];
      if (!imageUrl) {
        throw new FigmaApiError(`No SVG URL returned for node ${nodeId}`, undefined, { nodeId });
      }
      const svg = await axios.get<string>(imageUrl);
      return svg.data;
    } catch (error: any) {
      throw this.handleError(error, `Failed to fetch SVG: ${nodeId}`);
    }
  }

  async getImageFills(fileKey: string): Promise<FigmaImageResponse> {
    logger.info(`[FigmaAPI] Fetching image fills for file: ${fileKey}`);
    try {
      const res = await this.api.get<FigmaImageResponse>(`${FIGMA_BASE}/files/${fileKey}/images`);
      return res.data;
    } catch (error: any) {
      throw this.handleError(error, `Failed to fetch image fills`);
    }
  }

  async downloadImage(url: string): Promise<Buffer> {
    try {
      const res = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
      return Buffer.from(res.data);
    } catch (error: any) {
      throw this.handleError(error, `Failed to download image: ${url}`);
    }
  }

  // ====================================================================
  // VARIABLES (Design Tokens)
  // ====================================================================

  async getFileVariables(fileKey: string): Promise<FigmaVariablesResponse | null> {
    try {
      const res = await this.api.get<FigmaVariablesResponse>(`${FIGMA_BASE}/files/${fileKey}/variables/local`);
      return res.data;
    } catch {
      logger.debug('[FigmaAPI] Variables endpoint not available (may need OAuth)');
      return null;
    }
  }

  // ====================================================================
  // STYLES
  // ====================================================================

  async getFileStyles(fileKey: string): Promise<{ meta: { styles: Record<string, any> } }> {
    try {
      const res = await this.api.get<{ meta: { styles: Record<string, any> } }>(`${FIGMA_BASE}/files/${fileKey}/styles`);
      return res.data;
    } catch (error: any) {
      throw this.handleError(error, `Failed to fetch styles`);
    }
  }

  async getStyle(styleKey: string): Promise<any> {
    try {
      const res = await this.api.get(`${FIGMA_BASE}/styles/${styleKey}`);
      return res.data;
    } catch (error: any) {
      throw this.handleError(error, `Failed to fetch style: ${styleKey}`);
    }
  }

  // ====================================================================
  // COMMENTS
  // ====================================================================

  async getComments(fileKey: string): Promise<any> {
    try {
      const res = await this.api.get(`${FIGMA_BASE}/files/${fileKey}/comments`);
      return res.data;
    } catch {
      return [];
    }
  }

  // ====================================================================
  // URL PARSING
  // ====================================================================

  static extractFileKey(figmaUrl: string): string {
    const patterns = [
      /figma\.com\/(file|design|proto)\/([a-zA-Z0-9]+)/,
    ];
    for (const pattern of patterns) {
      const match = figmaUrl.match(pattern);
      if (match) return match[2];
    }
    throw new FigmaApiError(
      'Invalid Figma URL. Expected: https://www.figma.com/file/{fileKey}/...',
      undefined, { url: figmaUrl }
    );
  }

  // ====================================================================
  // ERROR HANDLING
  // ====================================================================

  private handleError(error: any, context: string): FigmaApiError {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;
      const message = data?.message || data?.err || error.message;
      const headers = error.response?.headers;
      
      // Log detalhado para debug
      logger.error(`[FigmaAPI] Error: ${context}`);
      logger.error(`[FigmaAPI] Status: ${status}`);
      logger.error(`[FigmaAPI] URL: ${error.config?.url}`);
      if (data) logger.error(`[FigmaAPI] Response body: ${JSON.stringify(data).substring(0, 500)}`);
      if (headers) {
        logger.error(`[FigmaAPI] Rate limit headers: remaining=${headers['x-ratelimit-remaining'] || 'N/A'}, reset=${headers['x-ratelimit-reset'] || 'N/A'}`);
      }
      
      return new FigmaApiError(`${context}: ${message}`, status, { 
        status, 
        url: error.config?.url,
        rateLimitRemaining: headers?.['x-ratelimit-remaining'],
        rateLimitReset: headers?.['x-ratelimit-reset'],
      });
    }
    logger.error(`[FigmaAPI] Non-HTTP error: ${error.message}`);
    return new FigmaApiError(`${context}: ${error.message}`, undefined, {});
  }
}