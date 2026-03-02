import type { Species } from '../../types';

export const northernCricketFrog: Species = {
  id: 'northern-cricket-frog',
  commonName: 'Northern Cricket Frog',
  scientificName: 'Acris crepitans',
  audio: [
    {
      file: 'roanoke-valley/northern-cricket-frog-1.mp3',
      attribution: 'USGS Amphibian Research and Monitoring Initiative (ARMI)',
    },
  ],
  photos: [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Acris_crepitans_blanchardi.jpg/640px-Acris_crepitans_blanchardi.jpg',
      attribution: '© John P. Clare / Wikimedia Commons, CC-BY-NC 2.0',
      license: 'CC-BY',
    },
  ],
  funFact: 'Its rapid clicking call — like two pebbles struck together — increases in tempo when excited. Despite being a treefrog, it rarely climbs.',
};
