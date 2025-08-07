import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import type { Schema } from '../../data/resource';

interface StressScores {
  scoreA: number; // 仕事のストレス要因（17項目）
  scoreB: number; // 心身のストレス反応（29項目）
  scoreC: number; // 周囲のサポート（9項目）
  total: number;
  highStress: boolean;
}

// Bedrock クライアントの初期化
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION || 'us-east-1',
});

/**
 * ストレススコアに基づいてAIコメントを生成する関数 (GraphQL Query Handler)
 */
export const handler: Schema['generateAiComment']['functionHandler'] = async (event) => {
  try {
    console.log('=== Lambda function started ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Environment variables:', {
      BEDROCK_REGION: process.env.BEDROCK_REGION,
      AWS_REGION: process.env.AWS_REGION,
    });

    const { scoreA, scoreB, scoreC, total, highStress, userName, department, subscaleScores } = event.arguments;
    const age = (event.arguments as any).age as number | undefined;
    const gender = (event.arguments as any).gender as 'male' | 'female' | undefined;

    // スコアオブジェクトを構築
    const scores: StressScores = {
      scoreA,
      scoreB,
      scoreC,
      total,
      highStress,
    };

    console.log('Processing stress scores:', scores);
    console.log('User info:', { userName, department });

    // スコア分析とプロンプト生成
    const parsedSubscaleScores = typeof subscaleScores === 'string' ? JSON.parse(subscaleScores) : subscaleScores;

    const prompt = generatePrompt(
  scores,
  parsedSubscaleScores,
  userName || undefined,
  department || undefined,
  age,
  gender as 'male' | 'female'
);
    console.log('Generated prompt length:', prompt.length);
    console.log('Prompt preview:', prompt.substring(0, 200) + '...');

    // Claude 3.5 Sonnet でコメント生成
    console.log('Calling Bedrock API...');
    const aiComment = await generateAiComment(prompt);
    console.log('AI comment generated successfully, length:', aiComment.length);

    const analysisDetails = analyzeStressLevel(scores);
    console.log('Analysis details:', analysisDetails);

    const result = {
      success: true,
      aiComment,
      prompt,
      scores,
      analysisDetails,
    };

    console.log('=== Lambda function completed successfully ===');
    console.log('Result summary:', {
      success: result.success,
      aiCommentLength: result.aiComment.length,
      hasAnalysisDetails: !!result.analysisDetails,
    });
    
    return JSON.stringify(result);

  } catch (error) {
    console.error('=== Lambda function error ===');
    console.error('Error type:', (error as any).constructor?.name || 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorResult = {
      success: false,
      error: 'AI コメントの生成に失敗しました。',
      details: error instanceof Error ? error.message : 'Unknown error',
      errorType: (error as any).constructor?.name || 'Unknown',
    };

    console.log('Returning error result:', errorResult);
    
    return JSON.stringify(errorResult);
  }
};

/**
 * ストレススコアの分析
 */
function analyzeStressLevel(scores: StressScores) {
  const { scoreA, scoreB, scoreC, highStress } = scores;
  
  return {
    workStressLevel: scoreA >= 45 ? 'high' : scoreA >= 30 ? 'medium' : 'low',
    physicalStressLevel: scoreB >= 77 ? 'high' : scoreB >= 50 ? 'medium' : 'low',
    // scoreC は逆転採点（高いほどサポート不足）なので意味を反転
    supportLevel: scoreC >= 25 ? 'low' : scoreC >= 20 ? 'medium' : 'high',
    overallRisk: highStress ? 'high' : 'normal',
    priorityAreas: getPriorityAreas(scores),
  };
}

/**
 * 優先的に改善が必要な領域を特定
 */
function getPriorityAreas(scores: StressScores): string[] {
  // ※ 領域ベースの旧ロジック（互換用）

  const areas: string[] = [];
  
  if (scores.scoreA >= 45) areas.push('仕事のストレス要因');
  if (scores.scoreB >= 70) areas.push('心身のストレス反応');
  if (scores.scoreC >= 25) areas.push('周囲のサポート不足');
  
    return areas;
 }

/**
 * 優先的に改善が必要な尺度を抽出
 */
function getPriorityScales(
  subscaleScores: Record<string, { raw: number; eval: number; label: string; reverse?: boolean }>
): string[] {
  const scales: string[] = [];
  Object.entries(subscaleScores).forEach(([id, info]) => {
    if (info.reverse) {
      // 逆転尺度: 評価が低いほど状態が悪い
      if (info.eval <= 2) {
        scales.push(`${id} ${info.label}`);
      }
    } else {
      // 通常尺度: 評価が高いほど状態が悪い
      if (info.eval >= 4) {
        scales.push(`${id} ${info.label}`);
      }
    }
  });
  return scales;
}

 /**
 * AIコメント生成用のプロンプトを作成
 */
function generatePrompt(
  scores: StressScores,
  subscaleScores: Record<string, { raw: number; eval: number; label: string; reverse?: boolean }>,
  userName?: string,
  department?: string,
  age?: number,
  gender?: 'male' | 'female'
): string {
  const levelText = (v: number) => {
    switch (v) {
      case 1:
        return '低い';
      case 2:
        return 'やや低い';
      case 3:
        return '中程度';
      case 4:
        return 'やや高い';
      case 5:
        return '高い';
      default:
        return '';
    }
  };

  // 中程度(3) を除外して注目尺度を抽出
  const focusLines = Object.entries(subscaleScores)
    .filter(([, info]) => {
      const riskEval = info.reverse ? 6 - info.eval : info.eval; // リスク指標
      return riskEval > 3; // 高リスクのみ抽出
    })
    .map(([, info]) => {
      const descriptor = levelText(info.eval); // 表示用は反転しない
      return `- ${info.label}: ${descriptor}`;
    })
    .join('\n');

  const genderText = gender === 'male' ? '男性' : gender === 'female' ? '女性' : '不明';

  return `あなたは経験豊富な産業医・メンタルヘルス専門家です。以下の情報を参考に、重要な尺度に焦点を当てて 400 文字以内で具体的かつ前向きなアドバイスを作成してください。

【対象者情報】
- 性別: ${genderText}
- 年齢: ${age ?? '不明'}歳
- 部署: ${department ?? '不明'}

【高ストレス者判定】${scores.highStress ? 'はい（要注意）' : 'いいえ'}

【注目すべき尺度（5段階評価）】
${focusLines}

【アドバイス要件】
1. 温かく親しみやすい語調
2. 具体的で実行可能な改善策を提示
3. ポジティブで希望を持てる内容
4. 医療的診断ではなく一般的なメンタルヘルス支援として
5. 必要に応じて専門機関への相談を推奨

アドバイス:`;
}

/**
 * Bedrock Claude 3.5 Sonnet でAIコメントを生成
 */
async function generateAiComment(prompt: string): Promise<string> {
  try {
    const modelId = 'us.anthropic.claude-sonnet-4-20250514-v1:0';
    console.log('Using Bedrock model:', modelId);
    console.log('Bedrock region:', process.env.BEDROCK_REGION || 'us-east-1');
    
    const requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    console.log('Bedrock request body:', JSON.stringify(requestBody, null, 2));

    const command = new InvokeModelCommand({
      modelId,
      body: JSON.stringify(requestBody),
      contentType: 'application/json',
    });

    console.log('Sending request to Bedrock...');
    const response = await bedrockClient.send(command);
    console.log('Bedrock response metadata:', {
      statusCode: response.$metadata.httpStatusCode,
      requestId: response.$metadata.requestId,
    });
    
    if (!response.body) {
      throw new Error('No response body from Bedrock');
    }

    const responseText = new TextDecoder().decode(response.body);
    console.log('Raw Bedrock response:', responseText);
    
    const responseData = JSON.parse(responseText);
    console.log('Parsed Bedrock response:', responseData);
    
    if (!responseData.content || !responseData.content[0]?.text) {
      throw new Error(`Invalid response format from Bedrock: ${JSON.stringify(responseData)}`);
    }

    const aiComment = responseData.content[0].text.trim();
    console.log('Extracted AI comment length:', aiComment.length);
    
    return aiComment;
  } catch (error) {
    console.error('Bedrock API error details:', {
      errorType: (error as any).constructor?.name || 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorCode: (error as any).$metadata?.httpStatusCode,
      errorStack: error instanceof Error ? error.stack : 'No stack trace',
    });
    
    // Bedrock固有のエラーをより分かりやすく
    if (error instanceof Error) {
      if (error.message.includes('AccessDenied') || error.message.includes('UnauthorizedOperation')) {
        throw new Error('Bedrock API へのアクセス権限がありません。IAM ロールを確認してください。');
      }
      if (error.message.includes('ValidationException')) {
        throw new Error('Bedrock API リクエストの形式が無効です。');
      }
      if (error.message.includes('ThrottlingException')) {
        throw new Error('Bedrock API のレート制限に達しました。しばらく待ってから再試行してください。');
      }
      if (error.message.includes('ModelNotReadyException')) {
        throw new Error('Claude 3.5 Sonnet モデルが利用できません。');
      }
    }
    
    throw error; // 元のエラーを再throw
  }
}