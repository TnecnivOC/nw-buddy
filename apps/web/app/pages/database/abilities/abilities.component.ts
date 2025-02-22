import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { NavToolbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { AbilitiesTableAdapter } from '~/widgets/adapter'

@Component({
  standalone: true,
  selector: 'nwb-abilities-page',
  templateUrl: './abilities.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, DataTableModule, NavToolbarModule, QuicksearchModule, IonicModule],
  host: {
    class: 'layout-col',
  },
  providers: [AbilitiesTableAdapter.provider(), QuicksearchService],
})
export class AbilitiesComponent {
  //
}
