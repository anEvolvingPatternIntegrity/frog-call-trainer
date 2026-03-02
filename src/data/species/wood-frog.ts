import type { Species } from '../../types';

export const woodFrog: Species = {
  id: 'wood-frog',
  commonName: 'Wood Frog',
  scientificName: 'Lithobates sylvaticus',
  audio: [
    {
      file: 'roanoke-valley/wood-frog-1.mp3',
      attribution: 'USGS Amphibian Research and Monitoring Initiative (ARMI)',
    },
  ],
  photos: [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/twenty/Wood_Frog_Rana_sylvatica.jpg/640px-Wood_Frog_Rana_sylvatica.jpg',
      attribution: '© USGS / Wikimedia Commons',
      license: 'CC0',
    },
  ],
  funFact: 'One of the earliest spring callers in Virginia — choruses begin while ice is still on the water\'s edge. Its "quacking" call resembles a duck.',
};
