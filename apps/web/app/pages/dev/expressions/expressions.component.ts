import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { defer, map } from 'rxjs'
import { NwDbService } from '~/nw'

@Component({
  standalone: true,
  templateUrl: './expressions.component.html',
  imports: [CommonModule],
  host: {
    class: 'layout-row layout-gap',
  },
})
export class ExpressionsComponent {

  public constructor(private db: NwDbService) {
    //
  }
}
