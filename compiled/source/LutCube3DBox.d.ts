import { Box, OnException } from "@layer92/core";
import { LutCube3D } from "./LutCube3D";
export declare class LutCube3DBox extends Box<LutCube3D> {
    constructor(data: LutCube3D, onFail?: OnException);
    /** Creates a LutCube3DBox from a valid .cube file containing 3D (not 1D) cube data. */
    static FromCube3DFileData(cubeFileData: string, onFail?: OnException): LutCube3DBox;
    expectValidCoordinates(r: number, g: number, b: number, onOutOfRange?: OnException): void;
    /** Will return the color at the point, trilinear interpolating if necessary. Note that the validity x,y,z values aren't checked. Please do that externally. */
    getInterpolatedValueFast(r: number, g: number, b: number): number[];
}
