import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  imports: [],
  templateUrl: './placeholder.html',
  styleUrl: './placeholder.css',
})
export class Placeholder {
  private readonly route = inject(ActivatedRoute);

  protected readonly title =
    String(
      this.route.snapshot.data['title']
      ?? 'Campus Rental',
    );

  protected readonly description =
    String(
      this.route.snapshot.data['description']
      ?? 'This feature will be implemented in a later feature branch.',
    );
}