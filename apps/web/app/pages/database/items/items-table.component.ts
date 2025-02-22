import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'

@Component({
  standalone: true,
  selector: 'nwb-items-table',
  templateUrl: './items-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, QuicksearchModule, DataTableModule],
  host: {
    class: 'layout-row',
  },
})
export class ItemsTableComponent {
  public constructor(public search: QuicksearchService) {
    //
  }
}
