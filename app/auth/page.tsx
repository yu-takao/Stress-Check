"use client";

import { Authenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import amplifyConfig from '../../lib/amplify-config';

const client = generateClient<Schema>();

export default function AuthPage() {
  return (
    <main className="p-8 min-h-screen flex flex-col items-center justify-start">
      <h1 className="text-2xl font-bold mb-8">ストレスチェック - 認証テスト</h1>
      
      <Authenticator>
        {({ signOut, user }) => (
          <div className="max-w-md w-full space-y-4">
            <div className="bg-green-100 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-green-800">
                ログイン成功！
              </h2>
              <p className="text-green-700">
                ユーザー: {user?.signInDetails?.loginId}
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">AWS Amplifyの機能が使用可能:</h3>
              <ul className="text-sm text-gray-600 list-disc list-inside">
                <li>✅ Cognito認証</li>
                <li>✅ DynamoDB データベース</li>
                <li>✅ AppSync GraphQL API</li>
                <li>✅ リアルタイム同期</li>
              </ul>
            </div>
            
            <button 
              onClick={signOut}
              className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              サインアウト
            </button>
            
            <div className="mt-4">
              <a 
                href="/"
                className="text-blue-500 hover:underline"
              >
                ← メインページに戻る
              </a>
            </div>
          </div>
        )}
      </Authenticator>
    </main>
  );
}