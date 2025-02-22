import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core'
import { ScreenshotFrame, ScreenshotService } from './screenshot.service'

@Directive({
  standalone: true,
  selector: '[nwbScreenshotFrame]',
})
export class ScreenshotFrameDirective implements ScreenshotFrame, OnInit, OnDestroy {
  @Input()
  public nwbScreenshotFrame: string

  public get description() {
    return this.nwbScreenshotFrame
  }

  public constructor(private service: ScreenshotService, public readonly elementRef: ElementRef<HTMLElement>) {
    //
  }

  public ngOnInit(): void {
    this.service.register(this)
  }

  public ngOnDestroy(): void {
    this.service.unregister(this)
  }
}
