import type { Species } from '../../types';

export const grayTreefrogComplex: Species = {
  id: 'gray-treefrog-complex',
  commonName: 'Gray Treefrog Complex',
  scientificName: 'Dryophytes chrysoscelis / D. versicolor',
  audio: [
    {
      file: 'roanoke-valley/gray-treefrog-1.mp3',
      attribution: 'USGS Amphibian Research and Monitoring Initiative (ARMI)',
    },
    {
      file: 'roanoke-valley/copes-gray-treefrog-1.mp3',
      attribution: 'USGS Amphibian Research and Monitoring Initiative (ARMI)',
    },
  ],
  photos: [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Hyla_versicolor.jpg/640px-Hyla_versicolor.jpg',
      attribution: '© Patrick Coin / Wikimedia Commons, CC-BY-SA 2.5',
      license: 'CC-BY-SA',
    },
  ],
  funFact: 'Cope\'s Gray Treefrog and Eastern Gray Treefrog are acoustically nearly indistinguishable to the human ear — only their chromosome count (and faint trill rate differences) set them apart.',
};
