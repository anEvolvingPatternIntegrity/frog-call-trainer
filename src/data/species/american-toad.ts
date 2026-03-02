import type { Species } from '../../types';

export const americanToad: Species = {
  id: 'american-toad',
  commonName: 'American Toad',
  scientificName: 'Anaxyrus americanus',
  audio: [
    {
      file: 'roanoke-valley/american-toad-1.mp3',
      attribution: 'USGS Amphibian Research and Monitoring Initiative (ARMI)',
    },
  ],
  photos: [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Bufo_americanus_PCS.jpg/640px-Bufo_americanus_PCS.jpg',
      attribution: '© Patrick Coin / Wikimedia Commons, CC-BY-SA 2.5',
      license: 'CC-BY-SA',
    },
  ],
  funFact: 'Its long, melodious trill can last 20–30 seconds. Each individual toad\'s trill is a unique frequency — like a fingerprint.',
};
