import { defineFunction } from '@aws-amplify/backend';

export const stressAiComment = defineFunction({
  entry: './handler.ts',
  environment: {
    // Bedrock APIのリージョン設定
    BEDROCK_REGION: 'us-east-1', // Claude 3.5 Sonnetが利用可能なリージョン
  },
  timeoutSeconds: 60, // AI処理のため長めに設定
});