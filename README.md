# Telazer - Phaser Image Helper

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/Telazer/phaser-image-helper)

A TypeScript utility library for [Phaser 3](https://phaser.io) that simplifies image handling and manipulation. It offers powerful helpers for:

- Efficient image loading and caching
- Nine-slice scaling support
- Image-to-DataURL conversion
- Grid-based sprite sheet slicing
- Texture extrusion and normal map support

---

## Installation

```typescript
npm install @telazer/phaser-image-helper
```

---

## Getting Started

Import `ImageHelper` into your Phaser scenes. It's recommended to initialize it in a dedicated loading scene that handles all asset preloading.

### Key Features

- One-time initialization
- Global access via static API
- Automatic texture caching and optimization

---

## Usage

### Initialization (Loader Scene)

```ts
import ImageHelper from "@telazer/phaser-image-helper";

export class InitScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.INIT });
  }

  async preload() {
    await ImageHelper.init(this, [
      { key: "ball", url: "assets/ball.png" },
      { key: "hero", url: "assets/hero.png" },
    ]);
  }

  async create() {
    await ImageHelper.isReady();
    this.scene.start("game-scene");
  }
}
```

### Access in Other Scenes

```ts
import ImageHelper from "@telazer/phaser-image-helper";

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  init() {
    ImageHelper.updateScene(this);
  }
}
```

---

### Adding Images

```ts
// Add an image to the scene
this.add.image(0, 0, "ball");

// Get the image as a base64 data URL for use in the DOM
const image = document.createElement("img");
image.src = ImageHelper.url("ball");
```

---

## Spritesheet Slicing

You can slice a spritesheet into individual images using a defined grid and `pos`.

```ts
await ImageHelper.init(scene, [
  {
    key: "spritesheet",
    url: "assets/spritesheet.png",
    grid: [16, 16],
    parse: [
      { key: "sprite_1", slice: { pos: 0 } },
      { key: "sprite_2", slice: { pos: 1 } },
      { key: "sprite_3", slice: { pos: 2 } },
    ],
  },
]);
```

### Extracting a Rectangular Area

Use a start and end `pos` range:

```ts
await ImageHelper.init(scene, [
  {
    key: "spritesheet",
    url: "assets/spritesheet.png",
    grid: [16, 16],
    parse: [{ key: "area", slice: { pos: [5, 10] } }],
  },
]);
```

Or use exact rectangle coordinates:

```ts
await ImageHelper.init(scene, [
  {
    key: "spritesheet",
    url: "assets/spritesheet.png",
    parse: [{ key: "custom", rect: { x: 16, y: 16, width: 32, height: 32 } }],
  },
]);
```

---

## Nine-Slice Support

```ts
await ImageHelper.init(scene, [
  {
    key: "nineslice_button",
    url: "assets/nineslice_button.png",
    nineSlice: {
      topHeight: 3,
      centerHeight: 1,
      bottomHeight: 6,
      leftWidth: 2,
      centerWidth: 1,
      rightWidth: 2,
      fill: "repeat",
      scale: "10px",
      pixelated: true,
    },
  },
]);

ImageHelper.nineSlice("nineslice_button", {
  x: 600,
  y: 100,
  width: 100,
  height: 50,
});
```

Get the underlying data:

```ts
const config = ImageHelper.nineSliceData("nineslice_button");
```

### Nine-Slice from Spritesheet

```ts
{
  key: "ns_all",
  url: "assets/ns_all.png",
  nineSlice: {
    topHeight: 3,
    centerHeight: 1,
    bottomHeight: 6,
    leftWidth: 2,
    centerWidth: 1,
    rightWidth: 2,
  },
  grid: [5, 10],
  parse: [
    { key: "ns_green", slice: { pos: 0 }, nineSlice: true },
    {
      key: "ns_blue",
      slice: { pos: 0 },
      nineSlice: {
        topHeight: 3,
        centerHeight: 1,
        bottomHeight: 6,
        leftWidth: 2,
        centerWidth: 1,
        rightWidth: 2,
        pixelated: true,
      },
    },
  ],
}
```

---

## Extruded & Normal Maps

Link extruded and normal maps directly to the same asset key:

```ts
await ImageHelper.init(scene, [
  {
    key: "spritesheet",
    url: "assets/spritesheet.png",
    extruded: "assets/spritesheet_extruded.png",
    normal: "assets/spritesheet_normal.png",
  },
]);
```

This will automatically generate `spritesheet_extruded` and `spritesheet_normal` keys for use.

---

## Features Summary

- ⚡ Async image loading with caching
- 🧩 Nine-slice layout system
- 📦 Grid-based spritesheet slicing
- 🧠 Normal and extruded texture support
- 🖼️ DOM-compatible image data URLs

---

## Development

```bash
# Clone the repo and
# Install dependencies
npm install

# Build the library
npm run build
```

---

## License

MIT License

Copyright (c) 2025 Telazer LLC.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rightsto use, copy, modify, merge, publish, distribute, sublicense, and/or sellcopies of the Software, and to permit persons to whom the Software isfurnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in allcopies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS ORIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THEAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHERLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THESOFTWARE.
