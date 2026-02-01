import express, { type Request, type Response } from 'express';
import getSupabaseClient from '../supabaseClient';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure Multer for file uploads
const fsRoot = process.env.VERCEL ? '/tmp' : process.cwd();
const uploadDir = path.join(fsRoot, 'uploads/assets/images');
const thumbnailDir = path.join(fsRoot, 'uploads/assets/thumbnails');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true });
  }
} catch {
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WebP, and GIF are allowed.'));
    }
  }
});

// GET /api/assets - Get assets with filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    // Disable caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const view = req.query.view as string || 'all';
    // const userId = req.user?.id; // Assuming auth middleware populates req.user
    // For demo purposes, we'll simulate a user ID or just handle 'shared' logic
    // Since we don't have full auth middleware in this snippet, we'll assume a dummy user ID or skip owner check for 'my' view if not auth
    const currentUserId = '00000000-0000-0000-0000-000000000000'; // Replace with actual user ID from auth

    let query = supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (view === 'my') {
      // For demo: if currentUserId is dummy, and we don't strictly enforce auth, 
      // maybe we should query by 'manual_upload' or just by the dummy ID if we enforce it on upload.
      // Let's enforce the dummy ID usage for now.
      query = query.eq('owner_id', currentUserId);
    } else if (view === 'shared') {
      query = query.eq('visibility', 'shared');
    } else {
      // view === 'all'
      // Logic: My assets OR Shared assets
      // Supabase OR syntax: .or(`owner_id.eq.${currentUserId},visibility.eq.shared`)
      // But for simplicity in this demo environment without real auth, we might just return everything or just shared + public
       query = query.or(`visibility.eq.shared,visibility.eq.public,owner_id.eq.${currentUserId}`);
       // If we had a real user ID, we would append `,owner_id.eq.${currentUserId}` to the OR condition
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assets/upload - Upload images
router.post('/upload', upload.array('files', 10), async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const sharp = (await import('sharp')).default;
    const files = req.files as Express.Multer.File[];
    const { title, description, category, visibility, owner_id } = req.body;

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    if (!category) {
      res.status(400).json({ error: 'Category is required' });
      return;
    }

    const results = [];

    for (const file of files) {
      // Generate paths
      const originalPath = path.join(uploadDir, file.filename);
      const thumbnailFilename = `thumb_${file.filename.replace(path.extname(file.filename), '.webp')}`;
      const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
      
      // Relative paths for URL
      const relativeOriginalPath = `/uploads/assets/images/${file.filename}`;
      const relativeThumbnailPath = `/uploads/assets/thumbnails/${thumbnailFilename}`;

      // 1. Generate Thumbnail (Resize to 400px width, convert to WebP)
      await sharp(originalPath)
        .resize(400, null, { withoutEnlargement: true }) // Width 400, maintain aspect ratio
        .webp({ quality: 80 })
        .toFile(thumbnailPath);

      // 2. Optimize Original (Optional: convert to WebP if not GIF, to save space)
      // For now, we keep original as is to preserve quality for use, but we could add an optimization step here.
      
      const assetData = {
        asset_type: 'uploaded_image',
        source_platform: 'upload',
        upload_method: 'manual_upload',
        category,
        title: title || file.originalname,
        description: description || '',
        // Use description as raw_content/processed_content for searchability
        raw_content: description || '',
        processed_content: description || '',
        thumbnail_url: relativeThumbnailPath,
        content_url: relativeOriginalPath,
        media_urls: [relativeOriginalPath],
        visibility: visibility || 'private',
        owner_id: owner_id || '00000000-0000-0000-0000-000000000000', // Default to dummy user ID if no auth
        risk_level: 0,
        original_filename: file.originalname,
        file_size: file.size,
        status: 'new',
        // 'asset_type' column is already set above to 'uploaded_image'.
        // The previous error "Could not find the 'type' column" suggests that there is no 'type' column in the schema.
        // The schema shows 'asset_type' is the correct column name, which is already set.
        // However, if the error persists, it might be due to a misunderstanding of the schema or a trigger/RLS issue.
        // Wait, looking at the schema provided in tool output:
        // columns: id, asset_type, source_platform, content_url, thumbnail_url, title, description, tags, status, adopted_by, created_at, category, sub_category, raw_content, processed_content, risk_level, last_used_at, source_url, fingerprint, visibility, owner_id, upload_method, media_urls, file_size, original_filename, verify_status
        // THERE IS NO 'type' COLUMN.
        // My previous fix added `type: 'image'`, which caused the error because the column doesn't exist.
        // I should remove `type: 'image'` and ensure `asset_type` is correctly set (which it is: 'uploaded_image').
      };

      // Remove the erroneous 'type' field I added in previous step
      // assetData is defined above with 'asset_type': 'uploaded_image'
      
      const { data, error } = await supabase
        .from('assets')
        .insert(assetData)
        .select()
        .single();

      if (error) throw error;
      results.push(data);
    }

    res.json({ ok: true, count: results.length, assets: results });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/assets/:id/visibility - Update visibility
router.put('/:id/visibility', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { visibility } = req.body;

    if (!['private', 'shared'].includes(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility value' });
    }

    // Check permissions (owner or admin) - skipping for now as we don't have full auth context here

    const { data, error } = await supabase
      .from('assets')
      .update({ visibility })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ ok: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/assets/:id - General Update (including persona_id)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const updates = req.body; // e.g., { persona_id: 'uuid', title: 'new title' }

    // Whitelist allowed fields to prevent overwriting critical system fields if necessary
    // For now, we allow updating most fields including persona_id
    
    const { data, error } = await supabase
      .from('assets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ ok: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/assets/:id - 刪除素材
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    
    // 檢查是否有正在使用此素材的未完成任務
    // 如果有，可能需要警告或阻止刪除
    // 目前邏輯：直接將相關任務的 asset_id 設為 null (或保留但素材已消失)
    // 為了資料完整性，我們可以先檢查
    
    // 1. 刪除素材
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ ok: true, message: '素材已刪除' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/assets - 批量刪除
router.delete('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { ids } = req.body; // { ids: ['uuid1', 'uuid2'] }
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array required' });
    }

    const { error } = await supabase
      .from('assets')
      .delete()
      .in('id', ids);

    if (error) throw error;
    res.json({ ok: true, count: ids.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
