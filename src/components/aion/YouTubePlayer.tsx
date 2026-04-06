import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VolumeX, ExternalLink } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

export default function YouTubePlayer() {
  const videoId = useUIStore(state => state.youtubeVideoId);
  const setVideoId = useUIStore(state => state.setYoutubeVideoId);

  return (
    <AnimatePresence>
      {videoId && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: 20 }}
          className="absolute bottom-32 right-6 w-80 aspect-video bg-black rounded-xl overflow-hidden hud-border shadow-2xl z-40 pointer-events-auto"
        >
          <div className="absolute top-2 right-2 z-50 flex gap-2">
            <a 
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-black/60 rounded-full hover:bg-jarvis-cyan/80 transition-colors"
              title="Open in YouTube"
            >
              <ExternalLink className="w-4 h-4 text-white" />
            </a>
            <button 
              onClick={() => setVideoId(null)}
              className="p-1.5 bg-black/60 rounded-full hover:bg-red-500/80 transition-colors"
              title="Close Player"
            >
              <VolumeX className="w-4 h-4 text-white" />
            </button>
          </div>
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&origin=${window.location.origin}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
