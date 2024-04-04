"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplyLutCube3DToImageAsync = void 0;
const core_1 = require("@layer92/core");
const LutCube3DBox_1 = require("./LutCube3DBox");
async function ApplyLutCube3DToImageAsync(lut, image, onProgress, onBadData) {
    const lutBox = new LutCube3DBox_1.LutCube3DBox(lut);
    const { data } = image;
    const result = Array.from(data);
    const imagePixelCount = data.length / 4;
    const updateProgressEveryNPixels = onProgress ? Math.floor(imagePixelCount / 100) : 0;
    onProgress?.(0.0);
    const lutMaxIndex = lut.size - 1;
    // "When converting images with integer-encoded values, the reader shall scale the integer encoding range to the domain 0.0 to 1.0, and shall scale the output range 0.0 to 1.0 to the integer encoding range." (Adobe Cube LUT Specification Version 1.0)
    for (let pixelIndex = 0; pixelIndex < imagePixelCount; ++pixelIndex) {
        const index = pixelIndex * 4;
        // conver to range [0,1]
        let r = data[index] / 255;
        let g = data[index + 1] / 255;
        let b = data[index + 2] / 255;
        (0, core_1.Expect)(r <= 1 && g <= 1 && b <= 1 && r >= 0 && g >= 0 && b >= 0, () => `Pixel at index ${pixelIndex} is out of range [0, 255].`, onBadData);
        // convert to indexes in LUT, range [0,size-1]
        r *= lutMaxIndex;
        g *= lutMaxIndex;
        b *= lutMaxIndex;
        // convert to range [0,1]
        [r, g, b] = lutBox.getInterpolatedValueFast(r, g, b);
        // convert to range [0,255]
        result[index] = Math.round(r * 255);
        result[index + 1] = Math.round(g * 255);
        result[index + 2] = Math.round(b * 255);
        if (onProgress && (pixelIndex % updateProgressEveryNPixels === 0)) {
            onProgress?.(pixelIndex / imagePixelCount);
            await (0, core_1.SleepAsync)(1);
        }
    }
    onProgress?.(1.0);
    return result;
}
exports.ApplyLutCube3DToImageAsync = ApplyLutCube3DToImageAsync;
