
import React, { useEffect, useState } from 'react';
import { SocialService } from '../services/social';
import { FriendRequest } from '../types';

interface FriendRequestListProps {
    userId: string;
    onClose: () => void;
    onRequestsChanged: () => void;
}

const FriendRequestList: React.FC<FriendRequestListProps> = ({ userId, onClose, onRequestsChanged }) => {
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequests();
    }, [userId]);

    const loadRequests = async () => {
        setLoading(true);
        const reqs = await SocialService.getFriendRequests(userId);
        setRequests(reqs);
        setLoading(false);
    };

    const handleResponse = async (id: string, accept: boolean) => {
        await SocialService.respondToRequest(id, accept);
        setRequests(prev => prev.filter(r => r.id !== id));
        onRequestsChanged();
    };

    return (
        <div className="fixed inset-0 z-modal bg-background-dark/95 backdrop-blur-xl animate-fade-in flex flex-col p-6">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Friend Requests</h2>
                <button onClick={onClose} className="size-10 rounded-full glass flex items-center justify-center text-white/50 active:scale-95 transition-all">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
                {loading ? (
                    <div className="text-center text-white/30 animate-pulse mt-10">Checking registry...</div>
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-white/30 text-center">
                        <span className="material-symbols-outlined text-5xl mb-4 opacity-50">person_off</span>
                        <p className="font-bold uppercase tracking-wider text-xs">No pending requests</p>
                    </div>
                ) : (
                    requests.map(req => (
                        <div key={req.id} className="glass p-5 rounded-2xl flex flex-col gap-4 animate-slide-up">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-full bg-white/10 overflow-hidden">
                                    {req.requesterAvatar ? (
                                        <img src={req.requesterAvatar} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white font-black text-lg">
                                            {req.requesterName[0]}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">{req.requesterName}</h3>
                                    <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Wants to connect</p>
                                </div>
                            </div>

                            {/* Stats Cards Row could go here if we fetch profile stats */}
                            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl">
                                <span className="material-symbols-outlined text-white/40 text-sm">calendar_month</span>
                                <span className="text-white/60 text-xs font-bold uppercase">Member since 2024</span>
                                {/* Mock data for now as getting detailed stats requires another query */}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <button
                                    onClick={() => handleResponse(req.id, false)}
                                    className="py-3 rounded-xl glass border-red-500/30 text-red-400 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                                >
                                    Decline
                                </button>
                                <button
                                    onClick={() => handleResponse(req.id, true)}
                                    className="py-3 rounded-xl bg-primary text-background-dark font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                >
                                    Accept
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FriendRequestList;
