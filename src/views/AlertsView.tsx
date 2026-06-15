import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { AlertsService, Alert } from '../services/alertsService';
import { LocalNotifications, LocalNotification } from '../services/localNotificationsService';

interface AlertsViewProps {
    user: User;
    onClose: () => void;
    onUnreadUpdate?: () => void;
}

type UnifiedItem =
    | { kind: 'server'; data: Alert }
    | { kind: 'local'; data: LocalNotification };

const AlertsView: React.FC<AlertsViewProps> = ({ user, onClose, onUnreadUpdate }) => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [localItems, setLocalItems] = useState<LocalNotification[]>(LocalNotifications.getAll);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [selectedLocal, setSelectedLocal] = useState<LocalNotification | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formMessage, setFormMessage] = useState('');
    const [formType, setFormType] = useState<'info' | 'warning' | 'update' | 'event'>('info');
    const [formExpires, setFormExpires] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Refresh local items when they change
    useEffect(() => {
        const unsub = LocalNotifications.subscribe(() => {
            setLocalItems(LocalNotifications.getAll());
        });
        return unsub;
    }, []);

    useEffect(() => {
        loadAlerts();
        const channel = AlertsService.subscribeToAlerts((newAlert) => {
            setAlerts(prev => [newAlert, ...prev]);
            if (onUnreadUpdate) onUnreadUpdate();
        });
        return () => { channel?.unsubscribe(); };
    }, []);

    const loadAlerts = async () => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const a = await AlertsService.getAlerts();
            setAlerts(a);
        } catch (error) {
            console.error('Alerts view load failed:', error);
            setErrorMessage('Alerts could not load. Try again soon.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (alertId: string) => {
        try {
            await AlertsService.markAlertAsRead(alertId, user.id);
            if (onUnreadUpdate) onUnreadUpdate();
        } catch (error) {
            console.error('Mark alert read failed:', error);
        }
    };

    const handleOpenAlertDetail = (alert: Alert) => {
        setSelectedAlert(alert);
        setSelectedLocal(null);
        handleMarkAsRead(alert.id);
    };

    const handleOpenLocalDetail = (item: LocalNotification) => {
        setSelectedLocal(item);
        setSelectedAlert(null);
        if (!item.read) {
            LocalNotifications.markRead(item.id);
            if (onUnreadUpdate) onUnreadUpdate();
        }
    };

    const handleDismissLocal = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        LocalNotifications.remove(id);
        if (selectedLocal?.id === id) setSelectedLocal(null);
        if (onUnreadUpdate) onUnreadUpdate();
    };

    const handleClearAllLocal = () => {
        LocalNotifications.clearAll();
        setSelectedLocal(null);
        if (onUnreadUpdate) onUnreadUpdate();
    };

    const handleOpenCreate = () => {
        setEditingAlert(null);
        setFormTitle('');
        setFormMessage('');
        setFormType('info');
        setFormExpires('');
        setShowCreateModal(true);
    };

    const handleOpenEdit = (alert: Alert) => {
        setEditingAlert(alert);
        setFormTitle(alert.title);
        setFormMessage(alert.message);
        setFormType(alert.type);
        setFormExpires(alert.expiresAt ? new Date(alert.expiresAt).toISOString().slice(0, 16) : '');
        setShowCreateModal(true);
    };

    const handleSubmit = async () => {
        if (!formTitle.trim() || !formMessage.trim()) return;
        setSubmitting(true);
        setErrorMessage(null);

        const expiresMs = formExpires ? new Date(formExpires).getTime() : undefined;

        try {
            if (editingAlert) {
                const { error } = await AlertsService.updateAlert(editingAlert.id, {
                    title: formTitle,
                    message: formMessage,
                    type: formType,
                    expiresAt: expiresMs
                });
                if (!error) {
                    setAlerts(prev => prev.map(a => a.id === editingAlert.id ? { ...a, title: formTitle, message: formMessage, type: formType, expiresAt: expiresMs } : a));
                    setShowCreateModal(false);
                } else {
                    setErrorMessage('Failed to update alert: ' + error);
                }
            } else {
                const { alert: newAlert, error } = await AlertsService.createAlert(user.id, formTitle, formMessage, formType, expiresMs);
                if (newAlert) {
                    setAlerts(prev => [newAlert, ...prev]);
                    setShowCreateModal(false);
                } else {
                    setErrorMessage('Failed to create alert: ' + error);
                }
            }
        } catch (error) {
            console.error('Alert submit failed:', error);
            setErrorMessage('Alert could not be saved. Try again soon.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (alertId: string) => {
        if (!confirm('Delete this alert?')) return;
        setErrorMessage(null);
        try {
            const { error } = await AlertsService.deleteAlert(alertId);
            if (!error) {
                setAlerts(prev => prev.filter(a => a.id !== alertId));
            } else {
                setErrorMessage('Failed to delete: ' + error);
            }
        } catch (error) {
            console.error('Alert delete failed:', error);
            setErrorMessage('Alert could not be deleted. Try again soon.');
        }
    };

    // Merge server alerts + local notifications into a single sorted list
    const unified: UnifiedItem[] = [
        ...localItems.map(d => ({ kind: 'local' as const, data: d })),
        ...alerts.map(d => ({ kind: 'server' as const, data: d })),
    ].sort((a, b) => {
        const tA = a.kind === 'local' ? a.data.createdAt : a.data.createdAt;
        const tB = b.kind === 'local' ? b.data.createdAt : b.data.createdAt;
        return tB - tA;
    });

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'warning': return 'border-red-400/30 bg-red-400/5';
            case 'update': return 'border-blue-400/30 bg-blue-400/5';
            case 'event': return 'border-jamaican-gold/30 bg-jamaican-gold/5';
            case 'ai': return 'border-primary/30 bg-primary/5';
            default: return 'border-primary/30 bg-primary/5';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'warning': return 'warning';
            case 'update': return 'system_update';
            case 'event': return 'event';
            case 'ai': return 'auto_awesome';
            default: return 'info';
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'warning': return 'bg-red-400/20 text-red-400';
            case 'update': return 'bg-blue-400/20 text-blue-400';
            case 'event': return 'bg-jamaican-gold/20 text-jamaican-gold';
            case 'ai': return 'bg-primary/20 text-primary';
            default: return 'bg-primary/20 text-primary';
        }
    };

    const totalItems = unified.length;
    const hasLocalItems = localItems.length > 0;

    return (
        <div className="fixed inset-0 z-modal bg-white dark:bg-background-dark flex flex-col pt-safe animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-4 pb-4 border-b border-slate-200 dark:border-white/5">
                <button onClick={onClose} className="size-10 rounded-full glass flex items-center justify-center text-slate-500 dark:text-white/60 active:scale-95 transition-all" aria-label="Close alerts">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Alerts</h2>
                <div className="flex items-center gap-2">
                    {hasLocalItems && (
                        <button
                            onClick={handleClearAllLocal}
                            className="h-10 rounded-full glass flex items-center justify-center px-3 text-red-400/80 hover:text-red-400 active:scale-95 transition-all"
                            aria-label="Clear all notifications"
                            title="Clear all"
                        >
                            <span className="material-symbols-outlined text-lg">delete_sweep</span>
                        </button>
                    )}
                    {user.isAdmin ? (
                        <button onClick={handleOpenCreate} className="size-10 rounded-full bg-primary text-background-dark flex items-center justify-center active:scale-95 transition-all shadow-lg">
                            <span className="material-symbols-outlined">add</span>
                        </button>
                    ) : (
                        !hasLocalItems && <div className="size-10" />
                    )}
                </div>
            </div>

            {errorMessage && (
                <div className="mx-6 mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-red-300" role="alert">
                    {errorMessage}
                </div>
            )}

            {/* Alerts List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loading ? (
                    <div className="text-center py-20">
                        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                        <p className="text-slate-400 dark:text-white/30 text-xs uppercase mt-4 tracking-widest">Loading alerts...</p>
                    </div>
                ) : totalItems === 0 ? (
                    <div className="text-center py-20 glass rounded-[3rem] border-dashed border-slate-200 dark:border-white/10">
                        <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-white/10 mb-4">notifications_none</span>
                        <p className="text-slate-300 dark:text-white/20 text-sm font-black uppercase tracking-widest">No alerts yet</p>
                        <p className="text-slate-200 dark:text-white/10 text-xs mt-2">Check back soon fi updates!</p>
                    </div>
                ) : (
                    unified.map(item => {
                        if (item.kind === 'local') {
                            const n = item.data;
                            return (
                                <div
                                    key={n.id}
                                    onClick={() => handleOpenLocalDetail(n)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenLocalDetail(n); } }}
                                    className={`glass rounded-2xl p-5 border shadow-lg animate-fade-in cursor-pointer hover:border-slate-300 dark:hover:border-white/20 active:scale-[0.99] transition-all ${getTypeStyles(n.type)} ${!n.read ? 'ring-1 ring-primary/30' : ''}`}
                                    aria-label={`Open notification: ${n.title}`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-10 rounded-xl ${getIconColor(n.type)} flex items-center justify-center`}>
                                                <span className="material-symbols-outlined text-xl">{getTypeIcon(n.type)}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-wide">{n.title}</h3>
                                                    {!n.read && <span className="size-2 rounded-full bg-primary shrink-0" />}
                                                </div>
                                                <p className="text-slate-400 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest">
                                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(n.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => handleDismissLocal(n.id, e)}
                                            className="size-8 rounded-lg glass flex items-center justify-center text-slate-300 dark:text-white/30 hover:text-red-400 transition-colors"
                                            aria-label="Dismiss notification"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                    <p className="text-slate-600 dark:text-white/70 text-sm leading-relaxed line-clamp-2">{n.message}</p>
                                </div>
                            );
                        }

                        const alert = item.data;
                        return (
                            <div
                                key={alert.id}
                                onClick={() => handleOpenAlertDetail(alert)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenAlertDetail(alert); } }}
                                className={`glass rounded-2xl p-5 border shadow-lg animate-fade-in cursor-pointer hover:border-slate-300 dark:hover:border-white/20 active:scale-[0.99] transition-all ${getTypeStyles(alert.type)}`}
                                aria-label={`Open alert: ${alert.title}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`size-10 rounded-xl ${getIconColor(alert.type)} flex items-center justify-center`}>
                                            <span className="material-symbols-outlined text-xl">{getTypeIcon(alert.type)}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-wide">{alert.title}</h3>
                                            <p className="text-slate-400 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest">
                                                {new Date(alert.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    {user.isAdmin && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleOpenEdit(alert); }}
                                                className="size-8 rounded-lg glass flex items-center justify-center text-slate-300 dark:text-white/40 hover:text-primary transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(alert.id); }}
                                                className="size-8 rounded-lg glass flex items-center justify-center text-slate-300 dark:text-white/40 hover:text-red-400 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-slate-600 dark:text-white/70 text-sm leading-relaxed line-clamp-2">{alert.message}</p>
                                {alert.expiresAt && (
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-300 dark:text-white/20 text-xs">schedule</span>
                                        <span className="text-slate-400 dark:text-white/30 text-[10px] font-bold uppercase tracking-wider">
                                            Expires {new Date(alert.expiresAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Local notification detail popup */}
            {selectedLocal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="local-detail-title">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedLocal(null)} aria-hidden="true" />
                    <div className="relative w-full max-w-md max-h-[85vh] overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl bg-white dark:bg-white/5 backdrop-blur-xl animate-scale-up flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/10">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`size-10 rounded-xl shrink-0 ${getIconColor(selectedLocal.type)} flex items-center justify-center`}>
                                    <span className="material-symbols-outlined text-xl">{getTypeIcon(selectedLocal.type)}</span>
                                </div>
                                <h3 id="local-detail-title" className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-wide truncate">{selectedLocal.title}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedLocal(null)}
                                className="size-10 rounded-xl glass flex items-center justify-center text-slate-500 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-95 shrink-0"
                                aria-label="Close notification"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <p className="text-slate-400 dark:text-white/50 text-[10px] font-bold uppercase tracking-widest mb-3">
                                {new Date(selectedLocal.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                            <p className="text-slate-700 dark:text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{selectedLocal.message}</p>
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-white/5">
                            <button
                                onClick={() => handleDismissLocal(selectedLocal.id)}
                                className="w-full py-3 rounded-2xl border border-red-400/20 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-400/10 transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Server alert detail popup */}
            {selectedAlert && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="alert-detail-title">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedAlert(null)} aria-hidden="true" />
                    <div className="relative w-full max-w-md max-h-[85vh] overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl bg-white dark:bg-white/5 backdrop-blur-xl animate-scale-up flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/10">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`size-10 rounded-xl shrink-0 ${getIconColor(selectedAlert.type)} flex items-center justify-center`}>
                                    <span className="material-symbols-outlined text-xl">{getTypeIcon(selectedAlert.type)}</span>
                                </div>
                                <h3 id="alert-detail-title" className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-wide truncate">{selectedAlert.title}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedAlert(null)}
                                className="size-10 rounded-xl glass flex items-center justify-center text-slate-500 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-95 shrink-0"
                                aria-label="Close alert"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <p className="text-slate-400 dark:text-white/50 text-[10px] font-bold uppercase tracking-widest mb-3">
                                {new Date(selectedAlert.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </p>
                            <p className="text-slate-700 dark:text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{selectedAlert.message}</p>
                            {selectedAlert.expiresAt && (
                                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                                    <span className="material-symbols-outlined text-slate-300 dark:text-white/30 text-sm">schedule</span>
                                    <span className="text-slate-400 dark:text-white/40 text-[10px] font-bold uppercase tracking-wider">
                                        Expires {new Date(selectedAlert.expiresAt).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-md" onClick={() => setShowCreateModal(false)}></div>
                    <div className="relative w-full max-w-md glass p-6 rounded-[2.5rem] border-white/10 shadow-2xl animate-scale-up">
                        <h3 className="text-xl font-black text-white mb-5 uppercase tracking-tight">
                            {editingAlert ? 'Edit Alert' : 'New Alert'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-2">Title</label>
                                <input
                                    type="text"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="E.g. App Update Available"
                                    className="w-full glass rounded-xl p-3 text-white text-sm bg-white/5 border-white/10 placeholder:text-white/20"
                                    maxLength={60}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-2">Message</label>
                                <textarea
                                    value={formMessage}
                                    onChange={(e) => setFormMessage(e.target.value)}
                                    placeholder="Write yuh announcement..."
                                    className="w-full h-32 glass rounded-xl p-3 text-white text-sm bg-white/5 border-white/10 resize-none placeholder:text-white/20"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-2">Type</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['info', 'warning', 'update', 'event'] as const).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setFormType(t)}
                                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${formType === t ? 'bg-primary text-background-dark' : 'glass text-white/50'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-2">Expires (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={formExpires}
                                    onChange={(e) => setFormExpires(e.target.value)}
                                    className="w-full glass rounded-xl p-3 text-white text-sm bg-white/5 border-white/10"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-4 glass rounded-2xl text-white/60 font-black text-xs uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !formTitle.trim() || !formMessage.trim()}
                                className="flex-1 py-4 bg-primary text-background-dark rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
                            >
                                {submitting ? 'Saving...' : (editingAlert ? 'Update' : 'Post Alert')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertsView;
