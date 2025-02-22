import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { groupBy, uniqBy } from 'lodash'
import { combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { getVitalDungeon } from '~/nw/utils'
import { mapFilter } from '~/utils'
import { mergeVitals } from './utils'
import { VitalDetailComponent } from './vital-detail.component'

const REJECT = ['undefined', 'human']
@Component({
  standalone: true,
  selector: 'nwb-vitals-families-list',
  templateUrl: './vitals-families-list.component.html',
  styleUrls: ['./vitals-families-list.component.scss'],
  imports: [CommonModule, VitalDetailComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('listAnimation', [
      transition('void => *', [
        query(':enter', [style({ opacity: 0 }), stagger(50, [animate('0.3s', style({ opacity: 1 }))])]),
      ]),
    ]),
    trigger('apperAnimation', [
      state('*', style({ opacity: 0 })),
      state('true', style({ opacity: 1 })),
      transition('* => true', [animate('0.3s')]),
    ]),
  ],
})
export class VitalsFamiliesListComponent {
  protected families$ = this.db.vitalsFamilies.pipe(mapFilter((it) => !REJECT.includes(it)))
  protected entities$ = combineLatest({
    byFamily: this.db.vitalsByFamily,
    families: this.families$,
    gameModes: this.db.gameModes,
  }).pipe(
    map(({ families, byFamily, gameModes }) => {
      return families.map((family) => {
        const vitals = byFamily.get(family)
        const dungeons = vitals.map((it) => getVitalDungeon(it, gameModes)).filter((it) => !!it)
        const dngGrouped = groupBy(dungeons, (it) => it.GameModeId)
        return {
          vital: mergeVitals(family, vitals),
          dungeons: Object.values(dngGrouped).filter((list) => list.length > 2).map(((list) => list[0])),
        }
      })
    })
  )

  public constructor(private db: NwDbService) {}
}
