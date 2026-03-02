import type { Species } from '../../types';

export const americanBullfrog: Species = {
  id: 'american-bullfrog',
  commonName: 'American Bullfrog',
  scientificName: 'Lithobates catesbeianus',
  audio: [
    {
      file: 'roanoke-valley/american-bullfrog-1.mp3',
      attribution: 'USGS Amphibian Research and Monitoring Initiative (ARMI)',
    },
  ],
  photos: [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/sixty/American-Bullfrog.jpg/640px-American-Bullfrog.jpg',
      attribution: '© USGS / Wikimedia Commons',
      license: 'CC0',
    },
  ],
  funFact: 'The deepest-voiced frog in eastern North America — its resonant "jug-o-rum" can carry over a kilometer on calm nights.',
};
