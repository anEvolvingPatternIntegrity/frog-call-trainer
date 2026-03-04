import type { Region } from '../../types';
import { springPeeper } from '../species/spring-peeper';
import { uplandChorusFrog } from '../species/upland-chorus-frog';
import { southernChorusFrog } from '../species/southern-chorus-frog';
import { littleGrassFrog } from '../species/little-grass-frog';
import { fowlersToad } from '../species/fowlers-toad';
import { easternSpadefoot } from '../species/eastern-spadefoot';
import { easternCricketFrog } from '../species/eastern-cricket-frog';
import { grayTreefrogComplex } from '../species/gray-treefrog-complex';
import { greenTreefrog } from '../species/green-treefrog';
import { barkingTreefrog } from '../species/barking-treefrog';
import { squirrelTreefrog } from '../species/squirrel-treefrog';
import { greenFrog } from '../species/green-frog';
import { americanBullfrog } from '../species/american-bullfrog';
import { coastalPlainsLeopardFrog } from '../species/coastal-plains-leopard-frog';
import { easternNarrowmouthToad } from '../species/eastern-narrowmouth-toad';
import { withAudio, withPhoto } from '../withSpeciesData';

export const coastalNC: Region = {
  id: 'coastal-nc',
  name: 'Coastal NC',
  species: [
    springPeeper,
    uplandChorusFrog,
    southernChorusFrog,
    littleGrassFrog,
    fowlersToad,
    easternSpadefoot,
    easternCricketFrog,
    grayTreefrogComplex,
    greenTreefrog,
    barkingTreefrog,
    squirrelTreefrog,
    greenFrog,
    americanBullfrog,
    coastalPlainsLeopardFrog,
    easternNarrowmouthToad,
  ].map(withAudio).map(withPhoto),
};
