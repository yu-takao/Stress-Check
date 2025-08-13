import { S3Client, PutObjectCommand, GetBucketLocationCommand } from '@aws-sdk/client-s3';
import type { Schema } from '../../data/resource';

// 初期クライアント（ロケーション取得用に us-east-1 を使用）
const s3Global = new S3Client({
  region: process.env.KB_UPLOAD_REGION || process.env.AWS_REGION || 'us-east-1',
});

async function resolveBucketRegion(bucketName: string): Promise<string> {
  try {
    const res = await s3Global.send(
      new GetBucketLocationCommand({ Bucket: bucketName })
    );
    // us-east-1 の場合は undefined/null が返ることがある
    const loc = (res.LocationConstraint as string | undefined) || 'us-east-1';
    // 古い表記 'EU' は eu-west-1 を意味する
    if (loc === 'EU') return 'eu-west-1';
    return loc;
  } catch {
    // 取得に失敗した場合はフォールバック
    return process.env.AWS_REGION || 'us-east-1';
  }
}

export const handler: Schema['uploadKnowledge']['functionHandler'] = async (event) => {
  try {
    console.log('uploadKnowledge event:', JSON.stringify(event).slice(0, 1000));
    const { fileName, contentBase64, bucket, prefix } = event.arguments as any;
    if (!fileName || !contentBase64) throw new Error('fileName and contentBase64 are required');

    const targetBucket = process.env.KB_S3_BUCKET || (bucket as string);
    if (!targetBucket) throw new Error('target bucket is required');
    const providedPrefix = (prefix as string | undefined) || '';
    const normalizedPrefix = providedPrefix === ''
      ? ''
      : providedPrefix.replace(/\/?$/, '/');
    const key = `${normalizedPrefix}${fileName}`;

    const body = Buffer.from(contentBase64, 'base64');
    const bucketRegion = await resolveBucketRegion(targetBucket);
    const s3Regional = new S3Client({ region: bucketRegion });
    console.log('PutObject to', { Bucket: targetBucket, Key: key, Size: body.length, Region: bucketRegion });
    await s3Regional.send(
      new PutObjectCommand({
        Bucket: targetBucket,
        Key: key,
        Body: body,
        ContentType: 'application/pdf',
      })
    );

    return JSON.stringify({ success: true, key });
  } catch (e) {
    console.error('uploadKnowledge error:', e);
    return JSON.stringify({ success: false, error: (e as any)?.message || String(e) });
  }
};


