import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilsService {
    generateRandomAddress(): string {
        const calle = this.randomInt(1, 100);
        const carrera = this.randomInt(1, 120);
        const letras = ['A', 'B', 'C', 'D', 'E', 'SUR', 'NORTE'];
        const sufijoCalle = Math.random() > 0.5 ? ` ${this.randomItem(letras)}` : '';
        const sufijoCarrera = Math.random() > 0.5 ? ` ${this.randomItem(letras)}` : '';
        const numero = this.randomInt(1, 80);
        const interior = Math.random() > 0.3 ? ` (INTERIOR ${this.randomInt(100, 900)})` : '';

        return `CL ${calle}${sufijoCalle} CR ${carrera}${sufijoCarrera} -${numero}${interior}`;
    }

    shuffleArray<T>(array: T[]): T[] {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomItem<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }
}
