const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://opiclwhmaemcipueshvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9waWNsd2htYWVtY2lwdWVzaHZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzgwMjczMiwiZXhwIjoyMTA5Mzc4NzMyfQ.o2YpyZOYnb7TJOdcuea14nwEUZObxB3fzJk5-72peyI'
);

async function uploadAndAttach(articleId, localFilePath, storageFileName, creditText) {
  if (!fs.existsSync(localFilePath)) {
    console.error(`File does not exist: ${localFilePath}`);
    return null;
  }

  const fileBuffer = fs.readFileSync(localFilePath);
  const ext = path.extname(localFilePath).toLowerCase() || '.jpg';
  const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

  const remoteName = `${storageFileName}-${Date.now()}${ext}`;

  // 1. Upload to Supabase Storage bucket 'news-images'
  const { data: uploadData, error: uploadErr } = await sb.storage
    .from('news-images')
    .upload(remoteName, fileBuffer, {
      contentType,
      upsert: true,
      cacheControl: '31536000'
    });

  if (uploadErr) {
    console.error(`Upload error for ${storageFileName}:`, uploadErr);
    return null;
  }

  const { data: publicUrlData } = sb.storage
    .from('news-images')
    .getPublicUrl(remoteName);

  const publicUrl = publicUrlData.publicUrl;
  console.log(`✓ Uploaded to Supabase Storage: ${publicUrl}`);

  // 2. Copy locally to public/news/
  const localDestDir = path.join(process.cwd(), 'public', 'news');
  if (!fs.existsSync(localDestDir)) {
    fs.mkdirSync(localDestDir, { recursive: true });
  }
  const localDest = path.join(localDestDir, `${storageFileName}${ext}`);
  fs.copyFileSync(localFilePath, localDest);

  // 3. Update article in Supabase
  const { data: art } = await sb
    .from('articles')
    .select('flags')
    .eq('id', articleId)
    .single();

  const updatedFlags = {
    ...(art?.flags || {}),
    image_credit: creditText || 'प्रतिनिधिक छायाचित्र (AI Photojournalism: Pune Prime Times)'
  };

  const { error: updErr } = await sb
    .from('articles')
    .update({
      cover_image_url: publicUrl,
      flags: updatedFlags
    })
    .eq('id', articleId);

  if (updErr) {
    console.error(`DB Update Error for ${articleId}:`, updErr);
  } else {
    console.log(`✓ Successfully updated article ${articleId} with new cover image!`);
  }

  return publicUrl;
}

module.exports = { uploadAndAttach };

