export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <svg
        width="400"
        height="120"
        viewBox="0 0 400 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'Great Vibes', cursive"
          fontSize="60"
          stroke="#000"
          strokeWidth="1"
          fill="transparent"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="1000"
            to="0"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-dasharray"
            values="1000;1000"
            dur="2s"
            repeatCount="indefinite"
          />
          Croissant
        </text>
        <style>
          {`
            text {
              stroke-dasharray: 1000;
              stroke-dashoffset: 1000;
              animation: draw 2s linear infinite;
            }
            @keyframes draw {
              0% {
                stroke-dashoffset: 1000;
              }
              100% {
                stroke-dashoffset: 0;
              }
            }
          `}
        </style>
      </svg>
    </div>
  )
}
