import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import { AppConfig } from '../../environments/environment.dev';

@Injectable()
export class StoreService {
  private path: string;
  private data: any;

  constructor(private electronService: ElectronService) {
    const userDataPath = electronService.remote.app.getPath('userData');
    this.path = `${userDataPath}/${AppConfig.userDataFile}`;
    this.data = this.parseDataFile(this.path, {});
  }

  get(key: any) {
    return this.data[key];
  }

  set(key: string, val: string) {
    this.data[key] = val;
    this.electronService.fs.writeFileSync(this.path, JSON.stringify(this.data));
  }

  setEntries(entries: { key: string; val: string }[]) {
    entries.forEach(entry => {
      this.data[entry.key] = entry.val;
    });
    this.electronService.fs.writeFileSync(this.path, JSON.stringify(this.data));
  }

  private parseDataFile(filePath: string, defaults: any) {
    try {
      return JSON.parse(
        this.electronService.fs.readFileSync(filePath, { encoding: 'UTF-8' }),
      );
    } catch (error) {
      return defaults;
    }
  }
}
