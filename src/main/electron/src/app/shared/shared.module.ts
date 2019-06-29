import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorDialogComponent } from './components/error-dialog/error-dialog.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [ErrorDialogComponent, ConfirmDialogComponent],
  entryComponents: [ErrorDialogComponent, ConfirmDialogComponent],
  imports: [CommonModule, NgbModalModule, TranslateModule.forChild()],
  exports: [ErrorDialogComponent, ConfirmDialogComponent],
})
export class SharedModule {}
