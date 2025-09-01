import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
// import { BedrockAgentRuntimeClient, RetrieveCommand } from '@aws-sdk/client-bedrock-agent-runtime';
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

// RAG削除: Knowledge Bases クライアントは未使用

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
    const isCluster = (event.arguments as any).isCluster === true;
    const age = (event.arguments as any).age as number | undefined;
    const yearsOfService = (event.arguments as any).yearsOfService as number | undefined;
    const gender = (event.arguments as any).gender as 'male' | 'female' | undefined;
    const language = (event.arguments as any).language as string | undefined; // 'ja' | 'en' など
    const extraPrompt = (event.arguments as any).extraPrompt as string | undefined;

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
  yearsOfService,
  age,
  gender as 'male' | 'female',
  isCluster === true,
  language
);
    console.log('Generated prompt length:', prompt.length);
    console.log('Prompt preview:', prompt.substring(0, 200) + '...');

    // RAG削除: 参考資料の取得は行わない
    let finalPrompt = prompt;
    if (extraPrompt && String(extraPrompt).trim().length > 0) {
      finalPrompt = `${finalPrompt}\n\n【追加指示】\n${String(extraPrompt).trim()}`;
    }

    // Claude 3.5 Sonnet でコメント生成
    console.log('Calling Bedrock API...');
    const aiComment = await generateAiComment(finalPrompt);
    console.log('AI comment generated successfully, length:', aiComment.length);

    const analysisDetails = analyzeStressLevel(scores);
    console.log('Analysis details:', analysisDetails);

    const result = {
      success: true,
      aiComment,
      prompt: finalPrompt,
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

// 参考資料検索用に質問文を組み立て
function buildRetrieveQuery(
  subscaleScores: Record<string, { raw: number; eval: number; label: string; reverse?: boolean }>,
  department?: string,
  isCluster?: boolean
): string {
  const focus = Object.values(subscaleScores)
    .map((s) => ({ label: s.label, risk: s.reverse ? 6 - s.eval : s.eval }))
    .filter((s) => s.risk > 3)
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 5)
    .map((s) => s.label)
    .join('、');
  const target = isCluster ? `部署:${department ?? '不明'}` : `個人`;
  return `産業ストレスチェックに関する知見。対象=${target}。注目尺度=${focus}。根拠付きで解釈・分析する資料箇所を検索。`;
}

// RAG削除: retrieveContextsは削除

function truncate(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 1) + '…';
}

 /**
 * AIコメント生成用のプロンプトを作成
 */
