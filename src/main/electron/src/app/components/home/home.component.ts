import { Component, OnInit, NgZone } from '@angular/core';
import { ReportOptions } from '../../shared/models/report-options.model';
import { ElectronService } from '../../providers/electron.service';
import { HttpClient } from '@angular/common/http';
import { StoreService } from '../../providers/store.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import * as _ from 'lodash';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ErrorDialogComponent } from '../../shared/components/error-dialog/error-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

enum SORT_TYPE {
  ASC,
  DESC,
  MANUAL,
}
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  SORT_TYPE = SORT_TYPE;
  reportOptions: ReportOptions;
  selectDirectoriesLoading: boolean;
  createDocxLoading: boolean;
  selectedSortType: SORT_TYPE;

  constructor(
    private electronService: ElectronService,
    private storeService: StoreService,
    private zone: NgZone,
    private httpClient: HttpClient,
    private modalService: NgbModal,
    private translateService: TranslateService,
  ) {}

  ngOnInit() {
    this.selectedSortType = SORT_TYPE.ASC;
    this.reportOptions = new ReportOptions();
    this.reportOptions.project = this.storeService.get('project');
    this.reportOptions.company = this.storeService.get('company');
    this.reportOptions.vehicle = this.storeService.get('vehicle');
    this.reportOptions.isImageCheckingOn = this.storeService.get(
      'isImageCheckingOn',
    );
    this.electronService.ipcRenderer.on(
      'selectedDirectories',
      (event: Electron.IpcRendererEvent, ...args: any[]) => {
        this.zone.run(() => {
          this.reportOptions.selectedDirectories.push(...args[0]);
          this.reportOptions.templateFilePath = args[1];
          if (args[2]) {
            this.storeService.set('lastWorkingDirectory', args[2]);
          }
          this.sortDirectories();
          this.selectDirectoriesLoading = false;
        });
      },
    );
    this.electronService.ipcRenderer.on(
      'savedFile',
      (event: Electron.IpcRendererEvent, ...args: any[]) => {
        this.storeService.set('lastSavedDirectory', args[0]);
      },
    );
    this.electronService.ipcRenderer.on(
      'error',
      (event: Electron.IpcRendererEvent, ...args: any[]) => {
        const modalRef = this.modalService.open(ErrorDialogComponent, {
          centered: true,
          scrollable: true,
        });
        modalRef.componentInstance.message = args[0];
      },
    );
  }

  selectDirectories() {
    this.selectDirectoriesLoading = true;
    this.electronService.ipcRenderer.send(
      'selectDirectories',
      this.storeService.get('lastWorkingDirectory'),
    );
  }

  deleteAllDirectories() {
    this.reportOptions.selectedDirectories.splice(
      0,
      this.reportOptions.selectedDirectories.length,
    );
  }

  deleteDirectory(index: number) {
    this.reportOptions.selectedDirectories.splice(index, 1);
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex !== event.currentIndex) {
      this.selectedSortType = SORT_TYPE.MANUAL;
    }
    moveItemInArray(
      this.reportOptions.selectedDirectories,
      event.previousIndex,
      event.currentIndex,
    );
  }

  changeSortType() {
    if (this.selectedSortType === SORT_TYPE.ASC) {
      this.selectedSortType = SORT_TYPE.DESC;
    } else if (this.selectedSortType === SORT_TYPE.DESC) {
      this.selectedSortType = SORT_TYPE.MANUAL;
    } else {
      this.selectedSortType = SORT_TYPE.ASC;
    }
    this.sortDirectories();
  }

  sortDirectories() {
    if (this.selectedSortType === SORT_TYPE.ASC) {
      this.reportOptions.selectedDirectories = _.sortBy(
        this.reportOptions.selectedDirectories,
        (directoryPath: string) => {
          return this.parseDateFromDirectory(directoryPath);
        },
      );
    } else if (this.selectedSortType === SORT_TYPE.DESC) {
      this.reportOptions.selectedDirectories = _.sortBy(
        this.reportOptions.selectedDirectories,
        (directoryPath: string) => {
          return this.parseDateFromDirectory(directoryPath);
        },
      ).reverse();
    }
  }

  execDirectory(directoryPath: string): RegExpExecArray | null {
    const directoryName = directoryPath.slice(
      directoryPath.lastIndexOf('/') + 1,
    );
    const regex = /(\d{2})_(\d{2}).(\d{2}).(\d{4})/;
    return regex.exec(directoryName);
  }

  private parseDateFromDirectory(directoryPath: string): number {
    const groups = this.execDirectory(directoryPath);
    if (groups) {
      return new Date(
        parseInt(groups[4], 10),
        parseInt(groups[3], 10) - 1,
        parseInt(groups[2], 10),
      ).getTime();
    } else {
      return undefined;
    }
  }

  validate() {
    const errors: Array<string> = [];
    // validate directories's name
    this.reportOptions.selectedDirectories.forEach((directoryPath: string) => {
      const groups = this.execDirectory(directoryPath);
      if (!groups) {
        errors.push(directoryPath);
      }
    });

    if (errors.length) {
      const modalRef = this.modalService.open(ErrorDialogComponent, {
        centered: true,
        scrollable: true,
      });
      modalRef.componentInstance.message = this.translateService.instant(
        'PAGES.HOME.VALIDATIONS.DIRECTORY_NOT_MATCH',
      );
      return;
    }

    // validate order of directory
    let previousSortType: SORT_TYPE | null = null;
    const times = this.reportOptions.selectedDirectories.map(directoryPath =>
      this.parseDateFromDirectory(directoryPath),
    );
    let invalidOrder = false;
    for (let i = 0; i < times.length - 1; i++) {
      let currentSortType: SORT_TYPE | null = null;
      if (times[i] < times[i + 1]) {
        currentSortType = SORT_TYPE.ASC;
      } else if (times[i] > times[i + 1]) {
        currentSortType = SORT_TYPE.DESC;
      }
      if (previousSortType === null || previousSortType === currentSortType) {
        previousSortType = currentSortType;
        continue;
      }
      invalidOrder = true;
      break;
    }

    if (invalidOrder) {
      const modalRef = this.modalService.open(ConfirmDialogComponent, {
        centered: true,
        scrollable: true,
      });
      modalRef.componentInstance.message = this.translateService.instant(
        'PAGES.HOME.VALIDATIONS.INVALIDA_DIRECTORY_ORDER',
      );
      modalRef.result
        .then(
          () => {
            this.createDocx();
          },
          () => {
            // do nothing
          },
        )
        .catch(() => {
          // do nothing
        });
      return;
    }

    this.createDocx();
  }

  createDocx() {
    this.storeService.setEntries([
      {
        key: 'project',
        val: this.reportOptions.project,
      },
      {
        key: 'company',
        val: this.reportOptions.company,
      },
      {
        key: 'vehicle',
        val: this.reportOptions.vehicle,
      },
      {
        key: 'isImageCheckingOn',
        val: this.reportOptions.isImageCheckingOn,
      },
    ]);
    this.createDocxLoading = true;
    this.httpClient
      .post('http://localhost:9876/docx', {
        ...this.reportOptions,
        selectedDirectories: Array.from(this.reportOptions.selectedDirectories),
      })
      .subscribe(
        (data: any) => {
          this.createDocxLoading = false;
          this.electronService.ipcRenderer.send(
            'saveFile',
            data.filePath,
            `${(this.storeService.get('lastSavedDirectory') &&
              this.storeService.get('lastSavedDirectory') + '/') ||
              ''}${this.reportOptions.vehicle}.docx`,
          );
        },
        error => {
          this.createDocxLoading = false;
          const modalRef = this.modalService.open(ErrorDialogComponent, {
            centered: true,
            scrollable: true,
          });
          modalRef.componentInstance.message = error.error.message;
        },
      );
  }
}
