import { supabase } from './supabase';

export interface Alert {
    id: string;
    adminId: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'update' | 'event';
    createdAt: number;
    updatedAt: number;
    expiresAt?: number;
}

export const AlertsService = {
    async getAlerts(): Promise<Alert[]> {
        if (!supabase) return [];
        
        const { data, error } = await supabase
            .from('alerts')
            .select('*')
            .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
            .order('created_at', { ascending: false });

        if (error || !data) return [];

        return data.map(a => ({
            id: a.id,
            adminId: a.admin_id,
            title: a.title,
            message: a.message,
            type: a.type,
            createdAt: new Date(a.created_at).getTime(),
            updatedAt: new Date(a.updated_at).getTime(),
            expiresAt: a.expires_at ? new Date(a.expires_at).getTime() : undefined
        }));
    },

    async createAlert(adminId: string, title: string, message: string, type: 'info' | 'warning' | 'update' | 'event', expiresAt?: number): Promise<{ alert?: Alert; error?: string }> {
        if (!supabase) return { error: 'No connection' };

        const { data, error } = await supabase
            .from('alerts')
            .insert({
                admin_id: adminId,
                title,
                message,
                type,
                expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
            })
            .select()
            .single();

        if (error) return { error: error.message };

        return {
            alert: {
                id: data.id,
                adminId: data.admin_id,
                title: data.title,
                message: data.message,
                type: data.type,
                createdAt: new Date(data.created_at).getTime(),
                updatedAt: new Date(data.updated_at).getTime(),
                expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : undefined
            }
        };
    },

    async updateAlert(alertId: string, updates: Partial<Pick<Alert, 'title' | 'message' | 'type' | 'expiresAt'>>): Promise<{ error?: string }> {
        if (!supabase) return { error: 'No connection' };

        const payload: any = { updated_at: new Date().toISOString() };
        if (updates.title) payload.title = updates.title;
        if (updates.message) payload.message = updates.message;
        if (updates.type) payload.type = updates.type;
        if (updates.expiresAt !== undefined) payload.expires_at = updates.expiresAt ? new Date(updates.expiresAt).toISOString() : null;

        const { error } = await supabase
            .from('alerts')
            .update(payload)
            .eq('id', alertId);

        if (error) return { error: error.message };
        return {};
    },

    async deleteAlert(alertId: string): Promise<{ error?: string }> {
        if (!supabase) return { error: 'No connection' };

        const { error } = await supabase
            .from('alerts')
            .delete()
            .eq('id', alertId);

        if (error) return { error: error.message };
        return {};
    },

    async markAlertAsRead(alertId: string, userId: string): Promise<void> {
        if (!supabase) return;

        await supabase
            .from('alert_reads')
            .upsert({
                alert_id: alertId,
                user_id: userId,
                read_at: new Date().toISOString()
            }, { onConflict: 'alert_id,user_id' });
    },

    async getUnreadCount(userId: string): Promise<number> {
        if (!supabase) return 0;

        const { data, error } = await supabase
            .rpc('get_unread_alert_count', { p_user_id: userId });

        if (error) {
            // Fallback: count manually if function doesn't exist
            const { data: alerts } = await supabase
                .from('alerts')
                .select('id')
                .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

            if (!alerts) return 0;

            const { data: reads } = await supabase
                .from('alert_reads')
                .select('alert_id')
                .eq('user_id', userId);

            const readIds = new Set(reads?.map(r => r.alert_id) || []);
            return alerts.filter(a => !readIds.has(a.id)).length;
        }

        return data || 0;
    },

    subscribeToAlerts(onNewAlert: (alert: Alert) => void) {
        if (!supabase) return null;

        const channel = supabase.channel('alerts_channel')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'alerts'
            }, (payload) => {
                const a = payload.new;
                onNewAlert({
                    id: a.id,
                    adminId: a.admin_id,
                    title: a.title,
                    message: a.message,
                    type: a.type,
                    createdAt: new Date(a.created_at).getTime(),
                    updatedAt: new Date(a.updated_at).getTime(),
                    expiresAt: a.expires_at ? new Date(a.expires_at).getTime() : undefined
                });
            })
            .subscribe();

        return channel;
    }
};
