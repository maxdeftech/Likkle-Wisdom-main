import { supabase } from './supabase';
import { Post } from '../types';

export const FeedService = {

  async getPosts(): Promise<Post[]> {
    if (!supabase) return [];

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, user_id, content_type, text_content, media_url, scripture_ref, wisdom_ref, created_at,
        profile:profiles!user_id(username, avatar_url)
      `)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Feed fetch error:', error);
      return [];
    }

    return data.map((p: any) => ({
      id: p.id,
      userId: p.user_id,
      username: p.profile?.username || 'Seeker',
      avatarUrl: p.profile?.avatar_url || undefined,
      contentType: p.content_type,
      textContent: p.text_content || undefined,
      mediaUrl: p.media_url || undefined,
      scriptureRef: p.scripture_ref || undefined,
      wisdomRef: p.wisdom_ref || undefined,
      createdAt: new Date(p.created_at).getTime()
    }));
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
      .select(`
        id, user_id, content_type, text_content, media_url, scripture_ref, wisdom_ref, created_at,
        profile:profiles!user_id(username, avatar_url)
      `)
      .single();

    if (error || !inserted) {
      console.error('Post create error:', error);
      return { error: error?.message || 'Failed to create post' };
    }

    return {
      post: {
        id: inserted.id,
        userId: inserted.user_id,
        username: (inserted as any).profile?.username || 'Seeker',
        avatarUrl: (inserted as any).profile?.avatar_url || undefined,
        contentType: inserted.content_type,
        textContent: inserted.text_content || undefined,
        mediaUrl: inserted.media_url || undefined,
        scriptureRef: inserted.scripture_ref || undefined,
        wisdomRef: inserted.wisdom_ref || undefined,
        createdAt: new Date(inserted.created_at).getTime()
      }
    };
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
        // Fetch profile info for the new post
        const { data: profile } = await supabase!
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', p.user_id)
          .single();

        onNew({
          id: p.id,
          userId: p.user_id,
          username: profile?.username || 'Seeker',
          avatarUrl: profile?.avatar_url || undefined,
          contentType: p.content_type,
          textContent: p.text_content || undefined,
          mediaUrl: p.media_url || undefined,
          scriptureRef: p.scripture_ref || undefined,
          wisdomRef: p.wisdom_ref || undefined,
          createdAt: new Date(p.created_at).getTime()
        });
      })
      .subscribe();
  }
};
