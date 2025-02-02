import { DocumentRegistry, ABCWidgetFactory } from '@jupyterlab/docregistry';

import {
  INotebookModel,
  NotebookPanel,
  StaticNotebook,
} from '@jupyterlab/notebook';

import { IEditorMimeTypeService } from '@jupyterlab/codeeditor';

import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

import { VoilaGridStackWidget } from './widget';

import { VoilaGridStackPanel } from './panel';

/**
 * A widget factory for `VoilaGridstack` Widget.
 */
export class VoilaGridStackWidgetFactory extends ABCWidgetFactory<
  VoilaGridStackWidget,
  INotebookModel
> {
  /**
   * Construct a new `VoilaGridStackWidgetFactory`.
   *
   * @param options - The options used to construct the factory.
   */
  constructor(
    options: VoilaGridStackWidgetFactory.IOptions<VoilaGridStackWidget>
  ) {
    super(options);
    this.rendermime = options.rendermime;
    this.contentFactory =
      options.contentFactory || NotebookPanel.defaultContentFactory;
    this.mimeTypeService = options.mimeTypeService;
    this._editorConfig =
      options.editorConfig || StaticNotebook.defaultEditorConfig;
    this._notebookConfig =
      options.notebookConfig || StaticNotebook.defaultNotebookConfig;
  }

  /*
   * The rendermime instance.
   */
  readonly rendermime: IRenderMimeRegistry;

  /**
   * The content factory used by the widget factory.
   */
  readonly contentFactory: NotebookPanel.IContentFactory;

  /**
   * The service used to look up mime types.
   */
  readonly mimeTypeService: IEditorMimeTypeService;

  /**
   * A configuration object for cell editor settings.
   */
  get editorConfig(): StaticNotebook.IEditorConfig {
    return this._editorConfig;
  }
  set editorConfig(value: StaticNotebook.IEditorConfig) {
    this._editorConfig = value;
  }

  /**
   * A configuration object for notebook settings.
   */
  get notebookConfig(): StaticNotebook.INotebookConfig {
    return this._notebookConfig;
  }
  set notebookConfig(value: StaticNotebook.INotebookConfig) {
    this._notebookConfig = value;
  }

  /**
   * Creates a new `VoilaGridstackWidget`.
   *
   * @param context - The Notebook context.
   * @param source - An optional `VoilaGridstackWidget`.
   *
   * #### Notes
   * The factory will start the appropriate kernel.
   */
  protected createNewWidget(
    context: DocumentRegistry.IContext<INotebookModel>,
    source?: VoilaGridStackWidget
  ): VoilaGridStackWidget {
    const options = {
      context: context,
      rendermime: source
        ? source.content.rendermime
        : this.rendermime.clone({ resolver: context.urlResolver }),
      contentFactory: this.contentFactory,
      mimeTypeService: this.mimeTypeService,
      editorConfig: source ? source.content.editorConfig : this._editorConfig,
      notebookConfig: source
        ? source.content.notebookConfig
        : this._notebookConfig,
    };

    return new VoilaGridStackWidget(context, new VoilaGridStackPanel(options));
  }

  private _editorConfig: StaticNotebook.IEditorConfig;
  private _notebookConfig: StaticNotebook.INotebookConfig;
}

export namespace VoilaGridStackWidgetFactory {
  /**
   * The options used to construct a `VoilaGridstackWidgetFactory`.
   */
  export interface IOptions<T extends VoilaGridStackWidget>
    extends DocumentRegistry.IWidgetFactoryOptions<T> {
    /*
     * A rendermime instance.
     */
    rendermime: IRenderMimeRegistry;

    /**
     * A notebook panel content factory.
     */
    contentFactory: NotebookPanel.IContentFactory;

    /**
     * The service used to look up mime types.
     */
    mimeTypeService: IEditorMimeTypeService;

    /**
     * The notebook cell editor configuration.
     */
    editorConfig?: StaticNotebook.IEditorConfig;

    /**
     * The notebook configuration.
     */
    notebookConfig?: StaticNotebook.INotebookConfig;
  }
}
