import type { Region } from '../../types';
import { woodFrog } from '../species/wood-frog';
import { springPeeper } from '../species/spring-peeper';
import { uplandChorusFrog } from '../species/upland-chorus-frog';
import { americanToad } from '../species/american-toad';
import { fowlersToad } from '../species/fowlers-toad';
import { pickerelFrog } from '../species/pickerel-frog';
import { easternSpadefoot } from '../species/eastern-spadefoot';
import { easternCricketFrog } from '../species/eastern-cricket-frog';
import { grayTreefrogComplex } from '../species/gray-treefrog-complex';
import { greenFrog } from '../species/green-frog';
import { americanBullfrog } from '../species/american-bullfrog';
import { coastalPlainsLeopardFrog } from '../species/coastal-plains-leopard-frog';

export const roanokeValley: Region = {
  id: 'roanoke-valley',
  name: 'Roanoke Valley, VA',
  species: [
    woodFrog,
    springPeeper,
    uplandChorusFrog,
    americanToad,
    fowlersToad,
    pickerelFrog,
    easternSpadefoot,
    easternCricketFrog,
    grayTreefrogComplex,
    greenFrog,
    americanBullfrog,
    coastalPlainsLeopardFrog,
  ],
};
