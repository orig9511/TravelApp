import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
} from "@angular/core";

@Component({
  selector: "app-continent-selector",
  templateUrl: "./continent-selector.component.html",
  styleUrls: ["./continent-selector.component.scss"],
})
export class ContinentSelectorComponent implements OnInit, OnDestroy {
  @Output() continentSelected = new EventEmitter<string | null>();

  private handler = (event: MessageEvent) => {
    if (event.data?.type === "continent-selected") {
      this.continentSelected.emit(event.data.continent);
    }
  };

  ngOnInit() {
    window.addEventListener("message", this.handler);
  }

  ngOnDestroy() {
    window.removeEventListener("message", this.handler);
  }
}
