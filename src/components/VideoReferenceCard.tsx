import type { VideoReference } from '../videos';

export function VideoReferenceCard({ video }: { video: VideoReference }) {
  return (
    <a
      className="video-reference-card"
      data-testid="video-reference-card"
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="video-card-meta">
        <strong>{video.title}</strong>
        <span>{video.creator} · {video.duration}</span>
      </div>
      <p className="video-card-note">{video.note}</p>
    </a>
  );
}
