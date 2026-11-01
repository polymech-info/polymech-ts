import React, { useState, useEffect } from 'react';

export function DeferredNumberInput({ value, onChange, ...props }: any) {
    const [local, setLocal] = useState(value);
    useEffect(() => { setLocal(value); }, [value]);

    const handleCommit = () => {
        const num = Number(local);
        if (!isNaN(num) && num !== value) onChange(num);
    };

    return (
        <input
            type="number"
            {...props}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.currentTarget.blur();
                }
            }}
        />
    )
}

export function DeferredRangeSlider({ value, onChange, ...props }: any) {
    const [local, setLocal] = useState(value);
    useEffect(() => { setLocal(value); }, [value]);

    const handleCommit = () => {
        const num = Number(local);
        if (!isNaN(num) && num !== value) onChange(num);
    };

    return (
        <input
            type="range"
            {...props}
            value={local}
            onChange={(e) => setLocal(Number(e.target.value))}
            onMouseUp={handleCommit}
            onTouchEnd={handleCommit}
            onBlur={handleCommit}
        />
    )
}
