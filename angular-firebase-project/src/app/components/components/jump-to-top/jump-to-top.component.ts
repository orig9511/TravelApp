import {
  Component,
  HostListener,
  Input,
  ChangeDetectionStrategy,
} from "@angular/core";

@Component({
  selector: "app-jump-to-top",
  templateUrl: "./jump-to-top.component.html",
  styleUrls: ["./jump-to-top.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JumpToTopComponent {
  @Input() threshold = 300;

  isVisible = false;

  @HostListener("window:scroll", [])
  onWindowScroll(): void {
    this.isVisible = window.scrollY > this.threshold;
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
}
