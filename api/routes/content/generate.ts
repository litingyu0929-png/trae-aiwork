import express, { type Request, type Response } from 'express';
import { generatePersonaContent } from '../../services/AIService';
import getSupabaseClient from '../../supabaseClient';

const router = express.Router();

router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    // 支援直接傳入 persona 物件 (For ContentFactory with dummy accounts)
    // 優先使用 persona 物件，如果沒有才嘗試用 persona_id 去資料庫查
    let { persona, persona_id, account_id, platform, asset_id, daily_task_id, idea_input, assets, assetDescription, assetType } = req.body;

    // 1. 讀取或設定人設
    // 如果有提供 persona_id，優先從資料庫讀取完整人設設定
    if (persona_id) {
      const { data: personaData, error: personaError } = await supabase
        .from('personas')
        .select('*')
        .eq('id', persona_id)
        .single();

      if (!personaError && personaData) {
        persona = personaData;
      } else {
        console.warn(`Persona ID ${persona_id} not found, falling back to provided object.`);
      }
    }

    if (!persona) {
        res.status(400).json({ error: '未提供人設資訊' });
        return;
    }

    // 2. 讀取素材 (Optional) - Support multiple assets (array) or single asset_id
    let asset = null;
    if (assets && Array.isArray(assets) && assets.length > 0) {
       // 如果傳入的是 asset IDs 陣列
       const { data: assetsData } = await supabase
        .from('assets')
        .select('*')
        .in('id', assets);
       
       if (assetsData && assetsData.length > 0) {
         // 合併素材內容
         const imageAsset = assetsData.find(a => a.asset_type === 'uploaded_image' || a.type === 'image'); // Support both conventions
         asset = {
           raw_content: assetsData.map(a => a.content_text || a.description || '').join('\n\n'),
           content_url: imageAsset?.content_url || imageAsset?.storage_path, // 優先取 content_url
           type: imageAsset ? 'image' : 'text'
         };
         
         // Note: If content_url is a local path (starts with /uploads), AIService will handle it.
         // We do NOT convert to Supabase public URL here because assets.ts uses local disk storage.
       }
    } else if (asset_id) {
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', asset_id)
        .single();

      if (assetError || !assetData) {
        // res.status(404).json({ error: '素材不存在' });
        // Don't fail, just continue without asset
      } else {
        asset = assetData;
      }
    }
    
    // Fallback: Use assetDescription from body if no DB asset
    if (!asset && assetDescription) {
        asset = { raw_content: assetDescription };
    }
    
    // Explicitly add idea_input to asset raw_content if provided
    if (idea_input) {
       if (asset) {
         asset.raw_content = `${idea_input}\n\n${asset.raw_content || ''}`;
       } else {
         asset = { raw_content: idea_input };
       }
    }

      // 3. 呼叫 AI 生成 (支援多平台)
      let generatedContent: any = {};

      if (!platform || platform === 'all') {
        // Generate for both Threads and Instagram
        // Now returns string directly from AIService
        const [threadsResult, instagramResult] = await Promise.all([
          generatePersonaContent(persona, asset, 'threads'), 
          generatePersonaContent(persona, asset, 'instagram')
        ]);
        
        generatedContent = {
          threads: threadsResult, 
          instagram: instagramResult,
          _meta: { persona: persona.name } // Mock meta
        };
      } else {
        // Generate for specific platform
        const result = await generatePersonaContent(persona, asset, platform);
        generatedContent = {
          [platform]: result,
          _meta: { persona: persona.name }
        };
      }

    // 4. 儲存任務 (Optional: Store primary content or task log)
    // For now, we return the generated content for preview. 
    // Task creation can be done in a separate 'publish' step or we store a record here.
    
    // Legacy support: Create a work_task if needed, using Threads content as default text
    let taskId = '';
    const primaryText = generatedContent.threads || generatedContent.instagram || '';

    // Save original content for feedback loop
    const originalContent = primaryText;

    if (daily_task_id) {
       // ... existing daily task update logic ...
       const { data: updatedTask, error: updateError } = await supabase
        .from('daily_tasks')
        .update({
          content_text: primaryText,
          asset_id: asset_id,
          status: 'generated',
          generated_at: new Date().toISOString()
        })
        .eq('id', daily_task_id)
        .select()
        .single();
      if (!updateError) taskId = updatedTask.id;
    } else {
        // Create new content record to track feedback
        // We use the 'contents' table for this now
        /*
        const { data: contentRecord, error: contentError } = await supabase
        .from('contents')
        .insert({
            asset_id: asset_id,
            persona: persona.name,
            content_text: primaryText,
            original_content: originalContent,
            status: 'draft'
        })
        .select()
        .single();
        */

        // Also create work_task for workflow compatibility
         /* const { data: task, error: taskError } = await supabase
        .from('work_tasks')
        .insert({
          persona_id,
          assigned_asset_id: asset_id,
          content_text: primaryText,
          platform: 'threads', // Default
          account_id,
          status: 'pending_publish'
        })
        .select()
        .single();
        if (!taskError) taskId = task.id;
        */
        
        // Return content_id for feedback tracking if needed
        // if (contentRecord) generatedContent._content_id = contentRecord.id;
    }

    res.status(200).json({
      ok: true,
      success: true,
      task_id: taskId,
      data: generatedContent // Return structure { threads: "...", instagram: "..." }
    });

  } catch (error: any) {
    console.error('Content Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
