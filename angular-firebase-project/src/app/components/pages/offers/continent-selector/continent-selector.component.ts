import {
  Component,
  AfterViewInit,
  OnDestroy,
  Output,
  EventEmitter,
} from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Subscription } from "rxjs";

declare const simplemaps_continentmap: any;
declare const simplemaps_continentmap_mapdata: any;

@Component({
  selector: "app-continent-selector",
  templateUrl: "./continent-selector.component.html",
  styleUrls: ["./continent-selector.component.scss"],
})
export class ContinentSelectorComponent implements AfterViewInit, OnDestroy {
  @Output() continentSelected = new EventEmitter<string | null>();

  private langSub?: Subscription;
  private scriptsLoaded = false;

  private continentHandler = (event: Event) => {
    const customEvent = event as CustomEvent<string>;
    const continent = customEvent.detail ?? null;
    this.continentSelected.emit(continent);
  };

  constructor(private translate: TranslateService) {}

  ngAfterViewInit(): void {
    this.loadScriptsThenMap();

    window.addEventListener("continent-selected", this.continentHandler);

    this.langSub = this.translate.onLangChange.subscribe(() => {
      this.updateMapNames();
      this.loadMap();
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    window.removeEventListener("continent-selected", this.continentHandler);
  }

  private loadScriptsThenMap(): void {
    if (this.scriptsLoaded) {
      this.updateMapNames();
      this.loadMap();
      return;
    }

    const mapDataCandidates = [
      "/assets/continent-map/mapdata.js",
      "assets/continent-map/mapdata.js",
      "/continent-map/mapdata.js",
      "continent-map/mapdata.js",
    ];

    const mapScriptCandidates = [
      "/assets/continent-map/continentmap.js",
      "assets/continent-map/continentmap.js",
      "/continent-map/continentmap.js",
      "continent-map/continentmap.js",
    ];

    this.loadScriptWithFallback(mapDataCandidates)
      .then(() => this.loadScriptWithFallback(mapScriptCandidates))
      .then(() => {
        this.scriptsLoaded = true;
        this.updateMapNames();
        this.loadMap();
      })
      .catch(() => {
        // Keep this visible in dev tools; otherwise map failures are silent.
        console.error(
          "Failed to load continent map scripts from any known path.",
        );
      });
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  }

  private loadScriptWithFallback(candidates: string[]): Promise<void> {
    const tryNext = (index: number): Promise<void> => {
      if (index >= candidates.length) {
        return Promise.reject(new Error("All script candidate paths failed"));
      }

      return this.loadScript(candidates[index]).catch(() => tryNext(index + 1));
    };

    return tryNext(0);
  }

  private updateMapNames(): void {
    if (typeof simplemaps_continentmap_mapdata === "undefined") return;

    const states = simplemaps_continentmap_mapdata.state_specific;
    if (!states) return;

    const nameMap: Record<string, string> = {
      SA: this.translate.instant("continents.southAmerica"),
      NA: this.translate.instant("continents.northAmerica"),
      EU: this.translate.instant("continents.europe"),
      AF: this.translate.instant("continents.africa"),
      NS: this.translate.instant("continents.northAsia"),
      SS: this.translate.instant("continents.southAsia"),
      ME: this.translate.instant("continents.middleEast"),
      OC: this.translate.instant("continents.oceania"),
    };

    for (const code of Object.keys(nameMap)) {
      if (states[code]) {
        states[code].name = nameMap[code];
      }
    }
  }

  private loadMap(): void {
    setTimeout(() => {
      const mapEl = document.getElementById("map");
      if (!mapEl) return;

      if (
        typeof simplemaps_continentmap !== "undefined" &&
        typeof simplemaps_continentmap.load === "function"
      ) {
        simplemaps_continentmap.load();
      }
    }, 0);
  }
}
