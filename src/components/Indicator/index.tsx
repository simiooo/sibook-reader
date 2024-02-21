import React from 'react'

export default function Indicator() {
    return (
        <div
        style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }}
        >
            <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="30" cy="30" r="15" fill="#F1948A">
                    <animate
                        attributeName="r"
                        from="15"
                        to="30"
                        dur="1.25s"
                        repeatCount="indefinite"
                        begin="0s"
                        fill="freeze"
                        keyTimes="0;0.3;1"
                        values="15;30;15" />
                </circle>
            </svg>
        </div>

    )
}
