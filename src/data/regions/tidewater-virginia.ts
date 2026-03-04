import type { Region } from '../../types';
import { springPeeper } from '../species/spring-peeper';
import { uplandChorusFrog } from '../species/upland-chorus-frog';
import { americanToad } from '../species/american-toad';
import { fowlersToad } from '../species/fowlers-toad';
import { easternSpadefoot } from '../species/eastern-spadefoot';
import { easternCricketFrog } from '../species/eastern-cricket-frog';
import { grayTreefrogComplex } from '../species/gray-treefrog-complex';
import { greenFrog } from '../species/green-frog';
import { americanBullfrog } from '../species/american-bullfrog';
import { coastalPlainsLeopardFrog } from '../species/coastal-plains-leopard-frog';
import { greenTreefrog } from '../species/green-treefrog';
import { barkingTreefrog } from '../species/barking-treefrog';
import { easternNarrowmouthToad } from '../species/eastern-narrowmouth-toad';
import { withAudio, withPhoto } from '../withSpeciesData';

export const tidewaterVirginia: Region = {
  id: 'tidewater-virginia',
  name: 'Tidewater, VA',
  species: [
    springPeeper,
    uplandChorusFrog,
    americanToad,
    fowlersToad,
    easternSpadefoot,
    easternCricketFrog,
    grayTreefrogComplex,
    greenFrog,
    americanBullfrog,
    coastalPlainsLeopardFrog,
    greenTreefrog,
    barkingTreefrog,
    easternNarrowmouthToad,
  ].map(withAudio).map(withPhoto),
};
