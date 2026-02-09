
import React from 'react';
import { User } from '../types';

interface UserBadgeProps {
    user: Pick<User, 'isAdmin' | 'isDonor'>;
    size?: 'sm' | 'md' | 'lg';
}

const UserBadge: React.FC<UserBadgeProps> = ({ user, size = 'sm' }) => {
    const sizeClasses = {
        sm: 'size-4 text-[8px]',
        md: 'size-5 text-[10px]',
        lg: 'size-6 text-[12px]'
    };

    const iconSizes = {
        sm: 'text-[10px]',
        md: 'text-[12px]',
        lg: 'text-[14px]'
    };

    if (user.isAdmin) {
        return (
            <div
                className={`${sizeClasses[size]} rounded-full bg-primary flex items-center justify-center shadow-lg border-2 border-background-dark`}
                title="Admin"
            >
                <span className={`material-symbols-outlined ${iconSizes[size]} text-background-dark font-bold`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    check
                </span>
            </div>
        );
    }

    if (user.isDonor) {
        return (
            <div
                className={`${sizeClasses[size]} rounded-full bg-jamaican-gold flex items-center justify-center shadow-lg border-2 border-background-dark`}
                title="Supporter"
            >
                <span className={`material-symbols-outlined ${iconSizes[size]} text-background-dark font-bold`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    favorite
                </span>
            </div>
        );
    }

    return null;
};

export default UserBadge;
