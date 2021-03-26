import { Layout, Widget } from '@lumino/widgets';

import { IIterator, ArrayIterator } from '@lumino/algorithm';

import { Signal, ISignal } from '@lumino/signaling';

import { Message, MessageLoop } from '@lumino/messaging';

import { GridStack, GridStackNode, GridItemHTMLElement } from 'gridstack';

import 'gridstack/dist/h5/gridstack-dd-native';

import { GridStackItem } from './item';

import { DashboardView, DashboardCellView } from '../format';

/**
 * A gridstack layout to host the visible Notebook's Cells.
 */
export class GridStackLayout extends Layout {
  /**
   * Construct a `GridStackLayout`.
   *
   * @param info - The `DashboardView` metadata.
   */
  constructor(info: DashboardView) {
    super();
    this._margin = info.cellMargin;
    this._cellHeight = info.defaultCellHeight;
    this._columns = info.maxColumns;

    this._helperMessage = document.createElement('div');
    this._helperMessage.appendChild(document.createElement('p')).textContent =
      'Drag and drop cells here to start building the dashboard.';
    this._helperMessage.className = 'jp-grid-helper';

    this._gridHost = document.createElement('div');
    this._gridHost.className = 'grid-stack';

    this._grid = GridStack.init(
      {
        float: true,
        column: this._columns,
        margin: this._margin,
        cellHeight: this._cellHeight,
        styleInHead: true,
        disableOneColumnMode: true,
        draggable: { handle: '.grid-item-toolbar' },
        resizable: { autoHide: true, handles: 'e, se, s, sw, w' },
        alwaysShowResizeHandle: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      },
      this._gridHost
    );

    this._updateBackgroundSize();

    this._grid.on(
      'change',
      (
        event: Event,
        items?: GridItemHTMLElement | GridStackNode | GridStackNode[]
      ) => {
        this._onChange(event, items as GridStackNode[]);
      }
    );

    this._grid.on(
      'removed',
      (
        event: Event,
        items?: GridItemHTMLElement | GridStackNode | GridStackNode[]
      ) => {
        if ((items as GridStackNode[]).length <= 1) {
          this._onRemoved(event, items as GridStackNode[]);
        }
      }
    );

    this._grid.on('resizestop', (event, elem) => {
      window.dispatchEvent(new Event('resize'));
    });
  }

  get gridItemChanged(): ISignal<this, GridStackNode[]> {
    return this._gridItemChanged;
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._grid.destroy();
    super.dispose();
  }

  /**
   * Init the gridstack layout
   */
  init(): void {
    super.init();
    this.parent!.node.appendChild(this._gridHost);
    if (this._gridItems.length === 0) {
      this._gridHost.insertAdjacentElement('beforebegin', this._helperMessage);
    }
    // fake window resize event to resize bqplot
    window.dispatchEvent(new Event('resize'));
  }

  /**
   * Handle `update-request` messages sent to the widget.
   */
  protected onUpdateRequest(msg: Message): void {
    const items = this._grid?.getGridItems();
    items?.forEach(item => {
      this._grid.removeWidget(item, true, false);
      this._grid.addWidget(item);
    });
  }

  /**
   * Handle `resize-request` messages sent to the widget.
   */
  protected onResize(msg: Message): void {
    this._grid.onParentResize();
  }

  /**
   * Handle `fit-request` messages sent to the widget.
   */
  protected onFitRequest(msg: Message): void {
    this._grid.onParentResize();
  }

  /**
   * Create an iterator over the widgets in the layout.
   */
  iter(): IIterator<Widget> {
    return new ArrayIterator(this._gridItems);
  }

  /**
   * Remove a widget from the layout.
   *
   * @param widget - The `widget` to remove.
   */
  removeWidget(widget: Widget): void {
    return;
  }

  /**
   * Get gridstack's items margin.
   */
  get margin(): number {
    return this._margin;
  }

  /**
   * Change gridstack's items margin.
   *
   * @param margin - The new margin.
   */
  set margin(margin: number) {
    if (this._margin !== margin) {
      this._margin = margin;
      this._grid.margin(this._margin);
      this.parent!.update();
    }
  }

  /**
   * Get gridstack's cell height.
   *
   * @param forcePixel - An optional boolean.
   */
  get cellHeight(): number {
    return this._grid.getCellHeight(true) ?? this._cellHeight;
  }

