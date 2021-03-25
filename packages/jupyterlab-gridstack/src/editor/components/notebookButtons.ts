import { ToolbarButton } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { PageConfig } from '@jupyterlab/coreutils';

import { CommandRegistry } from '@lumino/commands';

import { IDisposable } from '@lumino/disposable';

import { Widget } from '@lumino/widgets';

import { dashboardIcon } from '../../icons';

const VOILA_ICON_CLASS = 'jp-MaterialIcon jp-VoilaIcon';

/**
 * A WidgetExtension for Notebook's toolbar to open a `VoilaGridstack` widget.
 */
export class EditorButton
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  /**
   * Instantiate a new NotebookButton.
   * @param commands The command registry.
   */
  constructor(commands: CommandRegistry) {
    this._commands = commands;
  }

  /**
   * Create a new extension object.
   */
  createNew(panel: NotebookPanel): IDisposable {
    const button = new ToolbarButton({
      tooltip: 'Open with Voilà GridStack',
      icon: dashboardIcon,
      onClick: () => {
        this._commands
          .execute('docmanager:open', {
            path: panel.context.path,
            factory: 'Voila GridStack',
            options: {
              mode: 'split-right',
              ref: panel.id
            }
          })
          .then(widget => {
            if (widget instanceof Widget) {
              // Remove the editor if the associated notebook is closed.
              panel.content.disposed.connect(() => {
                widget.dispose();
              });
            }
          });
      }
    });
    panel.toolbar.insertAfter('voila', 'jupyterlab-gridstack', button);
    return button;
  }

  private _commands: CommandRegistry;
}

/**
 * A WidgetExtension for Notebook's toolbar to launch Voila.
 */
export class VoilaButton
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  /**
   * Create a new extension object.
   */
  createNew(panel: NotebookPanel): IDisposable {
    const button = new ToolbarButton({
      className: 'voila',
      tooltip: 'Open with Voilà in a New Browser Tab',
      iconClass: VOILA_ICON_CLASS,
      onClick: () => {
        const baseUrl = PageConfig.getBaseUrl();
        const win = window.open(
          `${baseUrl}voila/render/${panel.context.path}`,
          '_blank'
        );
        win?.focus();
      }
    });
    panel.toolbar.insertAfter('cellType', 'voila', button);
    return button;
  }
}
