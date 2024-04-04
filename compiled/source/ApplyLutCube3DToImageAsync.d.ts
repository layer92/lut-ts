import { OnException } from "@layer92/core";
import { LutCube3D } from "./LutCube3D";
export declare function ApplyLutCube3DToImageAsync(lut: LutCube3D, image: {
    data: ArrayLike<number>;
}, onProgress?: (completed: number) => void | Promise<void>, onBadData?: OnException): Promise<number[]>;
