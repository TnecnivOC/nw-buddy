import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'

import { NwModule } from '~/nw'
import { ScreenModule } from '~/ui/screen'
import { TerritoriesRoutingModule } from './territories-routing.module'

@NgModule({
  imports: [CommonModule, NwModule, TerritoriesRoutingModule],
  declarations: [],
})
export class TerritoriesModule {
  //
}
