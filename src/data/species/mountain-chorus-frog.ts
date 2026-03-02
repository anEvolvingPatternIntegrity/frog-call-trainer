import type { Species } from '../../types';

export const mountainChorusFrog: Species = {
  id: 'mountain-chorus-frog',
  commonName: 'Mountain Chorus Frog',
  scientificName: 'Pseudacris brachyphona',
  audio: [
    {
      file: 'roanoke-valley/mountain-chorus-frog-1.wav',
      attribution: '© John Abrams / iNaturalist, CC-BY 4.0 (observation #31563)',
    },
  ],
  photos: [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Pseudacris_brachyphona.jpg/640px-Pseudacris_brachyphona.jpg',
      attribution: '© Todd Pierson / Wikimedia Commons, CC-BY-NC-SA 2.0',
      license: 'CC-BY-SA',
    },
  ],
  funFact: 'Scarce in the Roanoke Valley — found primarily on wooded hillsides near rocky, temporary pools. Its call is higher-pitched and more musical than the Upland Chorus Frog.',
};
