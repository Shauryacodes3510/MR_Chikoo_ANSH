import React, { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export interface ChikooCinematicModalProps {
  videoId?: string;
  onComplete: () => void;
  onSkip?: () => void;
  allowSkip?: boolean;
}

export const ChikooCinematicModal: React.FC<ChikooCinematicModalProps> = ({
  videoId = 'piyTaGRJp7s',
  onComplete,
  onSkip,
  allowSkip = true,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const hasFinishedRef = useRef(false);

  // Safe exit callback
  const handleExit = useCallback((isExplicitSkip = false) => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    if (isExplicitSkip && onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  }, [onComplete, onSkip]);

  // Listen to YouTube postMessage events for playback completion
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      try {
        let payload = event.data;
        if (typeof payload === 'string') {
          payload = JSON.parse(payload);
        }

        if (!payload) return;

        // YouTube player state 0 = ENDED
        if (payload.event === 'onStateChange' || payload.event === 'infoDelivery') {
          const state = payload.info?.playerState !== undefined 
            ? payload.info.playerState 
            : payload.info;

          if (state === 0) {
            handleExit(false);
          }
        }
      } catch {
        // Not a JSON postMessage; ignore
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => {
      window.removeEventListener('message', handleWindowMessage);
    };
  }, [handleExit]);

  // Embed URL matching user's exact requested query string + modestbranding + enablejsapi for end detection
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&iv_load_policy=3&fs=0&controls=0&disablekb=1&modestbranding=1&enablejsapi=1`;

  return (
    <motion.div
      key="chikoo-cinematic-fullscreen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 w-screen h-[100dvh] z-[99999999] overflow-hidden bg-black select-none pointer-events-auto"
      style={{
        width: '100vw',
        height: '100dvh',
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
      }}
    >
      {/* Top-Right Minimal Skip Button */}
      {allowSkip && (
        <button
          onClick={() => handleExit(true)}
          className="absolute top-4 right-4 z-50 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/85 active:scale-95 text-white/80 hover:text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-2xl"
        >
          <span>Skip</span>
          <X className="w-3.5 h-3.5 text-white/70" />
        </button>
      )}

      {/* Pure Fullscreen Video Container with Overscan to Crop YouTube Title & Channel Info */}
      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden pointer-events-none">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title="Chikoo building collapsing snowman"
          frameBorder="0"
          className="border-0 pointer-events-none"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(1.22)',
            transformOrigin: 'center center',
            width: 'max(100vw, calc(100dvh * 16 / 9))',
            height: 'max(100dvh, calc(100vw * 9 / 16))',
            minWidth: '100%',
            minHeight: '100%',
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </motion.div>
  );
};

export default ChikooCinematicModal;
