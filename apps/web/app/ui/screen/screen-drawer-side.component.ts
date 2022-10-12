import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { ScreenDrawerToggleDirective } from './screen-drawer.directive'

@Component({
  standalone: true,
  selector: 'nwb-screen-drawer-side',
  template: `
    <div class="drawer-overlay" [nwbScreenDrawerToggle]="'toggle'"></div>
    <div class="flex flex-col screen-gap">
      <ng-content></ng-content>
    </div>
  `,
  imports: [CommonModule, ScreenDrawerToggleDirective],
  host: {
    class: 'drawer-side',
  },
})
export class ScreenDrawerSideComponent {}
