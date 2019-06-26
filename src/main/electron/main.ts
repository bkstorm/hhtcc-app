require('hazardous');
import {
  app,
  BrowserWindow,
  screen,
  ipcMain,
  IpcMessageEvent,
  dialog,
  remote,
  ipcRenderer,
} from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';

let win, serve;
const commandArgs = process.argv.slice(1);
serve = commandArgs.some(val => val === '--serve');
let serverProcess;

function createWindow() {
  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`),
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, 'dist/index.html'),
        protocol: 'file:',
        slashes: true,
      }),
    );
  }

  if (serve) {
    win.webContents.openDevTools();
  }

  win.on('close', e => {
    if (serverProcess) {
      e.preventDefault();
      // kill Java executable
      const kill = require('tree-kill');
      kill(serverProcess.pid, 'SIGTERM', function() {
        console.log('Server process killed');

        serverProcess = null;

        win.close();
      });
    }
  });

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

(function startServer() {
  const platform = process.platform;
  // Check operating system
  if (platform === 'win32') {
    serverProcess = require('child_process').spawn(
      'cmd.exe',
      ['/c', 'hhtcc.bat'],
      {
        cwd: path.join(__dirname, 'hhtcc') + '/bin',
      },
    );
  } else {
    serverProcess = require('child_process').spawn(
      path.join(__dirname, 'hhtcc') + '/bin/hhtcc',
    );
  }
})();

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', () => {
    const startUp = function() {
      const requestPromise = require('minimal-request-promise');
      requestPromise.get('http://localhost:9876').then(
        () => {
          console.log('Server started!');
          createWindow();
        },
        error => {
          console.log(error);
          console.log('Waiting for the server start ...');
          setTimeout(() => {
            startUp();
          }, 200);
        },
      );
    };

    startUp();
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

  ipcMain.on(
    'selectDirectories',
    (event: IpcMessageEvent, lastSavedDirectory: string) => {
      dialog.showOpenDialog(
        {
          defaultPath: lastSavedDirectory,
          properties: ['openDirectory', 'multiSelections'],
        },
        filePaths => {
          if (filePaths && filePaths.length) {
            event.sender.send(
              'selectedDirectories',
              filePaths,
              path
                .join(__dirname, 'template/template.docx')
                .replace('app.asar', 'app.asar.unpacked'),
              path.dirname(filePaths[0]),
            );
          }
        },
      );
    },
  );

  ipcMain.on(
    'saveFile',
    (
      event: IpcMessageEvent,
      sourcePath: string,
      lastSavedDirectory: string,
    ) => {
      dialog.showSaveDialog(
        {
          defaultPath: lastSavedDirectory,
          filters: [
            {
              name: 'docx',
              extensions: ['docx'],
            },
          ],
        },
        destPath => {
          if (destPath) {
            fs.copyFile(sourcePath, destPath, error => {
              if (error) {
                dialog.showMessageBox({
                  type: 'error',
                  message: error.message,
                });
              }
              event.sender.send('savedFile', path.dirname(destPath));
            });
          }
        },
      );
    },
  );

  ipcMain.on('showMessageBox', (event: IpcMessageEvent, args: any) => {
    dialog.showMessageBox({
      type: args.type,
      message: args.message,
      detail: args.detail,
    });
  });
} catch (e) {
  // Catch Error
  // throw e;
}
