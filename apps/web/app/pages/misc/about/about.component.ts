import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { environment } from 'apps/web/environments/environment'

@Component({
  standalone: true,
  selector: 'nwb-about-page',
  templateUrl: './about.component.html',
  imports: [CommonModule],
  host: {
    class: 'layout-col'
  }
})
export class AboutComponent implements OnInit {
  public get version() {
    return environment.version
  }

  public get gameVersion() {
    const version = environment.version.split('-')[0]
    if (environment.isPTR) {
      return `Public Test Realm ${version}`
    }
    return environment.version.split('-')[0]
  }

  constructor() {}

  ngOnInit(): void {}
}
