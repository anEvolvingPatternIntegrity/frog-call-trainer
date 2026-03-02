import type { Species } from '../../types';

export const springPeeper: Species = {
  id: 'spring-peeper',
  commonName: 'Spring Peeper',
  scientificName: 'Pseudacris crucifer',
  audio: [
    {
      file: 'roanoke-valley/spring-peeper-1.mp3',
      attribution: 'USGS Amphibian Research and Monitoring Initiative (ARMI)',
    },
  ],
  photos: [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Spring_Peeper_Pseudacris_crucifer.jpg/640px-Spring_Peeper_Pseudacris_crucifer.jpg',
      attribution: '© USGS / Wikimedia Commons',
      license: 'CC0',
    },
  ],
  funFact: 'A pea-sized frog capable of producing a shrill peep heard a half-mile away. A chorus of hundreds sounds like jingling bells.',
};
