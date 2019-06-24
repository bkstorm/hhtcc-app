import { Component, OnInit, NgZone } from '@angular/core';
import { ReportOptions } from '../../shared/models/report-options.model';
import { ElectronService } from '../../providers/electron.service';
import { HttpClient } from '@angular/common/http';
import { StoreService } from '../../providers/store.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  reportOptions: ReportOptions;
  selectDirectoriesLoading: boolean;
  createDocxLoading: boolean;

  constructor(
    private electronService: ElectronService,
    private storeService: StoreService,
    private zone: NgZone,
    private httpClient: HttpClient
  ) {}

  ngOnInit() {
    this.reportOptions = new ReportOptions();
    this.reportOptions.project = this.storeService.get('project');
    this.reportOptions.company = this.storeService.get('company');
    this.electronService.ipcRenderer.on(
      'selectedDirectories',
      (event: Electron.IpcMessageEvent, ...args: any[]) => {
        this.zone.run(() => {
          this.reportOptions.selectedDirectories = args[0];
          this.reportOptions.templateFilePath = args[1];
          this.selectDirectoriesLoading = false;
        });
      }
    );
  }

  selectDirectories() {
    this.selectDirectoriesLoading = true;
    this.electronService.ipcRenderer.send('selectDirectories');
  }

  createDocx() {
    this.storeService.set('project', this.reportOptions.project);
    this.storeService.set('company', this.reportOptions.company);
    this.createDocxLoading = true;
    this.httpClient
      .post('http://localhost:8080/docx', this.reportOptions)
      .subscribe(
        (data: any) => {
          this.createDocxLoading = false;
          this.electronService.ipcRenderer.send('saveFile', data.filePath);
        },
        error => {
          this.createDocxLoading = false;
          this.electronService.ipcRenderer.send('showMessageBox', {
            type: error.error.code === 400 ? 'warning' : 'error',
            title: '',
            message: error.error.message
          });
        }
      );
  }
}
