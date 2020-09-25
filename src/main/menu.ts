import openAboutWindowdow from 'about-window';
import { remote } from 'electron';
import { join } from 'path';

const isMac = process.platform === 'darwin';

export const makeMenu = (electronRoot: string, asarPath: string, changeHistory: (index: number) => void) => {
  console.log(asarPath);

  return remote.Menu.buildFromTemplate([
    // { role: 'appMenu' }
    ...(isMac
      ? [
          {
            label: remote.app.name,
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
      submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        {
          accelerator: 'CommandOrControl+z',
          label: 'Undo',
          click: () => changeHistory(1),
        },
        {
          accelerator: 'CommandOrControl+Shift+z',
          label: 'Redo',
          click: () => changeHistory(-1),
        },
        // { role: 'undo' },
        // { role: 'redo' },
        //   { type: 'separator' },
        //   { role: 'cut' },
        //   { role: 'copy' },
        //   { role: 'paste' },
        //   ...(isMac
        //     ? [
        //         { role: 'pasteAndMatchStyle' },
        //         { role: 'delete' },
        //         { role: 'selectAll' },
        //         { type: 'separator' },
        //         {
        //           label: 'Speech',
        //           submenu: [{ role: 'startspeaking' }, { role: 'stopspeaking' }],
        //         },
        //       ]
        //     : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
      ],
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
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
        ...(isMac ? [{ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' }] : [{ role: 'close' }]),
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'About',
          click: async () => {
            openAboutWindowdow({
              icon_path: join(electronRoot, 'build/icon.png'),
              package_json_dir: asarPath,
              product_name: 'KGE: KotOR GUI Editor',
            });
          },
        },
      ],
    },
  ] as any[]);
};
