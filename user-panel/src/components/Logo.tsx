import React from 'react'

interface LogoProps {
  className?: string
  href?: string
}

export default function Logo({ className = "font-semibold text-xl hover:text-blue-600 transition-colors", href = "#/" }: LogoProps) {
  return (
    <a href={href} className={className}>
      <img 
        src="/IMAGES/light theme logo.png" 
        alt="Nefol" 
        className="h-12 w-auto"
        onError={(e) => {
          // Fallback to text if image fails to load
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const parent = target.parentElement
          if (parent) {
            parent.textContent = 'Nefol'
          }
        }}
      />
    </a>
  )
}
