/**
 * The data from a .cube file.
 * file specification: https://kono.phpage.fr/images/a/a1/Adobe-cube-lut-specification-1.0.pdf
 * 
 * .table: https://en.wikipedia.org/wiki/3D_lookup_table
 */
export type LutCube3D = {
    dimensionCount:3,
    /** The width of the cube */
    size:number,
    /**
     * Lookup: `table[z*size*size*3 + y*size*3 + x*3]` will return the red component (add 1 to the index to get green, add 2 for blue)
     * "The lines of table data shall be in ascending index order, with the first component index (Red) changing most rapidly, and the last component index (Blue) changing least rapidly." (Adobe Cube LUT Specification Version 1.0)
     * */
    table:number[],
    /** Default is undefined */
    title?:string,
    /** Default is 0,0,0 */
    lowerBounds:[number,number,number],
    /** Default is 1,1,1 */
    upperBounds:[number,number,number],
}