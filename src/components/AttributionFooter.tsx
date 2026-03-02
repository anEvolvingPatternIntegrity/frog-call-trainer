import type { AudioCredit, PhotoCredit } from '../types';

export interface PhotoAttr {
  speciesName: string;
  credit: PhotoCredit;
}

interface Props {
  photos?: PhotoAttr[];
  audio?: AudioCredit | null;
}

export function AttributionFooter({ photos = [], audio }: Props) {
  const hasAudio = !!audio?.attribution;
  const hasPhotos = photos.length > 0;
  if (!hasAudio && !hasPhotos) return null;

  return (
    <footer className="bg-black/70 text-white/50 text-[11px] leading-relaxed px-4 py-3 space-y-2.5">
      {hasAudio && (
        <p>
          <span className="text-white/30 uppercase tracking-widest text-[9px] mr-2">Recording</span>
          {audio!.attribution}
        </p>
      )}
      {hasPhotos && (
        <div>
          <span className="text-white/30 uppercase tracking-widest text-[9px]">
            Photo{photos.length > 1 ? 's' : ''}
          </span>
          <ul className="mt-1 space-y-0.5">
            {photos.map(({ speciesName, credit }) => (
              <li key={speciesName}>
                <span className="text-white/35">{speciesName} — </span>
                {credit.attribution}
              </li>
            ))}
          </ul>
        </div>
      )}
    </footer>
  );
}
