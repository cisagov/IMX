import { Component, Optional } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-loading-modal',
  templateUrl: './loading-modal.component.html',
  styleUrl: './loading-modal.component.css',
})
export class LoadingModalComponent {
  constructor(
    @Optional() public dialogRef: MatDialogRef<LoadingModalComponent>,
  ) {}

  cancel() {
    this.dialogRef.close({ cancel: true });
  }
}
