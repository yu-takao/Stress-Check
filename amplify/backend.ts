import { defineBackend } from '@aws-amplify/backend';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { stressAiComment } from './functions/stress-ai-comment/resource';

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
    ],
  })
);
