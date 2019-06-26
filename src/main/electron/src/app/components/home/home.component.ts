import { Component, OnInit, NgZone } from '@angular/core';
import { ReportOptions } from '../../shared/models/report-options.model';
import { ElectronService } from '../../providers/electron.service';
import { HttpClient } from '@angular/common/http';
import { StoreService } from '../../providers/store.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  reportOptions: ReportOptions;
  selectDirectoriesLoading: boolean;
  createDocxLoading: boolean;

  constructor(
    private electronService: ElectronService,
    private storeService: StoreService,
    private zone: NgZone,
    private httpClient: HttpClient,
  ) {}

  ngOnInit() {
    this.reportOptions = new ReportOptions();
    this.reportOptions.project = this.storeService.get('project');
    this.reportOptions.company = this.storeService.get('company');
    this.reportOptions.vehicle = this.storeService.get('vehicle');
    this.electronService.ipcRenderer.on(
      'selectedDirectories',
      (event: Electron.IpcMessageEvent, ...args: any[]) => {
        this.zone.run(() => {
          this.reportOptions.selectedDirectories = new Set(
            Array.from(this.reportOptions.selectedDirectories).concat(args[0]),
          );
          this.reportOptions.templateFilePath = args[1];
          if (args[2]) {
            this.storeService.set('lastWorkingDirectory', args[2]);
          }
          this.selectDirectoriesLoading = false;
        });
      },
    );
    this.electronService.ipcRenderer.on(
      'savedFile',
      (event: Electron.IpcMessageEvent, ...args: any[]) => {
        this.storeService.set('lastSavedDirectory', args[0]);
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
    this.reportOptions.selectedDirectories.clear();
  }

  deleteDirectory(directory: string) {
    this.reportOptions.selectedDirectories.delete(directory);
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
          this.electronService.ipcRenderer.send('showMessageBox', {
            type: error.error.code === 400 ? 'warning' : 'error',
            title: '',
            message: error.error.message,
          });
        },
      );
  }
}
