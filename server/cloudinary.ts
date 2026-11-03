import cloudinaryPkg from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

const cloudinary = cloudinaryPkg.v2;

export interface CloudinaryConfigStatus {
  configured: boolean;
  cloudName?: string;
  hasApiKey: boolean;
  hasApiSecret: boolean;
  missingVariables: string[];
}

/**
 * Checks whether the required Cloudinary environment variables are set.
 */
export function getCloudinaryStatus(): CloudinaryConfigStatus {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  const missing: string[] = [];
  if (!cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!apiKey) missing.push('CLOUDINARY_API_KEY');
  if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');

  return {
    configured: missing.length === 0,
    cloudName: cloudName || undefined,
    hasApiKey: Boolean(apiKey),
    hasApiSecret: Boolean(apiSecret),
    missingVariables: missing,
  };
}

/**
 * Initializes and returns the configured Cloudinary instance.
 * Throws a detailed error if any required environment variable is missing.
 */
export function getCloudinaryClient() {
  const status = getCloudinaryStatus();
  if (!status.configured) {
    throw new Error(
      `Cloudinary configuration missing on server: ${status.missingVariables.join(', ')}`
    );
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!.trim(),
    api_key: process.env.CLOUDINARY_API_KEY!.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET!.trim(),
    secure: true,
  });

  return cloudinary;
}

/**
 * Uploads an image dataUrl or buffer to Cloudinary and returns the permanent HTTPS secure_url.
 */
export async function uploadToCloudinary(
  dataUrlOrBuffer: string | Buffer,
  options: {
    folder?: string;
    publicId?: string;
    filename?: string;
  } = {}
): Promise<{
  url: string;
  publicId: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}> {
  const client = getCloudinaryClient();
  const folder = options.folder || 'white_kingdom';

  let uploadPayload: string;
  if (Buffer.isBuffer(dataUrlOrBuffer)) {
    // Convert Buffer to base64 data URI
    uploadPayload = `data:image/png;base64,${dataUrlOrBuffer.toString('base64')}`;
  } else {
    uploadPayload = dataUrlOrBuffer;
  }

  const result: UploadApiResponse = await client.uploader.upload(uploadPayload, {
    folder,
    public_id: options.publicId,
    resource_type: 'image',
    use_filename: Boolean(options.filename),
    unique_filename: true,
    overwrite: false,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
  };
}

/**
 * Optional helper to delete an image from Cloudinary by its public ID or Cloudinary URL.
 */
export async function deleteFromCloudinary(publicIdOrUrl: string): Promise<boolean> {
  const status = getCloudinaryStatus();
  if (!status.configured) {
    return false;
  }

  try {
    const client = getCloudinaryClient();
    let publicId = publicIdOrUrl;

    // If a full Cloudinary URL was provided, attempt to extract the public_id
    if (publicIdOrUrl.includes('cloudinary.com')) {
      const match = publicIdOrUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
      if (match && match[1]) {
        publicId = match[1];
      }
    }

    const res = await client.uploader.destroy(publicId);
    return res.result === 'ok';
  } catch (err) {
    console.warn('Failed to delete image from Cloudinary:', err);
    return false;
  }
}
