import { defineBackend } from '@aws-amplify/backend';
import { Effect, PolicyStatement, Role, ServicePrincipal, ManagedPolicy, PolicyDocument } from 'aws-cdk-lib/aws-iam';
import { Bucket, BlockPublicAccess, BucketEncryption, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { stressAiComment } from './functions/stress-ai-comment/resource';
// RAG関連関数は削除

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  stressAiComment,
});

// Bedrockへのアクセス許可をLambda関数に付与
backend.stressAiComment.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'bedrock:InvokeModel',
      'bedrock:InvokeModelWithResponseStream',
      'bedrock:Retrieve',
    ],
    resources: [
      'arn:aws:bedrock:us-east-1:*:inference-profile/*',
      'arn:aws:bedrock:us-east-2:*:inference-profile/*',
      'arn:aws:bedrock:us-west-1:*:inference-profile/*',
      'arn:aws:bedrock:us-west-2:*:inference-profile/*',
      'arn:aws:bedrock:us-east-1::foundation-model/*',
      'arn:aws:bedrock:us-east-2::foundation-model/*',
      'arn:aws:bedrock:us-west-1::foundation-model/*',
      'arn:aws:bedrock:us-west-2::foundation-model/*',
      '*', // Retrieve 用（KB リソース ARN 未定のためデモではワイルドカード許容）
    ],
  })
);

// RAG用のS3バケット/ロール定義は削除

