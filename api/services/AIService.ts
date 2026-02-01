import OpenAI from 'openai';

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is missing in environment variables');
  }
  return new OpenAI({ apiKey });
};

export async function generatePersonaContent(
  persona: any,
  asset: any,
  taskType: string
): Promise<string> {
  const openai = getOpenAIClient();
  
  // 組裝 System Prompt
  const systemPrompt = `你是「${persona.name}」。

【核心價值】
${persona.core_value || '未設定'}

【語氣風格】
${persona.tone || '中性'}

【說話習慣】
${persona.speech_style?.habits?.join('、') || '無'}

【口頭禪（必須使用）】
${persona.catchphrases?.join('、') || '無'}

【硬性限制（絕對不能違反）】
${persona.constraints?.hard?.join('\n') || '無'}

【Few-shot 範例】
${persona.example_dialog || '無'}

你必須嚴格遵守以上人設，生成的內容要自然、簡短、有力。`;

  // 組裝 User Prompt
  let userPrompt = '';
  
  switch (taskType) {
    case 'post_sport_preview':
      userPrompt = `根據以下素材，生成一則運彩盤口分析貼文（150字內）：

【素材】
${asset?.processed_content || asset?.raw_content || '無素材'}

要求：
1. 使用口頭禪
2. 不要保證結果
3. 點到為止，留懸念
4. 加上相關 hashtag`;
      break;

    case 'post_sport_result':
      userPrompt = `根據以下素材，生成一則賽事結果分享貼文（100字內）：

【素材】
${asset?.processed_content || asset?.raw_content || '無素材'}

要求：
1. 簡短回顧
2. 不炫耀
3. 保持專業距離感`;
      break;

    case 'post_casino':
      userPrompt = `根據以下素材，生成一則百家樂/電子遊戲相關貼文（150字內）：

【素材】
${asset?.processed_content || asset?.raw_content || '無素材'}

要求：
1. 製造氛圍感
2. 不直接推銷
3. 引發好奇`;
      break;

    case 'post_lifestyle':
      userPrompt = `根據以下素材，生成一則生活感悟貼文（120字內）：
      
【素材】
${asset?.processed_content || asset?.raw_content || '無素材'}

要求：
1. 不要涉及運彩或博弈
2. 純粹分享生活態度
3. 展現人設的個人特質`;
      break;

    case 'post_story':
      userPrompt = `根據以下素材，生成一則限時動態文字（30字內）：

【素材】
${asset?.processed_content || asset?.raw_content || '無素材'}

要求：
1. 簡短有力
2. 製造懸念
3. 適合搭配圖片或影片`;
      break;

    case 'reply_dm':
      userPrompt = `模擬回覆私訊（50字內）：

【對方訊息/情境】
${asset?.processed_content || asset?.raw_content || '無內容'}

要求：
1. 語氣親切但保持距離
2. 不要直接給答案（若涉及預測）
3. 引導對方持續關注`;
      break;

    case 'comment_others':
      userPrompt = `生成一則留言（30字內）：

【目標貼文內容】
${asset?.processed_content || asset?.raw_content || '無內容'}

要求：
1. 自然互動
2. 不要硬推銷
3. 展現幽默或專業觀點`;
      break;

    case 'fake_conversation':
      userPrompt = `生成一段劇情殺對話（200字內），格式：
User: 問題
${persona.name}: 回覆
User: 追問
${persona.name}: 回覆（製造轉折或驚喜）

【主題/情境】
${asset?.processed_content || asset?.raw_content || '自由發揮'}`;
      break;

    case 'poll':
      userPrompt = `生成一個投票問題（50字內）：

【主題】
${asset?.processed_content || asset?.raw_content || '自由發揮'}

要求：
1. 提供 2-4 個選項
2. 引發討論
3. 具有爭議性或趣味性`;
      break;

    default:
      userPrompt = `根據以下素材生成一則貼文（150字內）：

【素材】
${asset?.processed_content || asset?.raw_content || '無素材'}

【任務類型】
${taskType}

請按照你的人設風格生成內容。`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 500
    });

    return completion.choices[0].message.content || '生成失敗';
    
  } catch (error: any) {
    console.error('OpenAI API 錯誤:', error);
    throw new Error('AI 生成失敗：' + error.message);
  }
}

export async function translateContent(text: string): Promise<string> {
  if (!text) return '';
  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a professional translator. Translate the following text into Traditional Chinese (Taiwan). Maintain the original tone and context. Only output the translated text.' },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
    });
    return completion.choices[0].message.content || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original
  }
}