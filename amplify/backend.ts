import { defineBackend } from '@aws-amplify/backend';
import { Effect, PolicyStatement, Role, ServicePrincipal, ManagedPolicy, PolicyDocument } from 'aws-cdk-lib/aws-iam';
import { Bucket, BlockPublicAccess, BucketEncryption, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { stressAiComment } from './functions/stress-ai-comment/resource';
import { kbUpload, kbList, kbDelete } from './functions/kb-upload/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  stressAiComment,
  kbUpload,
  kbList,
  kbDelete,
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

// kb-upload 関数に S3 への Put 権限（デモ簡略化のためワイルドカード）
backend.kbUpload.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['s3:PutObject', 's3:ListBucket', 's3:PutObjectAcl', 's3:GetBucketLocation'],
    resources: ['*'],
  })
);

// kb-list 関数に S3 参照権限
backend.kbList.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['s3:ListBucket', 's3:GetObject'],
    resources: ['*'],
  })
);

// kb-delete 関数に削除権限
backend.kbDelete.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['s3:DeleteObject'],
    resources: ['*'],
  })
);

// === RAG 用のS3バケットとBedrockデータアクセスロール（コード化） ===
const kbBucket = new Bucket(backend.stack, 'KnowledgeBaseBucket', {
  blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
  enforceSSL: true,
  encryption: BucketEncryption.S3_MANAGED,
  cors: [
    {
      allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.HEAD],
      allowedOrigins: ['*'],
      allowedHeaders: ['*'],
      exposedHeaders: ['ETag'],
      maxAge: 3000,
    },
  ],
});

const bedrockDataAccessRole = new Role(backend.stack, 'BedrockKbDataAccessRole', {
  assumedBy: new ServicePrincipal('bedrock.amazonaws.com'),
  description: 'Allows Bedrock Knowledge Bases to read documents from the S3 knowledge bucket',
});

bedrockDataAccessRole.addToPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['s3:ListBucket'],
    resources: [kbBucket.bucketArn],
  })
);

bedrockDataAccessRole.addToPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['s3:GetObject'],
    resources: [`${kbBucket.bucketArn}/knowledge/*`],
  })
);

// Lambda側ではKB_IDのみ必要（S3情報はKB側で管理するため環境変数は不要）

