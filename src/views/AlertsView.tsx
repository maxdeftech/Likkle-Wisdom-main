import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { AlertsService, Alert } from '../services/alertsService';

interface AlertsViewProps {
    user: User;
    onClose: () => void;
    onUnreadUpdate?: () => void;
}

const AlertsView: React.FC<AlertsViewProps> = ({ user, onClose, onUnreadUpdate }) => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingAlert, setEditingAlert] = useState<Alert | null>(null);

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formMessage, setFormMessage] = useState('');
    const [formType, setFormType] = useState<'info' | 'warning' | 'update' | 'event'>('info');
    const [formExpires, setFormExpires] = useState('');
    const [submitting, setSubmitting] = useState(false);

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
        const a = await AlertsService.getAlerts();
        setAlerts(a);
        setLoading(false);
    };

    const handleMarkAsRead = async (alertId: string) => {
        await AlertsService.markAlertAsRead(alertId, user.id);
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

        const expiresMs = formExpires ? new Date(formExpires).getTime() : undefined;

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
                alert('Failed to update alert: ' + error);
            }
        } else {
            const { alert: newAlert, error } = await AlertsService.createAlert(user.id, formTitle, formMessage, formType, expiresMs);
            if (newAlert) {
                setAlerts(prev => [newAlert, ...prev]);
                setShowCreateModal(false);
            } else {
                alert('Failed to create alert: ' + error);
            }
        }

        setSubmitting(false);
    };

    const handleDelete = async (alertId: string) => {
        if (!confirm('Delete this alert?')) return;
        const { error } = await AlertsService.deleteAlert(alertId);
        if (!error) {
            setAlerts(prev => prev.filter(a => a.id !== alertId));
        } else {
            alert('Failed to delete: ' + error);
        }
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'warning': return 'border-red-400/30 bg-red-400/5';
            case 'update': return 'border-blue-400/30 bg-blue-400/5';
            case 'event': return 'border-jamaican-gold/30 bg-jamaican-gold/5';
            default: return 'border-primary/30 bg-primary/5';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'warning': return 'warning';
            case 'update': return 'update';
            case 'event': return 'event';
            default: return 'info';
        }
    };

    return (
        <div className="fixed inset-0 z-modal bg-background-dark flex flex-col pt-safe animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-4 pb-4 border-b border-white/5">
                <button onClick={onClose} className="size-10 rounded-full glass flex items-center justify-center text-white/60 active:scale-95 transition-all" aria-label="Close alerts">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="text-xl font-black text-white uppercase tracking-widest">Alerts</h2>
                {user.isAdmin ? (
                    <button onClick={handleOpenCreate} className="size-10 rounded-full bg-primary text-background-dark flex items-center justify-center active:scale-95 transition-all shadow-lg">
                        <span className="material-symbols-outlined">add</span>
                    </button>
                ) : (
                    <div className="size-10"></div>
                )}
            </div>

            {/* Alerts List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loading ? (
                    <div className="text-center py-20">
                        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                        <p className="text-white/30 text-xs uppercase mt-4 tracking-widest">Loading alerts...</p>
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="text-center py-20 glass rounded-[3rem] border-dashed border-white/10">
                        <span className="material-symbols-outlined text-6xl text-white/10 mb-4">notifications_none</span>
                        <p className="text-white/20 text-sm font-black uppercase tracking-widest">No alerts yet</p>
                        <p className="text-white/10 text-xs mt-2">Check back soon fi updates!</p>
                    </div>
                ) : (
                    alerts.map(alert => (
                        <div
                            key={alert.id}
                            onClick={() => handleMarkAsRead(alert.id)}
                            className={`glass rounded-2xl p-6 border shadow-lg animate-fade-in ${getTypeStyles(alert.type)}`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`size-10 rounded-xl ${alert.type === 'warning' ? 'bg-red-400/20 text-red-400' : alert.type === 'event' ? 'bg-jamaican-gold/20 text-jamaican-gold' : 'bg-primary/20 text-primary'} flex items-center justify-center`}>
                                        <span className="material-symbols-outlined text-xl">{getTypeIcon(alert.type)}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black text-sm uppercase tracking-wide">{alert.title}</h3>
                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                                            {new Date(alert.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                {user.isAdmin && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(alert); }}
                                            className="size-8 rounded-lg glass flex items-center justify-center text-white/40 hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(alert.id); }}
                                            className="size-8 rounded-lg glass flex items-center justify-center text-white/40 hover:text-red-400 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{alert.message}</p>
                            {alert.expiresAt && (
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-white/20 text-xs">schedule</span>
                                    <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider">
                                        Expires {new Date(alert.expiresAt).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

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
