import { supabase } from './supabase';

/*
  Helper Storage Supabase — versione UNIVERSALE.
  Differenza col web: l'upload non riceve più un oggetto File del browser,
  ma un "asset" scelto con expo-document-picker / expo-image-picker
  ({ uri, name, mimeType }). Su React Native si carica leggendo l'uri come
  ArrayBuffer; su web l'asset espone già un File/Blob in `.file`.
*/

export async function uploadAsset(bucket, asset, prefix = '') {
  const name = asset.name || asset.fileName || `file_${Date.now()}`;
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${prefix ? prefix.replace(/\/$/, '') + '/' : ''}${Date.now()}_${safe}`;
  const contentType = asset.mimeType || asset.type || 'application/octet-stream';

  // Su web l'asset può già contenere un File/Blob pronto.
  let body;
  if (asset.file) {
    body = asset.file;
  } else {
    const res = await fetch(asset.uri);
    body = await res.arrayBuffer();
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, { upsert: false, contentType });
  if (error) throw error;
  return path;
}

export async function signedUrl(bucket, path, seconds = 60) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, seconds);
  if (error || !data) throw error || new Error('signed url');
  return data.signedUrl;
}
