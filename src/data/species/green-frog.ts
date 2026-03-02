import type { Species } from '../../types';

export const greenFrog: Species = {
  id: 'green-frog',
  commonName: 'Green Frog',
  scientificName: 'Lithobates clamitans',
  audio: [
    {
      file: 'roanoke-valley/green-frog-1.mp3',
      attribution: 'USGS Amphibian Research and Monitoring Initiative (ARMI)',
    },
  ],
  photos: [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/nine/Green_Frog_Rana_clamitans.jpg/640px-Green_Frog_Rana_clamitans.jpg',
      attribution: '© Ltshears / Wikimedia Commons, CC-BY-SA 3.0',
      license: 'CC-BY-SA',
    },
  ],
  funFact: 'Its call sounds like a plucked banjo string — each "gung" is a single, loud twang.',
};
