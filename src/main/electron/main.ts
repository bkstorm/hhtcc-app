require('hazardous');
import {
  app,
  BrowserWindow,
  screen,
  ipcMain,
  dialog,
  Menu,
  IpcMainEvent,
  OpenDialogOptions,
  SaveDialogOptions,
} from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';

let win, serve;
const commandArgs = process.argv.slice(1);
serve = commandArgs.some(val => val === '--serve');
let serverProcess;

function createMenu() {
  const template = [
    // { role: 'appMenu' }
    ...(process.platform === 'darwin'
      ? [
          {
            label: app.getName(),
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideothers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' },
      ],
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(process.platform === 'darwin'
          ? [
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' },
              { type: 'separator' },
              {
                label: 'Speech',
                submenu: [{ role: 'startspeaking' }, { role: 'stopspeaking' }],
              },
            ]
          : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
      ],
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(process.platform === 'darwin'
          ? [
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' },
            ]
          : [{ role: 'close' }]),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);
}

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
          createMenu();
          createWindow();
        },
        error => {
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

  app.on('will-quit', event => {
    if (serverProcess) {
      event.preventDefault();
      // kill Java executable
      const kill = require('tree-kill');
      kill(serverProcess.pid, 'SIGTERM', function() {
        console.log('Server process killed');
        serverProcess = null;
        app.exit(0);
      });
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
    (event: IpcMainEvent, lastSavedDirectory: string) => {
      const dialogOptions: OpenDialogOptions = {
        properties: ['openDirectory', 'multiSelections'],
      };
      if (lastSavedDirectory) {
        Object.assign(dialogOptions, { defaultPath: lastSavedDirectory });
      }
      dialog.showOpenDialog(dialogOptions).then(({ filePaths }) => {
        console.log(
          path
            .join(__dirname, 'template/template.docx')
            .replace('app.asar', 'app.asar.unpacked'),
        );
        if (filePaths && filePaths.length) {
          event.sender.send(
            'selectedDirectories',
            filePaths,
            path.join(__dirname, 'template/template.docx'),
            path.dirname(filePaths[0]),
          );
        }
      });
    },
  );

  ipcMain.on(
    'saveFile',
    (event: IpcMainEvent, sourcePath: string, lastSavedDirectory: string) => {
      const dialogOptions: SaveDialogOptions = {
        filters: [
          {
            name: 'docx',
            extensions: ['docx'],
          },
        ],
      };
      if (lastSavedDirectory) {
        Object.assign(dialogOptions, {
          defaultPath: lastSavedDirectory,
        });
      }
      dialog.showSaveDialog(dialogOptions).then(({ filePath }) => {
        if (filePath) {
          fs.copyFile(sourcePath, filePath, error => {
            if (error) {
              event.sender.send('error', error.message || error);
              return;
            }
            event.sender.send('savedFile', path.dirname(filePath));
          });
        }
      });
    },
  );
} catch (e) {
  // Catch Error
  // throw e;
}