  /**
   * Change the gridstack's cell height.
   *
   * @param height - The new height.
   */
  set cellHeight(height: number) {
    if (this._cellHeight !== height) {
      this._cellHeight = height;
      this._grid.cellHeight(this._cellHeight);
      this._updateBackgroundSize();
      this.parent!.update();
    }
  }

  /**
   * Get gridstack's number of columns.
   */
  get columns(): number {
    return this._columns;
  }

  /**
   * Change the gridstack's number of columns.
   *
   * @param columns - The new number of columns.
   */
  set columns(columns: number) {
    if (this._columns !== columns) {
      this._columns = columns;
      this._grid.column(columns);
      this._updateBackgroundSize();
      this.parent!.update();
    }
  }

  /**
   * Helper to get access to underlying GridStack object
   */
  get grid(): GridStack {
    return this._grid;
  }

  /**
   * Get the list of `GridStackItem` (Lumino widgets).
   */
  get gridWidgets(): Array<GridStackItem> {
    return this._gridItems;
  }

  /**
   * Get the list of `GridItemHTMLElement`.
   */
  get gridItems(): GridItemHTMLElement[] {
    return this._grid.getGridItems() ?? [];
  }

  /**
   * Add new cell to gridstack.
   *
   * @param id - The Cell id.
   * @param item - The cell widget.
   * @param info - The dashboard cell metadata parameters.
   */
  addGridItem(id: string, item: GridStackItem, info: DashboardCellView): void {
    const options = {
      id,
      x: info.col,
      y: info.row,
      width: info.width,
      height: info.height,
      locked: info.locked ? info.locked : false,
      autoPosition: false
    };

    if (info.row === null || info.col === null) {
      options['autoPosition'] = true;
    }

    this._gridItems.push(item);

    if (this._gridItems.length === 1) {
      this.parent!.node.removeChild(this._helperMessage);
    }

    MessageLoop.sendMessage(item, Widget.Msg.BeforeAttach);
    this._grid.addWidget(item.node, options);
    MessageLoop.sendMessage(item, Widget.Msg.AfterAttach);
    this.updateGridItem(id, info);
  }

  /**
   * Update a cell from gridstack.
   *
   * @param id - The Cell id.
   * @param info - The dashboard cell metadata parameters.
   */
  updateGridItem(id: string, info: DashboardCellView): void {
    const items = this._grid.getGridItems();
    const item = items?.find(value => value.gridstackNode?.id === id);
    this._grid.update(item!, {
      x: info.col,
      y: info.row,
      w: info.width,
      h: info.height,
      locked: info.locked ? info.locked : false
    });
  }

  /**
   * Remove a cell from gridstack.
   *
   * @param id - The Cell id.
   */
  removeGridItem(id: string): void {
    const items = this._grid.getGridItems();
    const item = items?.find(value => value.gridstackNode?.id === id);

    if (item) {
      this._gridItems = this._gridItems.filter(obj => obj.cellId !== id);
      this._grid.removeWidget(item, true, false);
    }

    if (this._gridItems.length === 0) {
      this._gridHost.insertAdjacentElement('beforebegin', this._helperMessage);
    }
  }

  /**
   * Handle change-event messages sent to from gridstack.
   */
  private _onChange(event: Event, items: GridStackNode[]): void {
    this._gridItemChanged.emit(items ?? []);
  }

  /**
   * Handle remove event messages sent from gridstack.
   */
  private _onRemoved(event: Event, items: GridStackNode[]): void {
    items.forEach(el => {
      //this._model.hideCell(el.id as string);
    });
  }

  /**
   * Update background size style to fit new grid parameters
   */
  private _updateBackgroundSize(): void {
    this._gridHost.style.backgroundSize = `100px ${this.cellHeight}px, calc(100% / ${this.columns} + 0px) 100px, 20px 20px, 20px 20px`;
  }

  private _margin: number;
  private _cellHeight: number;
  private _columns: number;
  private _gridHost: HTMLElement;
  private _grid: GridStack;
  private _gridItems: GridStackItem[] = [];
  private _gridItemChanged = new Signal<this, GridStackNode[]>(this);
  private _helperMessage: HTMLElement;
}
