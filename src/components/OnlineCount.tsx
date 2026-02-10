
import React, { useEffect, useState } from 'react';
import { SocialService } from '../services/social';

const OnlineCount: React.FC = () => {
    const [count, setCount] = useState(1);

    useEffect(() => {
        const channel = SocialService.subscribeToPresence((newCount) => {
            setCount(Math.max(1, newCount));
        });

        return () => {
            channel?.unsubscribe();
        };
    }, []);

    return (
        <div className="flex items-center gap-2 mt-1 animate-fade-in">
            <div className="relative flex items-center justify-center size-2">
                <div className="absolute size-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
                <div className="relative size-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            </div>
            <span className="text-[10px] font-bold text-slate-900/40 dark:text-white/40 uppercase tracking-widest leading-none">
                {count} {count === 1 ? 'User' : 'Users'} Online
            </span>
        </div>
    );
};

export default OnlineCount;
