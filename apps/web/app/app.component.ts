import { DOCUMENT } from '@angular/common'
import { Component, HostBinding, Inject } from '@angular/core'
import { sortBy } from 'lodash'
import { environment } from '../environments/environment'

import { ElectronService } from './electron'
import { TranslateService } from './i18n'

import { LANG_OPTIONS, MAIN_MENU } from './menu'
import { AppPreferencesService } from './preferences'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  host: {
    class: 'layout-frame layout-col layout-gap',
  },
})
export class AppComponent {
  @HostBinding('class.is-electron')
  public get isElectron() {
    return this.electron.isElectron
  }

  @HostBinding('class.is-web')
  public get isWeb() {
    return environment.environment === 'WEB' || environment.environment === 'DEV'
  }

  public get language() {
    return this.preferences.language.get()
  }
  public set language(value: string) {
    this.preferences.language.set(value)
  }

  protected mainMenu = MAIN_MENU
  protected langOptions = LANG_OPTIONS

  constructor(
    private preferences: AppPreferencesService,
    private electron: ElectronService,
    @Inject(DOCUMENT)
    document: Document,
    translate: TranslateService
  ) {
    preferences.language.observe().subscribe((locale) => translate.use(locale))
    if (this.isWeb) {
      document.body.classList.add('is-web')
    }
    if (this.isElectron) {
      document.body.classList.add('is-electron')
    }
  }
}
