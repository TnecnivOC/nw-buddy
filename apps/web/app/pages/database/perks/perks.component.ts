import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { firstValueFrom } from 'rxjs'
import { CharacterStore } from '~/data'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { NavToolbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule } from '~/ui/quicksearch'
import { PerksTableAdapter } from '~/widgets/adapter'
import { ExprContextService } from '~/widgets/adapter/exp-context.service'

@Component({
  standalone: true,
  selector: 'nwb-perks-page',
  templateUrl: './perks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    OverlayModule,
    NwModule,
    QuicksearchModule,
    DataTableModule,
    NavToolbarModule,
    IonicModule,
  ],
  host: {
    class: 'layout-col',
  },
  providers: [PerksTableAdapter.provider(), ExprContextService],
})
export class PerksComponent {
  protected isToolOpen = false
  public constructor(public ctx: ExprContextService, char: CharacterStore) {
    firstValueFrom(char.level$).then((value) => {
      ctx.level = value
    })
  }
}
