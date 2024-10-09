import React from 'react'

export type IslandIconProps = {
    color?: string;
}
export default function IslandIcon(p?: IslandIconProps) {
    return (

        <svg
            {...(p ?? {})}
            viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true">
            <ellipse cx="512" cy="720" rx="400" ry="80" fill="currentColor" opacity="0.2" />
            <ellipse cx="512" cy="600" rx="200" ry="70" fill="currentColor" opacity="0.5" />
            <rect x="500" y="480" width="24" height="120" fill="currentColor" />
            <path d="M512 480 Q552 420 610 480" fill="none" stroke="currentColor" stroke-width="30" opacity="0.6" />
            <path d="M512 480 Q472 420 414 480" fill="none" stroke="currentColor" stroke-width="30" opacity="0.6" />
            <path d="M512 480 Q552 380 610 420" fill="none" stroke="currentColor" stroke-width="30" opacity="0.6" />
            <path d="M512 480 Q472 380 414 420" fill="none" stroke="currentColor" stroke-width="30" opacity="0.6" />
        </svg>


    )
}
