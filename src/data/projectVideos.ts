// Code-side fallback for case-study videos. Used only when the Sanity
// project's `video` field is empty, so a value set in Studio always wins.
// Files live in public/assets/video/.
export type ProjectVideo = { video: string; poster?: string; caption?: string };

export const projectVideos: Record<string, ProjectVideo> = {
  'house-demolition-esher': {
    video: '/assets/video/esher-demolition.mp4',
    poster: '/assets/video/esher-demolition-poster.jpg',
    caption: 'Aerial view of the Esher demolition',
  },
};
