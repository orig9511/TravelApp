import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TranslateModule],
})
export class HomeComponent {
  carouselImageSources = [
    "images/home/01_africa.jpg",
    "images/home/02_europe.jpg",
    "images/home/03_northamerica.jpg",
    "images/home/04_southamerica.jpg",
    "images/home/05_asia.jpg",
    "images/home/06_australia.jpg",
  ];

  continentNames = [
    "Africa",
    "Europe",
    "North America",
    "South America",
    "Asia",
    "Australia",
  ];

  constructor(private router: Router) {}

  exploreContinent(index: number): void {
    const continent = this.continentNames[index];
    this.router.navigate(["/offers"], { queryParams: { continent } });
  }

  trackByIndex(index: number): number {
    return index;
  }
}
