import * as fs from 'fs';
import * as path from 'path';
import { FigmaClient } from '../api/figma';
import { AssetRef } from '../types/internal';
import { config, logger } from '../../shared';

export interface DownloadResult {
  success: boolean;
  localPath: string;
  error?: string;
}

/**
 * Download assets (images/SVGs) from Figma and save them locally
 */
export async function downloadAssets(
  figmaClient: FigmaClient,
  fileKey: string,
  assets: AssetRef[],
  outputDir: string
): Promise<DownloadResult[]> {
  const results: DownloadResult[] = [];
  const assetsPath = path.join(outputDir, 'assets');

  // Ensure assets directory exists
  if (!fs.existsSync(assetsPath)) {
    fs.mkdirSync(assetsPath, { recursive: true });
    logger.debug(`Created assets directory: ${assetsPath}`);
  }

  for (const asset of assets) {
    try {
      const localPath = path.join(assetsPath, asset.filename);

      if (asset.type === 'svg') {
        // SVG content is already fetched
        if (asset.url) {
          const svgContent = await figmaClient.getSvgContent(fileKey, asset.id);
          fs.writeFileSync(localPath, svgContent, 'utf-8');
          logger.info(`Downloaded SVG: ${asset.filename}`);
        }
      } else {
        // Download image binary
        if (asset.url) {
          const imageBuffer = await figmaClient.downloadImage(asset.url);
          fs.writeFileSync(localPath, imageBuffer);
          logger.info(`Downloaded image: ${asset.filename} (${imageBuffer.length} bytes)`);
        }
      }

      results.push({
        success: true,
        localPath,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to download asset ${asset.filename}: ${errorMsg}`);
      results.push({
        success: false,
        localPath: path.join(assetsPath, asset.filename),
        error: errorMsg,
      });
    }
  }

  return results;
}

/**
 * Generate a unique filename for an asset
 */
export function generateAssetFilename(
  nodeId: string,
  componentName: string,
  type: 'image' | 'svg'
): string {
  const sanitizedName = componentName
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .toLowerCase();
  const extension = type === 'svg' ? '.svg' : '.png';
  const shortId = nodeId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  return `${sanitizedName}_${shortId}${extension}`;
}