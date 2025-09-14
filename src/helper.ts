import Phaser from "phaser";

import {
  IMAGE_DATA,
  IMAGE_NINE_SLICE,
  IMAGE_NINE_SLICE_DATA,
  IMAGE_RECT,
  IMAGE_SLICE,
} from "./types";

const EXTRUDED_SUFFIX = "extruded";
const NORMAL_SUFFIX = "normal";

export class ImageHelper {
  private static isLoadComplete: boolean = false;
  private static isInitialized: boolean = false;

  private static scene: Phaser.Scene;
  private static imagesData: IMAGE_DATA[] = [];
  private static imagesToLoad: IMAGE_DATA[] = [];
  private static imageCache: Record<string, string> = {};
  private static textureCache: Record<string, HTMLImageElement> = {};

  private static nineSliceDataCache: Record<string, IMAGE_NINE_SLICE_DATA> = {};

  // PUBLIC METHODS
  // ------------------------------------------------------------

  public static updateScene(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public static async load(scene: Phaser.Scene, images: IMAGE_DATA[]) {
    this.scene = scene;
    this.isInitialized = false;
    this.isLoadComplete = false;

    this.imagesToLoad = images;

    // Start loading images to phaser scene
    await this.loadImages();

    // Create required url to use in html
    await this.prepareDataUrls();

    this.isInitialized = true;

    return Promise.resolve();
  }

  // Check if all initialization is complete
  public static async isReady(): Promise<void> {
    if (!this.isInitialized) {
      // Prevent memory leak
      await setTimeout(() => {}, 0);
      return this.isReady();
    }

    // Make sure Phaser completes any pending asynchronous processes
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 0);
    });
  }

  // Get image data url
  public static url(
    key: string,
    type: typeof EXTRUDED_SUFFIX | typeof NORMAL_SUFFIX | "" = ""
  ): string {
    const data = this.imageCache[`${key}${type ? `_${type}` : ""}`];

    if (!data) {
      console.error(`Image data not found for key: ${key}`);

      return "";
    }

    return data;
  }

  // Remove image from cache
  public static remove(key: string) {
    this.scene.textures.remove(key);

    delete this.imageCache[key];
    delete this.imageCache[`${key}_${EXTRUDED_SUFFIX}`];
    delete this.imageCache[`${key}_${NORMAL_SUFFIX}`];

    delete this.nineSliceDataCache[key];
  }

  // Clear all images from cache
  public static clear() {
    this.imagesData.forEach((image) => {
      if (image.parse) {
        image.parse.forEach((parse) => {
          this.remove(parse.key);
        });
      }
      this.remove(image.key);
    });

    this.imagesData = [];
    this.imagesToLoad = [];
    this.imageCache = {};
    this.textureCache = {};
    this.nineSliceDataCache = {};
  }

  // Get nine slice
  public static nineSlice(
    key: string,
    options?: { x: number; y: number; width: number; height: number }
  ) {
    const data = this.nineSliceDataCache[key];

    if (!data) {
      console.error(`Nine slice data not found for key: ${key}`);

      return;
    }

    const x = options?.x || 0;
    const y = options?.y || 0;
    const width = options?.width || 100;
    const height = options?.height || 100;

    return this.scene.add.nineslice(
      x,
      y,
      key,
      undefined,
      width,
      height,
      data.leftWidth,
      data.rightWidth,
      data.topHeight,
      data.bottomHeight
    );
  }

  // Get nine slice data to use in DOM
  public static nineSliceData(key: string): IMAGE_NINE_SLICE_DATA {
    const data = this.nineSliceDataCache[key];

    if (!data) {
      console.error(`Nine slice data not found for key: ${key}`);

      return {
        src: [],
        topHeight: 0,
        centerHeight: 0,
        bottomHeight: 0,
        leftWidth: 0,
        centerWidth: 0,
        rightWidth: 0,
      };
    }

    return data;
  }

  // PRIVATE METHODS
  // ------------------------------------------------------------

  // Load all images async
  private static async loadImages() {
    // Prepare promis array to load images in parallel
    const loadArray: Promise<void>[] = [];

    // Load images in parallel
    this.imagesToLoad.forEach((image) => {
      loadArray.push(this.loadImage(image.key, image.url));

      if (image.extruded) {
        loadArray.push(
          this.loadImage(`${image.key}_${EXTRUDED_SUFFIX}`, image.extruded)
        );
      }

      if (image.normal) {
        loadArray.push(
          this.loadImage(`${image.key}_${NORMAL_SUFFIX}`, image.normal)
        );
      }
    });

    // Wait for all images to be loaded
    await Promise.all(loadArray);

    this.imagesData = [...this.imagesData, ...this.imagesToLoad];

    // Set load complete flag
    this.isLoadComplete = true;
  }

  // Internal utility to check if all images are loaded
  private static async checkLoadComplete(): Promise<void> {
    if (!this.isLoadComplete) {
      return this.checkLoadComplete();
    }

    return Promise.resolve();
  }

  // Async image loader
  private static async loadImage(key: string, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const loaded = this.scene.load.image(key, url);

      loaded.on("complete", () => {
        const textureSource = this.scene.textures.get(key).source[0].image;

        if (textureSource instanceof HTMLImageElement) {
          this.textureCache[key] = textureSource;
        }
        resolve();
      });
    });
  }

  // Generate data url for each image
  private static async prepareDataUrls(): Promise<void> {
    await this.checkLoadComplete();

    this.imagesData.forEach((image) => {
      const textureSource = this.textureCache[image.key];

      if (!(textureSource instanceof HTMLImageElement)) {
        return;
      }

      // Create base image data url
      this.imageCache[image.key] = this.createDataUrlFromArea(
        textureSource,
        textureSource.width,
        textureSource.height
      );

      // If image has parse data, create data urls for each parse data
      if (image.parse) {
        image.parse.forEach((parse) => {
          // Get grid size
          const gridSize = parse.slice?.grid || image.grid || [16, 16];

          let rect;
          if (parse.slice) {
            rect = this.convertSliceToRect(
              textureSource,
              parse.slice,
              gridSize
            );
          } else if (parse.rect) {
            rect = parse.rect;
          }

          const width = rect?.width || textureSource.width;
          const height = rect?.height || textureSource.height;
          const dataUrl = this.createDataUrlFromArea(
            textureSource,
            width,
            height,
            rect?.x,
            rect?.y
          );

          this.scene.textures.addBase64(parse.key, dataUrl);
          this.imageCache[parse.key] = dataUrl;

          if (!!parse.nineSlice) {
            const nineSliceData =
              typeof parse.nineSlice === "boolean"
                ? image.nineSlice
                : { ...image.nineSlice, ...parse.nineSlice };

            if (nineSliceData) {
              this.createNineSliceData(
                parse.key,
                textureSource,
                nineSliceData,
                rect?.x,
                rect?.y
              );
            }
          }
        });
      }

      if (image.nineSlice) {
        this.createNineSliceData(image.key, textureSource, image.nineSlice);
      }
    });

    return Promise.resolve();
  }

  // Create nine slice data
  private static createNineSliceData(
    key: string,
    textureSource: HTMLImageElement,
    data: IMAGE_NINE_SLICE,
    offsetX: number = 0,
    offsetY: number = 0
  ) {
    const src = [
      this.createDataUrlFromArea(
        textureSource,
        data.leftWidth,
        data.topHeight,
        offsetX,
        offsetY
      ),
      this.createDataUrlFromArea(
        textureSource,
        data.centerWidth,
        data.topHeight,
        offsetX + data.leftWidth,
        offsetY
      ),
      this.createDataUrlFromArea(
        textureSource,
        data.rightWidth,
        data.topHeight,
        offsetX + data.leftWidth + data.centerWidth,
        offsetY
      ),
      this.createDataUrlFromArea(
        textureSource,
        data.leftWidth,
        data.centerHeight,
        offsetX,
        offsetY + data.topHeight
      ),
      this.createDataUrlFromArea(
        textureSource,
        data.centerWidth,
        data.centerHeight,
        offsetX + data.leftWidth,
        offsetY + data.topHeight
      ),
      this.createDataUrlFromArea(
        textureSource,
        data.rightWidth,
        data.centerHeight,
        offsetX + data.leftWidth + data.centerWidth,
        offsetY + data.topHeight
      ),
      this.createDataUrlFromArea(
        textureSource,
        data.leftWidth,
        data.bottomHeight,
        offsetX,
        offsetY + data.topHeight + data.centerHeight
      ),
      this.createDataUrlFromArea(
        textureSource,
        data.centerWidth,
        data.bottomHeight,
        offsetX + data.leftWidth,
        offsetY + data.topHeight + data.centerHeight
      ),
      this.createDataUrlFromArea(
        textureSource,
        data.rightWidth,
        data.bottomHeight,
        offsetX + data.leftWidth + data.centerWidth,
        offsetY + data.topHeight + data.centerHeight
      ),
    ];

    this.nineSliceDataCache[key] = {
      ...data,
      src,
    };
  }

  // Convert IMAGE_SLICE to IMAGE_RECT
  private static convertSliceToRect(
    textureSource: HTMLImageElement,
    slice: IMAGE_SLICE,
    gridSize: [number, number]
  ): IMAGE_RECT {
    // If slice.pos is a number, use it as both x and y
    // If slice.pos is an array, use the first value as x and the second value as y
    // If slice.pos is an array with one value, use it as both x and y
    const cellNumber =
      typeof slice.pos === "number"
        ? [slice.pos, slice.pos]
        : [
            slice.pos[0],
            slice.pos[1] === undefined ? slice.pos[0] : slice.pos[1],
          ];

    // Calculate total number of columns and rows
    const totalCols = textureSource.width / gridSize[0];

    // Calculate start and end slice row and column
    const startSliceRow = Math.floor(cellNumber[0] / totalCols);
    const startSliceCol = cellNumber[0] % totalCols;

    // Calculate end slice row and column
    const endSliceRow = Math.floor(cellNumber[1] / totalCols);
    const endSliceCol = cellNumber[1] % totalCols;

    // Calculate start and end x and y
    const startX = startSliceCol * gridSize[0];
    const startY = startSliceRow * gridSize[1];

    // Calculate end x and y
    const endX = (endSliceCol + 1) * gridSize[0];
    const endY = (endSliceRow + 1) * gridSize[1];

    // Calculate width and height
    const width = endX - startX;
    const height = endY - startY;

    return { x: startX, y: startY, width, height };
  }

  // Generic data url method for any image area
  private static createDataUrlFromArea(
    textureSource: HTMLImageElement,
    width: number = 0,
    height: number = 0,
    startX?: number,
    startY?: number
  ) {
    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    // Draw image to canvas
    const ctx = canvas.getContext("2d");
    if (startX !== undefined && startY !== undefined) {
      ctx?.drawImage(
        textureSource,
        startX,
        startY,
        width,
        height,
        0,
        0,
        width,
        height
      );
    } else {
      ctx?.drawImage(textureSource, 0, 0, width, height);
    }

    // Return data url
    return canvas.toDataURL();
  }
}
