import type { Species } from '../../types';

export const pickerelFrog: Species = {
  id: 'pickerel-frog',
  commonName: 'Pickerel Frog',
  scientificName: 'Lithobates palustris',
  audio: [
    {
      file: 'roanoke-valley/pickerel-frog-1.wav',
      attribution: '© Dale A Morgan / iNaturalist, CC-BY-NC 4.0 (observation #112828059)',
    },
    {
      file: 'roanoke-valley/pickerel-frog-2.m4a',
      attribution: '© kkrehbielb / iNaturalist, CC-BY-NC 4.0 (observation #202955723)',
    },
  ],
  photos: [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Lithobates_palustris.jpg/640px-Lithobates_palustris.jpg',
      attribution: '© Brian Gratwicke / Wikimedia Commons, CC-BY 2.0',
      license: 'CC-BY',
    },
  ],
  funFact: 'The only naturally toxic frog in eastern North America — its skin secretions are mildly irritating to predators and other frogs.',
};
