import { TodayModule } from './today';
import { FitnessModule } from './fitness';
import { FinanceModule } from './finance';
import { EnglishListeningModule } from './english-listening';
import { EnglishReadingModule } from './english-reading';
import { ParcelModule } from './parcel';
import type { ModuleId } from '../types';

export const moduleComponents: Record<ModuleId, React.ComponentType> = {
  today: TodayModule,
  fitness: FitnessModule,
  'english-listening': EnglishListeningModule,
  'english-reading': EnglishReadingModule,
  finance: FinanceModule,
  parcel: ParcelModule,
};
