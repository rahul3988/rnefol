import React, { useState, useEffect, useRef } from 'react'

interface SplashScreenProps {
  onComplete: () => void
}

type VideoType = 'portrait' | 'tablet' | 'desktop'

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [showSkipButton, setShowSkipButton] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [videoType, setVideoType] = useState<VideoType>('desktop')
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasStartedPlayingRef = useRef(false)

  // Detect device type and aspect ratio
  useEffect(() => {
    const detectVideoType = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      // Portrait mode (9:16 ratio) - height > width
      if (height > width) {
        const portraitRatio = height / width
        // 9:16 in portrait = 16/9 = 1.778, allow some tolerance (1.5 to 2.5)
        if (portraitRatio >= 1.5) {
          setVideoType('portrait')
          return
        }
      }

      // Calculate landscape aspect ratio
      const aspectRatio = width / height

      // Tablet mode (4:3 = 1.333) - allow tolerance between 1.1 and 1.6
      if (aspectRatio >= 1.1 && aspectRatio <= 1.6) {
        setVideoType('tablet')
        return
      }

      // Desktop/Landscape mode (16:9 = 1.778) - wider screens
      // Default to desktop for aspect ratio > 1.6
      setVideoType('desktop')
    }

    // Check initial orientation
    detectVideoType()

    // Listen for orientation changes
    window.addEventListener('resize', detectVideoType)
    window.addEventListener('orientationchange', detectVideoType)

    return () => {
      window.removeEventListener('resize', detectVideoType)
      window.removeEventListener('orientationchange', detectVideoType)
    }
  }, [])

  useEffect(() => {
    // Show skip button after 3 seconds
    const skipTimer = setTimeout(() => {
      setShowSkipButton(true)
    }, 3000)

    return () => clearTimeout(skipTimer)
  }, [])

  const handleVideoEnded = () => {
    // Video finished, navigate to page
    onComplete()
  }

  const handleVideoLoaded = () => {
    setIsVideoLoaded(true)
    setVideoError(false)
  }

  const handleVideoError = () => {
    setVideoError(true)
    setIsVideoLoaded(false)
    // Auto-complete after error
    setTimeout(() => {
      onComplete()
    }, 2000)
  }

  const handleSkip = () => {
    onComplete()
  }

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }

  // Get the appropriate video source based on device type
  const getVideoSource = () => {
    switch (videoType) {
      case 'portrait':
        return '/IMAGES/SS LOGO PORTRAIT.mp4'
      case 'tablet':
        return '/IMAGES/SS LOGO TAB.mp4'
      case 'desktop':
      default:
        return '/IMAGES/SS LOGO.mp4'
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Full-screen video container */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        {!videoError ? (
          <video
            ref={videoRef}
            className="w-full h-full object-contain cursor-pointer"
            muted
            playsInline
            preload="auto"
            onEnded={handleVideoEnded}
            onLoadedData={handleVideoLoaded}
            onCanPlay={() => {
              // Ensure video plays only once when ready
              if (videoRef.current && !hasStartedPlayingRef.current && videoRef.current.paused) {
                hasStartedPlayingRef.current = true
                videoRef.current.play().catch((err) => {
                  console.error('Error playing video:', err)
                })
              }
            }}
            onError={handleVideoError}
            onClick={handleVideoClick}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          >
            <source src={getVideoSource()} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-center">
            <div>
              <div className="text-6xl mb-4">🎬</div>
              <h2 className="text-2xl font-bold mb-2">Video Loading Error</h2>
              <p className="text-lg opacity-80">Proceeding to website...</p>
            </div>
          </div>
        )}
        
        {/* Loading indicator - only shown while video is loading */}
        {!isVideoLoaded && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">Loading video...</p>
            </div>
          </div>
        )}
      </div>

      {/* Skip Button */}
      {showSkipButton && isVideoLoaded && (
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors border border-white/30 z-10"
        >
          Skip
        </button>
      )}

      {/* Video Controls Hint */}
      {isVideoLoaded && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white/70 text-sm">
          Click video to play/pause
        </div>
      )}
    </div>
  )
}
