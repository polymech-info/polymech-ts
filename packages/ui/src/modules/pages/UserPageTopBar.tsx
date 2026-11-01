import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { T } from "@/i18n";

interface UserPageTopBarProps {
    embedded?: boolean;
    orgSlug?: string;
    userId: string;
    isOwner?: boolean;
}

export const UserPageTopBar: React.FC<UserPageTopBarProps> = ({
    embedded = false,
    orgSlug,
    userId,
    isOwner,
}) => {
    const navigate = useNavigate();

    if (embedded) return null;

    return (
        <div className="">

        </div>
    );
};
