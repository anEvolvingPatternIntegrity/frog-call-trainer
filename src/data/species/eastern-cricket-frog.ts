import type { Species } from '../../types';

export const easternCricketFrog: Species = {
  id: 'eastern-cricket-frog',
  commonName: 'Eastern Cricket Frog',
  scientificName: 'Acris gryllus',
  audio: [
    {
      file: 'roanoke-valley/eastern-cricket-frog-1.m4a',
      attribution: 'no rights reserved (CC0) / iNaturalist observation #266476930',
    },
  ],
  photos: [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Acris_gryllus_1.jpg/640px-Acris_gryllus_1.jpg',
      attribution: '© Todd Pierson / Wikimedia Commons, CC-BY-NC-SA 2.0',
      license: 'CC-BY-SA',
    },
  ],
  funFact: 'Despite being a treefrog, the Eastern Cricket Frog almost never climbs. Its rapid clicking call — like two pebbles struck together — accelerates when males are competing.',
};
