declare global {
  interface YouTubePlayer {
    playVideo: () => void;
    pauseVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
    getCurrentTime: () => number;
    getDuration: () => number;
    destroy: () => void;
  }

  interface YouTubePlayerState {
    PLAYING: number;
    PAUSED: number;
    ENDED: number;
  }

  interface YouTubeNamespace {
    Player: new (
      element: HTMLElement | string,
      options: {
        videoId: string;
        width?: number | string;
        height?: number | string;
        playerVars?: Record<string, number | string>;
        events?: {
          onReady?: () => void;
          onStateChange?: (event: { data: number }) => void;
        };
      }
    ) => YouTubePlayer;
    PlayerState: YouTubePlayerState;
  }

  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export {};
