import type { Species } from '../../types';

export const fowlersToad: Species = {
  id: 'fowlers-toad',
  commonName: "Fowler's Toad",
  scientificName: 'Anaxyrus fowleri',
  audio: [
    {
      file: 'roanoke-valley/fowlers-toad-1.mp3',
      attribution: '© Chris Harrison / iNaturalist, CC-BY-NC 4.0 (observation #917443)',
    },
  ],
  photos: [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Anaxyrus_fowleri_01.jpg/640px-Anaxyrus_fowleri_01.jpg',
      attribution: '© Peter Paplanus / Wikimedia Commons, CC-BY 2.0',
      license: 'CC-BY',
    },
  ],
  funFact: 'Its buzzy, nasal "waaah" is often described as a baby crying. Unlike the American Toad\'s musical trill, it sounds distinctly unpleasant.',
};
