import { Box, OnException, Expect, Strings } from "@layer92/core";
import { LutCube3D } from "./LutCube3D";

export class LutCube3DBox extends Box<LutCube3D>{
    constructor(data:LutCube3D,onFail?:OnException){
        super(data);
        Expect(data.dimensionCount>0,()=>`Lut file had invalid dimensionCount: ${data.dimensionCount}`,onFail);
        Expect(data.size>0,()=>`Lut file had invalid size: ${data.size}`,onFail);
        const expectedLength = 3 * Math.pow(data.size, 3);
        Expect(data.table.length === expectedLength,()=>`Lut: incorrect data length. Expected ${expectedLength}. Received ${data.table.length}.`,onFail);
    }
    /** Creates a LutCube3DBox from a valid .cube file containing 3D (not 1D) cube data. */
    static FromCube3DFileData(cubeFileData:string,onFail?:OnException){
        cubeFileData = Strings.RemoveCharacters(cubeFileData,"\r");
        let result:LutCube3D = {
            dimensionCount: 3,
            size: 0,
            table: [],
            lowerBounds:[0,0,0],
            upperBounds:[1,1,1],
        };
        try{
            for(let rowString of cubeFileData.split("\n")){
                rowString = Strings.RemoveWhitespaceFromEnds(rowString);
                if(!rowString.length){
                    continue;
                }
                if(rowString.startsWith("#")){
                    continue;
                }
                const row = rowString.split(" ");
                let rowValues:number[];
                switch(row[0]){
                    case "LUT_1D_SIZE":
                        // result.dimensionCount = 1;
                        // result.size = parseInt(row[1]);
                        // Expect(!isNaN(result.size),`Invalid ${row[0]} row. Expected an integer value.`);
                        throw new Error("Expected 3D but received a 1D file.");
                    break;
                    case "LUT_3D_SIZE":
                        result.dimensionCount = 3;
                        result.size = parseInt(row[1]);
                        Expect(!isNaN(result.size),`Invalid ${row[0]} row. Expected an integer value.`);
                    break;
                    case "TITLE":
                        Expect(rowString.endsWith(`"`),`Invalid ${row[0]} row. Value must be enclosed in quotation marks.`);
                        // because there might be spaces in the title
                        const titleValue = Strings.RemoveAnyFromStart(rowString,`TITLE `);
                        Expect(titleValue.startsWith(`"`),`Invalid ${row[0]} row. Value must be enclosed in quotation marks.`);
                        const quoteCount = Strings.GetSubstringCount(rowString,`"`);
                        Expect(quoteCount===2,`Invalid ${row[0]} row. You cannot use quotation marks inside of the value.`);
                        result.title = titleValue;
                    break;
                    case "DOMAIN_MIN":
                        Expect(row.length===4,`Invalid ${row[0]} row. Expected length 4, received length ${row.length}`);
                        rowValues = row.slice(1).map(a=>parseFloat(a));
                        Expect(rowValues.every(a=>!isNaN(a)),`Invalid ${row[0]} row. Expected values to be numbers.`);
                        result.lowerBounds = rowValues as [number,number,number];
                    break;
                    case "DOMAIN_MAX":
                        Expect(row.length===4,`Invalid ${row[0]} row. Expected length 4, received length ${row.length}`);
                        rowValues = row.slice(1).map(a=>parseFloat(a));
                        Expect(rowValues.every(a=>!isNaN(a)),`Invalid ${row[0]} row. Expected values to be numbers.`);
                        result.upperBounds = rowValues as [number,number,number];
                    break;
                    default:
                        Expect(row.length===3,`Invalid table data row. Expected length 3, received length ${row.length}`);
                        rowValues = row.map(a=>parseFloat(a));
                        Expect(rowValues.every(a=>!isNaN(a)),`Invalid row value. Expected a number.`);
                        result.table.push(...rowValues);
                    break;
                }
            }
            return new LutCube3DBox(result,onFail);
        }catch(e:any){
            Expect(false,`Invalid .cube file: `+e.message,onFail);
        }
    }