function generatePrompt(
  scores: StressScores,
  subscaleScores: Record<string, { raw: number; eval: number; label: string; reverse?: boolean }>,
  userName?: string,
  department?: string,
  yearsOfService?: number,
  age?: number,
  gender?: 'male' | 'female',
  isCluster?: boolean,
  language?: string
): string {
  const lang = (language || 'ja').toLowerCase();
  const isEN = lang === 'en';
  const isZHCN = lang === 'zh-cn' || lang === 'zh' || lang === 'zh_hans';
  const isZHTW = lang === 'zh-tw' || lang === 'zh_hant';
  const isKO = lang === 'ko' || lang === 'kr' || lang === 'ko-kr';

  const langLabel = isEN
    ? 'English'
    : isZHCN
      ? '简体中文'
      : isZHTW
        ? '繁體中文'
        : isKO
          ? '한국어'
          : '日本語';

  const respondIn = isEN
    ? 'Please write the entire response in natural, fluent English.'
    : isZHCN
      ? '请使用自然、流畅的简体中文撰写全部回答。'
      : isZHTW
        ? '請使用自然、流暢的繁體中文撰寫全部回覆。'
        : isKO
          ? '자연스럽고 읽기 쉬운 한국어로 전체 응답을 작성해 주세요.'
          : '回答は自然で読みやすい日本語で、丁寧な「です・ます」調で記述してください。';

  // 評価点 (1-5) を日本語ラベルに変換（小数は四捨五入）
  const levelText = (v: number) => {
    const rounded = Math.max(1, Math.min(5, Math.round(v)));
    switch (rounded) {
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

  const genderText = isEN
    ? (gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Unknown')
    : isZHCN
      ? (gender === 'male' ? '男性' : gender === 'female' ? '女性' : '未知')
      : isZHTW
        ? (gender === 'male' ? '男性' : gender === 'female' ? '女性' : '未知')
        : isKO
          ? (gender === 'male' ? '남성' : gender === 'female' ? '여성' : '알 수 없음')
          : (gender === 'male' ? '男性' : gender === 'female' ? '女性' : '不明');

  const clusterMode = isCluster || (userName ?? '').includes('クラスタ');

  const header = clusterMode
    ? (isEN
        ? `You are an experienced organizational HR consultant. Based on the information below, write an analytical report (within 800 characters) about the group's stress status and underlying causes. Focus on explaining the current state and its causes in depth from multiple perspectives.`
        : isZHCN
          ? `你是一位经验丰富的组织改进人力资源顾问。请根据以下信息，撰写一份不超过800字的分析报告，说明小组的压力状况及其根本原因。重点从多个角度深入解释当前状态及其成因。`
          : isZHTW
            ? `你是一位經驗豐富的組織改善人資顧問。請根據以下資訊，撰寫一份不超過800字的分析報告，說明群組的壓力狀況及其根本原因。著重於從多個角度深入解釋目前的狀態與成因。`
            : isKO
              ? `당신은 경험 많은 조직개선 HR 컨설턴트입니다. 아래 정보를 바탕으로 그룹의 스트레스 상태와 근본 원인에 대한 분석 보고서를 800자 이내로 작성하세요. 현재 상태와 그 원인을 여러 관점에서 깊이 있게 설명하는 데 집중하세요.`
              : `あなたは経験豊富な組織改善人事コンサルタントです。以下の内容に従い、対象グループのストレス状況とその要因に関するレポートを800文字以内で作成してください。具体的な提案は不要なので、いまどういう状態にあり、それが何によって生じているのかを深く、多角的に分析してください。`)
    : (isEN
        ? `You are an experienced occupational physician/mental health professional. Based on the information below, produce a positive and actionable advice within 400 characters focusing on the most important scales.`
        : isZHCN
          ? `你是一位经验丰富的职业医生/心理健康专家。请根据以下信息，聚焦最重要的量表，在400字以内给出积极且可执行的建议。`
          : isZHTW
            ? `你是一位經驗豐富的職業醫師／心理健康專家。請根據以下資訊，聚焦最重要的量表，在400字以內提供正面且可執行的建議。`
            : isKO
              ? `당신은 숙련된 산업의/멘탈헬스 전문가입니다. 아래 정보를 바탕으로 가장 중요한 척도에 초점을 맞춰 400자 이내의 긍정적이고 실행 가능한 조언을 작성하세요.`
              : `あなたは経験豊富な産業医・メンタルヘルス専門家です。以下の情報を参考に、重要な尺度に焦点を当てて 400 文字以内で具体的かつ前向きなアドバイスを作成してください。`);

  const infoSectionTitle = clusterMode
    ? (isEN ? 'Group information' : isZHCN ? '小组信息' : isZHTW ? '群組資訊' : isKO ? '그룹 정보' : '対象グループ情報')
    : (isEN ? 'Subject information' : isZHCN ? '对象信息' : isZHTW ? '對象資訊' : isKO ? '대상자 정보' : '対象者情報');

  const infoLines = clusterMode
    ? (isEN ? `- Department: ${department ?? 'N/A'}` : isZHCN ? `- 部门: ${department ?? '未知'}` : isZHTW ? `- 部門: ${department ?? '未知'}` : isKO ? `- 부서: ${department ?? '알 수 없음'}` : `- 部署: ${department ?? '不明'}`)
    : (isEN
        ? `- Gender: ${genderText}\n- Age: ${age ?? 'N/A'}\n- Years of service: ${yearsOfService ?? 'N/A'}\n- Department: ${department ?? 'N/A'}`
        : isZHCN
          ? `- 性别: ${genderText}\n- 年龄: ${age ?? '未知'}\n- 工作年限: ${yearsOfService ?? '未知'}\n- 部门: ${department ?? '未知'}`
          : isZHTW
            ? `- 性別: ${genderText}\n- 年齡: ${age ?? '未知'}\n- 工作年資: ${yearsOfService ?? '未知'}\n- 部門: ${department ?? '未知'}`
            : isKO
              ? `- 성별: ${genderText}\n- 나이: ${age ?? '알 수 없음'}\n- 근속연수: ${yearsOfService ?? '알 수 없음'}\n- 부서: ${department ?? '알 수 없음'}`
              : `- 性別: ${genderText}\n- 年齢: ${age ?? '不明'}歳\n- 勤続年数: ${yearsOfService ?? '不明'}年\n- 部署: ${department ?? '不明'}`);

  if (clusterMode) {
    return `${header}

【${infoSectionTitle}】
${infoLines}

${isEN ? '【Key scales (5-point)】' : isZHCN ? '【关键量表（5分制）】' : isZHTW ? '【關鍵量表（5分制）】' : isKO ? '【주요 척도(5점 척도)】' : '【注目すべき尺度（5段階評価）】'}
${focusLines}

${isEN ? '【Instructions】' : isZHCN ? '【指示】' : isZHTW ? '【指示】' : isKO ? '【지시 사항】' : '【依頼事項】'}
1. ${isEN ? 'Provide appropriate organizational improvement proposals as an HR expert based on key scales' : isZHCN ? '基于关键量表，从人力资源专家角度提出适当的组织改进建议' : isZHTW ? '基於關鍵量表，從人資專家的角度提出適當的組織改善建議' : isKO ? '주요 척도를 바탕으로 HR 전문가로서 적절한 조직 개선 제안을 제시' : '注目すべき尺度をもとに、人事の専門家として適切な組織改善提案を提示'}
2. ${isEN ? 'Synthesize the scale results to capture and verbalize root problems' : isZHCN ? '综合量表结果，识别并用文字表达问题根源' : isZHTW ? '綜合量表結果，辨識並以文字表達問題根源' : isKO ? '척도 결과를 종합해 문제의 근본을 파악하고 언어화' : '尺度の結果を総合し、問題の根本を捉え、それを言語化する'}

${isEN ? '【Output language】English' : isZHCN ? '【输出语言】简体中文' : isZHTW ? '【輸出語言】繁體中文' : isKO ? '【출력 언어】한국어' : '【出力言語】日本語'}
${respondIn}

${isEN ? 'Advice:' : isZHCN ? '建议：' : isZHTW ? '建議：' : isKO ? '조언:' : 'アドバイス:'}`;
  }

  return `${header}

【${infoSectionTitle}】
${infoLines}

${isEN ? '【High stress determination】' : isZHCN ? '【高压力判定】' : isZHTW ? '【高壓力判定】' : isKO ? '【고스트레스 판정】' : '【高ストレス者判定】'}${scores.highStress ? (isEN ? ' Yes (attention needed)' : isZHCN ? ' 是（需注意）' : isZHTW ? ' 是（需注意）' : isKO ? ' 예(주의 필요)' : 'はい（要注意）') : (isEN ? ' No' : isZHCN ? ' 否' : isZHTW ? ' 否' : isKO ? ' 아니오' : 'いいえ')}

${isEN ? '【Key scales (5-point)】' : isZHCN ? '【关键量表（5分制）】' : isZHTW ? '【關鍵量表（5分制）】' : isKO ? '【주요 척도(5점 척도)】' : '【注目すべき尺度（5段階評価）】'}
${focusLines}

${isEN ? '【Advice requirements】' : isZHCN ? '【建议要求】' : isZHTW ? '【建議要件】' : isKO ? '【조언 요구 사항】' : '【アドバイス要件】'}
1. ${isEN ? 'Warm and friendly tone' : isZHCN ? '语气温和、友好' : isZHTW ? '語氣溫和、親切' : isKO ? '따뜻하고 친근한 어조' : '温かく親しみやすい語調（丁寧な「です・ます」調）'}
2. ${isEN ? 'Provide concrete and actionable suggestions' : isZHCN ? '提供具体且可执行的建议' : isZHTW ? '提供具體且可執行的建議' : isKO ? '구체적이고 실행 가능한 제안 제시' : '具体的で実行可能な改善策を提示'}
3. ${isEN ? 'Positive and hopeful content' : isZHCN ? '内容积极、给予希望' : isZHTW ? '內容正向、給予希望' : isKO ? '긍정적이고 희망적인 내용' : 'ポジティブで希望を持てる内容'}
4. ${isEN ? 'General mental health support, not medical diagnosis' : isZHCN ? '提供一般性心理健康支持，非医疗诊断' : isZHTW ? '提供一般性心理健康支持，非醫療診斷' : isKO ? '의학적 진단이 아닌 일반적 정신건강 지원' : '医療的診断ではなく一般的なメンタルヘルス支援として'}
5. ${isEN ? 'Encourage consultation with professionals when necessary' : isZHCN ? '必要时建议咨询专业机构' : isZHTW ? '必要時建議諮詢專業機構' : isKO ? '필요 시 전문가 상담 권장' : '必要に応じて専門機関への相談を推奨'}

${isEN ? '【Output language】English' : isZHCN ? '【输出语言】简体中文' : isZHTW ? '【輸出語言】繁體中文' : isKO ? '【출력 언어】한국어' : '【出力言語】日本語'}
${respondIn}

${isEN ? 'Advice:' : isZHCN ? '建议：' : isZHTW ? '建議：' : isKO ? '조언:' : 'アドバイス:'}`;
}

/**
 * Bedrock Claude 3.5 Sonnet でAIコメントを生成
 */
async function generateAiComment(prompt: string): Promise<string> {
  try {
    const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';
    console.log('Using Bedrock model:', modelId);
    console.log('Bedrock region:', process.env.BEDROCK_REGION || 'us-east-1');
    
    const requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1500,
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