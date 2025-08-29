import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { stressAiComment } from '../functions/stress-ai-comment/resource';

/*== ストレスチェックアプリのデータモデル =====================================
職業性ストレス簡易調査票（57項目）の結果を保存するためのスキーマ定義
=========================================================================*/
const schema = a.schema({
  StressResult: a
    .model({
      userId: a.string().required(),
      userName: a.string(),
      department: a.string(),
      age: a.integer(),
      scoreA: a.integer().required(),  // 仕事のストレス要因（17項目）
      scoreB: a.integer().required(),  // 心身のストレス反応（29項目）
      scoreC: a.integer().required(),  // 周囲のサポート（9項目）
      total: a.integer().required(),   // 合計スコア
      highStress: a.boolean().required(), // 高ストレス者判定
      testDate: a.datetime().required(),
      responses: a.json(),             // 57項目の回答データ
      aiComment: a.string(),           // AI生成コメント
    })
    .authorization((allow) => [
      allow.owner(),                   // 所有者のみアクセス可能
      allow.authenticated().to(['read']) // 認証済みユーザーは読み取り可能
    ]),
    
  // カスタムクエリ：Lambda関数経由でAIコメントを生成
  generateAiComment: a
    .query()
    .arguments({
      scoreA: a.integer().required(),
      scoreB: a.integer().required(), 
      scoreC: a.integer().required(),
      total: a.integer().required(),
      highStress: a.boolean().required(),
      userName: a.string(),
      department: a.string(),
      age: a.integer(),
      gender: a.string(),
      language: a.string(),
      extraPrompt: a.string(),
      subscaleScores: a.json().required(),
    })
    .returns(a.json())
    .handler(a.handler.function(stressAiComment))
    .authorization((allow) => allow.publicApiKey()),

  // RAG関連APIは削除

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
