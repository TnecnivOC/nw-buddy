import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DestroyService } from '~/utils'
import { TerritoryModule } from '~/widgets/territory'

@Component({
  standalone: true,
  selector: 'nwb-territories-standing',
  templateUrl: './territories-standing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TerritoryModule],
  providers: [DestroyService],
  host: {
    class: 'layout-content rounded-md',
  },
})
export class TerritoriesStandingComponent {
  //
}
