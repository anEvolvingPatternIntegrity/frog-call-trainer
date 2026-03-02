import type { Region } from '../../types';
import { americanBullfrog } from '../species/american-bullfrog';
import { greenFrog } from '../species/green-frog';
import { pickerelFrog } from '../species/pickerel-frog';
import { woodFrog } from '../species/wood-frog';
import { grayTreefrogComplex } from '../species/gray-treefrog-complex';
import { springPeeper } from '../species/spring-peeper';
import { uplandChorusFrog } from '../species/upland-chorus-frog';
import { mountainChorusFrog } from '../species/mountain-chorus-frog';
import { americanToad } from '../species/american-toad';
import { fowlersToad } from '../species/fowlers-toad';
import { easternNarrowmouthToad } from '../species/eastern-narrowmouth-toad';
import { northernCricketFrog } from '../species/northern-cricket-frog';

export const roanokeValley: Region = {
  id: 'roanoke-valley',
  name: 'Roanoke Valley, VA',
  species: [
    americanBullfrog,
    greenFrog,
    pickerelFrog,
    woodFrog,
    grayTreefrogComplex,
    springPeeper,
    uplandChorusFrog,
    mountainChorusFrog,
    americanToad,
    fowlersToad,
    easternNarrowmouthToad,
    northernCricketFrog,
  ],
};
