import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TrackByFunction } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemDetailService } from './item-detail.service'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-stats',
  exportAs: 'itemDetailStats',
  templateUrl: 'item-detail-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, OverlayModule, ItemFrameModule],
  host: {
    class: 'block',
  },
})
export class ItemDetailStatsComponent {

  protected vm$ = this.detail.vmStats$
  protected trackByIndex: TrackByFunction<any> = (i) => i

  public constructor(protected detail: ItemDetailService) {
    //
  }

  protected onGearScoreEdit(e: MouseEvent) {
    if (this.detail.gsEditable$.value) {
      this.detail.gsEdit$.emit(e)
    }
  }
}
