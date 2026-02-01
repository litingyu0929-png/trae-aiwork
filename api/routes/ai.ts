import express, { type Request, type Response } from 'express';
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
     throw new Error('OpenAI API key is missing');
  }
  return new OpenAI({ apiKey });
};

router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { persona, assetType, assetDescription, platform, assetCategory, assetUrl } = req.body; // Add assetUrl parameter
    
    // Lazy load OpenAI
    const openai = getOpenAIClient();


    if (!persona) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    // Code-Driven Injection Setup - Fallback to Defaults if templates are empty
    // const voiceId = persona.voice_id || 'male_analyst';
    // const domainId = persona.domain_id || 'module_d';
    
    // Default fallback objects in case templates are deleted
    const defaultVoice = {
      label: 'Default',
      tone: 'Neutral',
      openings: ['你好', '分享一下'],
      closings: ['參考看看'],
      particles: ['啦', '喔'],
      keywords: [],
      banned_words: []
    };
    
    const defaultDomain = {
      label: 'General',
      slang: [],
      winning_phrases: ['不錯喔', '恭喜'],
      losing_phrases: ['下次努力', '沒關係'],
      keywords: [],
      banned: [],
      tone_override: ''
    };

    const voice = defaultVoice;
    const domain = defaultDomain;

    const getRandom = <T>(arr: T[] | undefined): T | string => {
      if (!arr || arr.length === 0) return '';
      return arr[Math.floor(Math.random() * arr.length)];
    };

    const randomOpening = getRandom(voice.openings);
    const randomClosing = getRandom(voice.closings);
    const randomSlangs = [...(domain.slang || [])]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .join("、");
    const isWinning = Math.random() > 0.5;
    const moodPhrases = isWinning ? domain.winning_phrases : domain.losing_phrases;
    const randomMood = getRandom(moodPhrases);

    let prompt = '';

    // Auto-Detect Objective logic (replacing manual taskType)
    // We will let the prompt handle the objective based on the assetCategory and content
    
    // Winning Category Forced Conversion check remains useful for context
    const isHarvesting = assetCategory === 'Winning' || assetCategory === 'Financial';
    const objective = isHarvesting ? 'dm_gate' : 'trust';

    // Define domain-specific instructions
    const domainInstructions = `
      🔥 DOMAIN KNOWLEDGE & TERMINOLOGY RULES (Trae Internalized) 🔥
      
      1. **Basketball Expert (籃球專家 - NBA/WNBA/JP/KR)**
         - ✅ Allowed Terms: 盤口, 水位, 讓分, 大小分, 獨贏, 防守效率, 籃板王, 蓋火鍋, pick and roll, 傷兵名單, 背靠背, 連續比賽.
         - ❌ Forbidden: 爆分, 路單, 洗碼, 六合彩.
         - Tone: Rational, data-driven, focus on "Rhythm", "Injury Impact", "Defensive Efficiency".
         
      2. **Baseball Expert (棒球專家 - MLB/JP/KR/CPBL)**
         - ✅ Allowed Terms: 先發輪值, 投手群, 鞭打率 (WHIP), OPS, K/9, FIP, 走地盤, 總分, 勝投敗投, 救援成功率.
         - ❌ Forbidden: 三分球, 爆分, 免遊大獎.
         - Tone: Professional, calm, focus on "Pitcher Duel", "Data Prediction".

      3. **Soccer Expert (足球專家 - EU/LaLiga/EPL/SerieA)**
         - ✅ Allowed Terms: 讓球盤, 亞盤, 歐賠, 大小球, 場均進球, xG, 控球率, 邊路突破, 防線漏洞, 傷停名單.
         - ❌ Forbidden: 籃板王, 路單, 六合彩開獎.
         - Tone: Tactical analysis, focus on "Formation Changes", "Key Player Absence".

      4. **Live Casino / Baccarat (真人視訊百家樂 - DG/DB/T9)**
         - ✅ Allowed Terms: 長龍, 單跳, 路單, 珠盤路, 大路, 小路, 莊閒, 補牌, 看燈, 砍龍, 洗牌, 退水.
         - ❌ Forbidden: 三分球, 爆分, 串關走地.
         - Tone: Steady, experienced, focus on "Mindset", "Roadmap Reading", "Chip Management".

      5. **Electronic Games (電子遊戲 - Slots/Fishing)**
         - ✅ Allowed Terms: 爆分, 免遊, 開大獎, 週期, 吐分期, 吃分期, 倍數, 消除, 鎖定, 雷神, 麻將胡了, 賽特大獎.
         - ❌ Forbidden: 盤口, 水位, 傷兵, 防守效率.
         - Tone: High energy, violent/exciting, focus on "Luck", "Instant Explosion", "Cycle Mastery".

      6. **Lottery Expert (彩票專家 - 6Mark/539/Daily)**
         - ✅ Allowed Terms: 冷門號, 熱門號, 大小單雙, 尾數, 三星, 四星, 五星, 連碰, 週期, 開獎規律, 特別號.
         - ❌ Forbidden: 盤口爆分, 路單莊閒, 投手輪值.
         - Tone: Mysterious, authoritative, focus on "Cycle Patterns", "Number Combinations", "Hot/Cold Transition".

      🔥 CROSS-MODULE MATCHING RULES (MUST FOLLOW) 🔥
      ✅ CORRECT:
      - Bank Screenshot -> Lottery Expert + "Collected winnings from yesterday's numbers"
      - Jackpot Screenshot -> Electronic Games + "AI data didn't lie, this machine's cycle exploded"
      - NBA Odds Image -> Basketball Expert + "Injuries impacting the rhythm, odds shifted"
      
      ❌ WRONG:
      - Lottery Result -> Basketball Expert talking about "Defensive Efficiency"
      - Jackpot Screenshot -> Lottery Expert talking about "Special Number Cycle"

      CRITICAL:
      - STRICTLY adhere to the terminology of the identified domain. DO NOT mix terms.
      - If the asset is about Sports, ONLY use Sports terms. If Slots, ONLY use Slots terms.
    `;

    // Define strategy-specific instructions
    // Remove the previous 'isHarvesting' declaration to avoid conflict
    
    // Updated: Remove matrix_type check, rely on objective
    const isHarvestingStrategy = objective === 'dm_gate';
    const harvestingInstructions = isHarvestingStrategy ? `
      🔥 CRITICAL INSTRUCTIONS FOR WINNING/CONVERSION (出金/收割) CONTENT 🔥
      
      CONTEXT: The user is using a "Winning Screenshot" (Bank balance, Casino win, Game Score) or Financial content.
      OBJECTIVE: ${objective} (Drive DMs/Conversion)
      
      ${domainInstructions}

      ❌ STRICTLY FORBIDDEN (AI-Speech/Robotic):
      - "Beautiful balance between life and numbers" (Too poetic/abstract)
      - "Symbol of success" (Too formal)
      - "Wisdom of investment" (Too preachy)
      - "Join our ranks" (Too corporate)
      - "Financial freedom", "Realize your dreams" (Too cliché scam-like)
      - DO NOT use emojis like 🌟 🏆 📩 in every sentence.
      - 禁止使用感性、哲学或模糊的表述。
      
      ✅ MANDATORY REQUIREMENTS:
      1. **Specific Amount**: You MUST mention specific numbers (e.g., "30k", "50倍", "入帳") if visible in asset.
      2. **Speed/Reality**: Emphasize speed of payout ("秒到帳", "收米速度", "真實性").
      3. **Timestamp/Immediacy**: Prove it's recent ("剛剛", "收工", "今晚").
      4. **Call to Action**: Direct instruction ("私訊", "+1", "領取方法").
      
      ✅ REQUIRED TONE (Real/Grounded/Human):
      - **Casual & Direct**: "收工。今天這單比較穩。" (Done. Today was stable.)
      - **Visual Pointing**: "圖在說話。" (The picture speaks.) or "看數字就好。" (Just look at the numbers.)
      - **System/Logic**: "跟著訊號走，就是這麼簡單。" (Follow the signal, it's that simple.)
      - **The "Sister/Guide" Vibe**: Cool, slightly superior but helpful. "很多人問我怎麼做到的，其實邏輯通了就不難。"
      
      STRUCTURE:
      1. Hook: One short sentence referencing the image result/amount.
      2. Body: 2-3 sentences max. Explain *why* (The System/Method) without being flowery. Mention speed/reality.
      3. CTA: Casual drop. "想學的私。" (DM to learn.) or "懂的就懂。" (IYKYK.)
    ` : `
      ${domainInstructions}
    `;
    
    if (platform === 'threads') {
       prompt = `
      You are a professional social media content creator.
      
      Persona: ${persona.name} (${persona.style})
      Persona Description: ${persona.description}
      
      Content Source: ${assetType} - ${assetDescription}

      ${harvestingInstructions}
      
      Please generate a Threads post based on the persona and content source:

      Threads Version:
         - Style: Conversational, text-heavy, short paragraphs, "hook" in the first line.
         - Focus: ${isHarvesting ? 'Direct Proof, "I told you so" vibe, Minimalist' : 'Sparking discussion, sharing opinions, "hot take"'}
         - Formatting: Plain text, max 1-2 emojis at the end. NO wall of text.
         - Length: Under 300 characters (Keep it punchy).
         - Mandatory Injections:
           * Opening: ${randomOpening}
           * Closing: ${randomClosing}
           * Slang: ${randomSlangs}

      Format the output as a JSON object with key: "threads".
      The content should be in Traditional Chinese (Taiwan).
      IMPORTANT: Use strict Taiwan sports terminology (e.g., Knicks=尼克, Pacers=溜馬, Raptors=暴龍).
      
      Use the Persona's tone: ${persona.tone || 'Neutral'}
      Use the Persona's catchphrases if defined: ${persona.catchphrases?.join(', ') || ''}
    `;
    } else if (platform === 'instagram') {
      prompt = `
      You are a professional social media content creator.
      
      Persona: ${persona.name} (${persona.style})
      Persona Description: ${persona.description}
      
      Content Source: ${assetType} - ${assetDescription}

      ${harvestingInstructions}
      
      Please generate an Instagram post based on the persona and content source:

      Instagram Version:
         - Style: Visual storytelling, engaging caption for an image/reel.
         - Focus: ${isHarvesting ? 'Aesthetic of Success, Data Visualization, Result Showcase' : 'Aesthetic, lifestyle, or quick value delivery'}
         - Formatting: Use emojis, listicles if applicable, "Link in bio" call to action.
         - Hashtags: Include 10-15 relevant hashtags at the bottom.
         - Mandatory Injections:
           * Opening: ${randomOpening}
           * Closing: ${randomClosing}
           * Slang: ${randomSlangs}

      Format the output as a JSON object with key: "instagram".
      The content should be in Traditional Chinese (Taiwan).
      IMPORTANT: Use strict Taiwan sports terminology (e.g., Knicks=尼克, Pacers=溜馬, Raptors=暴龍).
      
      Use the Persona's tone: ${persona.tone || 'Neutral'}
      Use the Persona's catchphrases if defined: ${persona.catchphrases?.join(', ') || ''}
      `;
    } else {
      // General Content Optimization Prompt
      prompt = `
      You are a professional social media editor optimizing user-provided content.
      
      Persona: ${persona.name} (${persona.style})
      Persona Description: ${persona.description}
      Persona Tone: ${persona.tone || 'Neutral'}
      Speech Habits: ${persona.catchphrases?.join(', ') || ''}
      
      User Input (Raw Content):
      "${assetDescription}"

      Your Task:
      1. Analyze the user's raw input to understand the core message and intent.
      2. Rewrite/Optimize this content to match the Persona's voice, tone, and speech habits perfectly.
      3. Ensure the content sounds like a REAL Taiwanese person (Traditional Chinese, Taiwan slang/colloquialisms).
      4. Maintain the original meaning but enhance the engagement and "human" feel.
      5. Add appropriate emojis and formatting for social media.

      Specific Requirements:
      - Language: Traditional Chinese (Taiwan).
      - Terminology: Use correct Taiwan terminology (e.g., video=影片, software=軟體).
      - Vibe: Authentic, organic, NOT AI-generated robot speak.
      - If the user input is very short, expand it slightly to make it a complete post.
      - If the user input is long, summarize/punch up the key points.
      
      Mandatory Injections (Must use at least 1-2 naturally):
      - Opening: ${randomOpening}
      - Closing: ${randomClosing}
      - Slang: ${randomSlangs}
      - Mood: ${randomMood}

      Please generate 2 versions:
      
      1. Threads Version:
         - Conversational, "talking to friends" vibe.
         - Short paragraphs.
         - Hook in the first line.
         - Under 500 characters.

      2. Instagram Version:
         - Visual/Caption style.
         - Engaging and shareable.
         - Include a call to action if appropriate.
         - Include 5-10 relevant hashtags.

      Format the output as a JSON object with keys: "threads", "instagram".
      `;
    }

    // Construct messages with optional image support
    const messages: any[] = [
      { role: "system", content: "You are a helpful assistant that outputs JSON." }
    ];

    if (assetUrl && (assetType === 'image' || assetType === 'video')) {
      let imageUrl = assetUrl;

      // Check if it is a local upload
      if (assetUrl.startsWith('/uploads/')) {
        try {
          // Resolve absolute path
          const localPath = path.join(process.cwd(), assetUrl);
          if (fs.existsSync(localPath)) {
             // Read file and convert to base64
             const imageBuffer = fs.readFileSync(localPath);
             const base64Image = imageBuffer.toString('base64');
             const mimeType = path.extname(localPath).substring(1) === 'jpg' ? 'jpeg' : path.extname(localPath).substring(1);
             imageUrl = `data:image/${mimeType};base64,${base64Image}`;
             console.log('[AI] Converted local image to Base64');
          } else {
             console.warn('[AI] Local image file not found:', localPath);
          }
        } catch (err) {
          console.error('[AI] Failed to read local image:', err);
        }
      }

      messages.push({
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      });
    } else {
      messages.push({ role: "user", content: prompt });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content generated');
    }

    const parsedContent = JSON.parse(content);
    console.log('[AI] Generated content:', parsedContent); // Debug log

    res.status(200).json({
      success: true,
      data: parsedContent
    });
  } catch (error: any) {
    console.error('AI Generation Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate content'
    });
  }
});

export default router;