    expectValidCoordinates(r:number,g:number,b:number,onOutOfRange?:OnException){
        const size=this._data.size;
        Expect(r<=size&&g<=size&&b<=size&&r>=0&&g>=0&&b>=0,()=>`Coordinate is out of range.`,onOutOfRange);;
    }
    /** Will return the color at the point, trilinear interpolating if necessary. Note that the validity x,y,z values aren't checked. Please do that externally. */
    getInterpolatedValueFast(r:number,g:number,b:number){
        // see: https://en.wikipedia.org/wiki/Trilinear_interpolation
        /** cubeX0 is the x coordinate inside the cube, cubeX0Triple is multiplied by three for looking up the value in the table */
        const cubeX0Tripled = Math.floor(r)*3;
        const cubeY0Tripled = Math.floor(g)*3;
        const cubeZ0Tripled = Math.floor(b)*3;
        const cubeX1Tripled = Math.ceil(r)*3;
        const cubeY1Tripled = Math.ceil(g)*3;
        const cubeZ1Tripled = Math.floor(b)*(3);
        /** the distance from the x0 to the actual x value in the cube, used for interpolation between x0 and x1 */
        const cubeXRemainder = r-Math.floor(r);
        const cubeYRemainder = g-Math.floor(g);
        const cubeZRemainder = b-Math.floor(b);

        const {table,size} = this._data;
        const size2 = size*size;

        // get sample points
        const cubeR000 = table[cubeX0Tripled + cubeY0Tripled*size + cubeZ0Tripled*size2];
        const cubeR001 = table[cubeX0Tripled + cubeY0Tripled*size + cubeZ1Tripled*size2];
        const cubeR010 = table[cubeX0Tripled + cubeY1Tripled*size + cubeZ0Tripled*size2];
        const cubeR011 = table[cubeX0Tripled + cubeY1Tripled*size + cubeZ1Tripled*size2];
        const cubeR100 = table[cubeX1Tripled + cubeY0Tripled*size + cubeZ0Tripled*size2];
        const cubeR101 = table[cubeX1Tripled + cubeY0Tripled*size + cubeZ1Tripled*size2];
        const cubeR110 = table[cubeX1Tripled + cubeY1Tripled*size + cubeZ0Tripled*size2];
        const cubeR111 = table[cubeX1Tripled + cubeY1Tripled*size + cubeZ1Tripled*size2];
        const cubeG000 = table[1 + cubeX0Tripled + cubeY0Tripled*size + cubeZ0Tripled*size2];
        const cubeG001 = table[1 + cubeX0Tripled + cubeY0Tripled*size + cubeZ1Tripled*size2];
        const cubeG010 = table[1 + cubeX0Tripled + cubeY1Tripled*size + cubeZ0Tripled*size2];
        const cubeG011 = table[1 + cubeX0Tripled + cubeY1Tripled*size + cubeZ1Tripled*size2];
        const cubeG100 = table[1 + cubeX1Tripled + cubeY0Tripled*size + cubeZ0Tripled*size2];
        const cubeG101 = table[1 + cubeX1Tripled + cubeY0Tripled*size + cubeZ1Tripled*size2];
        const cubeG110 = table[1 + cubeX1Tripled + cubeY1Tripled*size + cubeZ0Tripled*size2];
        const cubeG111 = table[1 + cubeX1Tripled + cubeY1Tripled*size + cubeZ1Tripled*size2];
        const cubeB000 = table[2 + cubeX0Tripled + cubeY0Tripled*size + cubeZ0Tripled*size2];
        const cubeB001 = table[2 + cubeX0Tripled + cubeY0Tripled*size + cubeZ1Tripled*size2];
        const cubeB010 = table[2 + cubeX0Tripled + cubeY1Tripled*size + cubeZ0Tripled*size2];
        const cubeB011 = table[2 + cubeX0Tripled + cubeY1Tripled*size + cubeZ1Tripled*size2];
        const cubeB100 = table[2 + cubeX1Tripled + cubeY0Tripled*size + cubeZ0Tripled*size2];
        const cubeB101 = table[2 + cubeX1Tripled + cubeY0Tripled*size + cubeZ1Tripled*size2];
        const cubeB110 = table[2 + cubeX1Tripled + cubeY1Tripled*size + cubeZ0Tripled*size2];
        const cubeB111 = table[2 + cubeX1Tripled + cubeY1Tripled*size + cubeZ1Tripled*size2];

        // collapse to two dimensions
        const squareR00 = LerpFast(cubeR000,cubeR001,cubeZRemainder);
        const squareR01 = LerpFast(cubeR010,cubeR011,cubeZRemainder);
        const squareR10 = LerpFast(cubeR100,cubeR101,cubeZRemainder);
        const squareR11 = LerpFast(cubeR110,cubeR111,cubeZRemainder);
        const squareG00 = LerpFast(cubeG000,cubeG001,cubeZRemainder);
        const squareG01 = LerpFast(cubeG010,cubeG011,cubeZRemainder);
        const squareG10 = LerpFast(cubeG100,cubeG101,cubeZRemainder);
        const squareG11 = LerpFast(cubeG110,cubeG111,cubeZRemainder);
        const squareB00 = LerpFast(cubeB000,cubeB001,cubeZRemainder);
        const squareB01 = LerpFast(cubeB010,cubeB011,cubeZRemainder);
        const squareB10 = LerpFast(cubeB100,cubeB101,cubeZRemainder);
        const squareB11 = LerpFast(cubeB110,cubeB111,cubeZRemainder);

        // collapse to one dimension
        const lineR0 = LerpFast(squareR00,squareR01,cubeYRemainder);
        const lineR1 = LerpFast(squareR10,squareR11,cubeYRemainder);
        const lineG0 = LerpFast(squareG00,squareG01,cubeYRemainder);
        const lineG1 = LerpFast(squareG10,squareG11,cubeYRemainder);
        const lineB0 = LerpFast(squareB00,squareB01,cubeYRemainder);
        const lineB1 = LerpFast(squareB10,squareB11,cubeYRemainder);

        // collapse to point
        r = LerpFast(lineR0,lineR0,cubeXRemainder);
        g = LerpFast(lineG0,lineG0,cubeXRemainder);
        b = LerpFast(lineB0,lineB0,cubeXRemainder);

        return [r,g,b];
    }
}

/**
 * @param x in range [0,1]
 */
function LerpFast(a:number,b:number,x:number){
    return a*x + b*(1-x);
}