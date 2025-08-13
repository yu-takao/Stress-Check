import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { Schema } from '../../data/resource';

const s3 = new S3Client({ region: process.env.KB_UPLOAD_REGION || process.env.AWS_REGION || 'us-east-1' });

export const handler: Schema['deleteKnowledgeDoc']['functionHandler'] = async (event) => {
  try {
    const bucket = process.env.KB_S3_BUCKET!;
    const { key } = (event.arguments || {}) as any;
    if (!key) return JSON.stringify({ success: false, error: 'key is required' });
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return JSON.stringify({ success: true, key });
  } catch (e) {
    return JSON.stringify({ success: false, error: (e as any)?.message || String(e) });
  }
};


