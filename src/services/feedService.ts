import { supabase } from './supabase';
import { Post } from '../types';

// Helper: fetch profiles for a set of user IDs
async function fetchProfiles(userIds: string[]): Promise<Record<string, { username: string; avatar_url?: string }>> {
  if (!supabase || userIds.length === 0) return {};
  const unique = [...new Set(userIds)];
  const { data } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', unique);

  const map: Record<string, { username: string; avatar_url?: string }> = {};
  if (data) {
    for (const p of data) {
      map[p.id] = { username: p.username, avatar_url: p.avatar_url };
    }
  }
  return map;
}

function mapPost(row: any, profileMap: Record<string, { username: string; avatar_url?: string }>): Post {
  const profile = profileMap[row.user_id];
  return {
    id: row.id,
    userId: row.user_id,
    username: profile?.username || 'Seeker',
    avatarUrl: profile?.avatar_url || undefined,
    contentType: row.content_type,
    textContent: row.text_content || undefined,
    mediaUrl: row.media_url || undefined,
    scriptureRef: row.scripture_ref || undefined,
    wisdomRef: row.wisdom_ref || undefined,
    createdAt: new Date(row.created_at).getTime()
  };
}

export const FeedService = {

  async getPosts(): Promise<Post[]> {
    if (!supabase) return [];

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('posts')
      .select('id, user_id, content_type, text_content, media_url, scripture_ref, wisdom_ref, created_at')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Feed fetch error:', error);
      return [];
    }

    const profileMap = await fetchProfiles(data.map((p: any) => p.user_id));
    return data.map((p: any) => mapPost(p, profileMap));
  },

  async createPost(
    userId: string,
    contentType: Post['contentType'],
    data: {
      textContent?: string;
      mediaFile?: File;
      scriptureRef?: Post['scriptureRef'];
      wisdomRef?: Post['wisdomRef'];
    }
  ): Promise<{ post?: Post; error?: string }> {
    if (!supabase) return { error: 'Offline' };

    let mediaUrl: string | undefined;

    // Upload media if present
    if (data.mediaFile && (contentType === 'image' || contentType === 'video')) {
      const ext = data.mediaFile.name.split('.').pop() || 'bin';
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(path, data.mediaFile, { upsert: false });

      if (uploadError) {
        console.error('Media upload error:', uploadError);
        return { error: 'Failed to upload media' };
      }

      const { data: urlData } = supabase.storage
        .from('post-media')
        .getPublicUrl(path);

      mediaUrl = urlData?.publicUrl;
    }

    const row: any = {
      user_id: userId,
      content_type: contentType,
      text_content: data.textContent || null,
      media_url: mediaUrl || null,
      scripture_ref: data.scriptureRef || null,
      wisdom_ref: data.wisdomRef || null
    };

    const { data: inserted, error } = await supabase
      .from('posts')
      .insert(row)
      .select('id, user_id, content_type, text_content, media_url, scripture_ref, wisdom_ref, created_at')
      .single();

    if (error || !inserted) {
      console.error('Post create error:', error);
      return { error: error?.message || 'Failed to create post' };
    }

    // Fetch the profile for the poster
    const profileMap = await fetchProfiles([userId]);

    return { post: mapPost(inserted, profileMap) };
  },

  async deletePost(postId: string): Promise<{ error?: string }> {
    if (!supabase) return { error: 'Offline' };

    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) return { error: error.message };
    return {};
  },

  subscribeToFeed(onNew: (post: Post) => void) {
    if (!supabase) return null;

    return supabase
      .channel('feed_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts'
      }, async (payload) => {
        const p = payload.new as any;
        const profileMap = await fetchProfiles([p.user_id]);

        onNew(mapPost(p, profileMap));
      })
      .subscribe();
  }
};
