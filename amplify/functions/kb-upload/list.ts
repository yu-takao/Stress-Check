import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import type { Schema } from '../../data/resource';

const s3 = new S3Client({ region: process.env.KB_UPLOAD_REGION || process.env.AWS_REGION || 'us-east-1' });

export const handler: Schema['listKnowledgeDocs']['functionHandler'] = async (event) => {
  try {
    const bucket = process.env.KB_S3_BUCKET!;
    const { prefix = '', maxKeys = 100 } = (event.arguments || {}) as any;
    const res = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: Math.min(Number(maxKeys) || 100, 1000) })
    );
    const items = (res.Contents || [])
      .filter((o) => (o.Key || '').toLowerCase().endsWith('.pdf'))
      .map((o) => ({ key: o.Key, size: o.Size, lastModified: o.LastModified }));
    return JSON.stringify({ success: true, bucket, prefix, items });
  } catch (e) {
    return JSON.stringify({ success: false, error: (e as any)?.message || String(e) });
  }
};


