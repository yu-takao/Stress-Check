import { defineFunction } from '@aws-amplify/backend';

// PDFアップロード（固定のKBバケットに配置）
export const kbUpload = defineFunction({
  entry: './uploader.ts',
  environment: {
    KB_UPLOAD_REGION: 'us-east-1',
    KB_S3_BUCKET: 'kb-stress-check',
  },
  timeoutSeconds: 30,
});

// S3上のドキュメント一覧取得
export const kbList = defineFunction({
  entry: './list.ts',
  environment: {
    KB_UPLOAD_REGION: 'us-east-1',
    KB_S3_BUCKET: 'kb-stress-check',
  },
  timeoutSeconds: 30,
});

// S3上のドキュメント削除
export const kbDelete = defineFunction({
  entry: './delete.ts',
  environment: {
    KB_UPLOAD_REGION: 'us-east-1',
    KB_S3_BUCKET: 'kb-stress-check',
  },
  timeoutSeconds: 30,
});


