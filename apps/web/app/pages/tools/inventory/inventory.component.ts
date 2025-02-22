import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { firstValueFrom, take } from 'rxjs'
import { GearsetsStore, ItemInstanceRow, ItemInstancesStore } from '~/data'
import { NwModule } from '~/nw'
import { getItemId, getItemMaxGearScore } from '~/nw/utils'
import { DataTableAdapter, DataTableModule } from '~/ui/data-table'
import { IconsModule } from '~/ui/icons'
import { svgPlus, svgTrashCan } from '~/ui/icons/svg'
import { NavToolbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { ScreenshotModule } from '~/widgets/screenshot'
import { GearsetMigrationService } from '../gearsets/gearset-migration.srvice'
import { GearsetFormComponent } from './gearset-form.component'
import { InventoryPickerService } from './inventory-picker.service'
import { PlayerItemsTableAdapter } from './inventory-table.adapter'

@Component({
  standalone: true,
  selector: 'nwb-inventory-page',
  templateUrl: './inventory.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    RouterModule,
    QuicksearchModule,
    DataTableModule,
    NavToolbarModule,
    ScreenshotModule,
    IconsModule,
    GearsetFormComponent,
    TooltipModule,
    IonicModule
  ],
  host: {
    class: 'layout-col',
  },
  providers: [PlayerItemsTableAdapter.provider(), QuicksearchService, InventoryPickerService, ItemInstancesStore, GearsetsStore],
})
export class PlayerItemsPageComponent implements OnInit {
  protected svgPlus = svgPlus
  protected svgTrash = svgTrashCan

  public constructor(
    private sets: GearsetsStore,
    private items: ItemInstancesStore,
    private picker: InventoryPickerService,
    private adapter: DataTableAdapter<ItemInstanceRow>,
    private migration: GearsetMigrationService
  ) {
    //
  }

  public async ngOnInit() {
    await this.migration.run()
    this.items.loadAll()
    this.sets.loadAll()
  }

  protected async createItem() {
    this.picker
      .pickItem({
        multiple: true,
        category: await firstValueFrom(this.adapter.category),
      })
      .pipe(take(1))
      .subscribe((items) => {
        for (const item of items) {
          this.items.createRecord({
            record: {
              id: null,
              itemId: getItemId(item),
              gearScore: getItemMaxGearScore(item),
              perks: {},
            },
          })
        }
      })
  }

  protected deleteItem(item: ItemInstanceRow) {
    this.items.destroyRecord({ recordId: item.record.id })
  }
}
