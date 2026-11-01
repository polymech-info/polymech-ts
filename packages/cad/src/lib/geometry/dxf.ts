import * as fs from 'fs';
import { DxfParser } from 'dxf-parser'

import { sync as write } from '@polymech/fs/write'

interface DxfEntity {
    type: string;
    vertices?: { x: number; y: number }[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    radius?: number;
    center?: { x: number; y: number };
    startAngle?: number;
    endAngle?: number;
}

function distanceBetweenPoints(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function arcLength(radius: number, startAngle: number, endAngle: number): number {
    return Math.abs(endAngle - startAngle) * radius;
}

function calculateEntityLength(entity: DxfEntity): number {
    switch (entity.type) {
        //case 'LINE':
        //    return distanceBetweenPoints(entity.start!, entity.end!);
        case 'LWPOLYLINE':
        case 'LINE':
            let length = 0;
            for (let i = 0; i < entity.vertices!.length - 1; i++) {
                try {
                    length += distanceBetweenPoints(entity.vertices![i], entity.vertices![i + 1]);
                } catch (e) {
                    console.log('error', entity, e)

                }
            }
            return length;
        case 'CIRCLE':
            return 2 * Math.PI * entity.radius!;
        case 'ARC':
            return arcLength(entity.radius!, entity.startAngle!, entity.endAngle!);
        default:
            return 0;
    }
}

function calculateTotalDxfEntitiesLength(filePath: string): number {
    const parser = new DxfParser();
    const dxfData = parser.parseSync(fs.readFileSync(filePath, 'utf-8'));

    const ret = dxfData.entities.reduce((totalLength: number, entity: DxfEntity) => {
        const length = calculateEntityLength(entity);
        return totalLength + length;
    }, 0);
    write( filePath + '.json', JSON.stringify(dxfData, null, 2)) 
    return ret;
}
