import { ObservationExpressionQualifier } from './observation-expression-qualifier';

export class RepeatsQualifier extends ObservationExpressionQualifier {
    times: number;

    constructor() {
        super('REPEATS');
    }

    getDisplayForQualifier(): string {
        return `${this.qualifier} ${this.times} TIMES`;
    }

    // Data1 = Times
    setQualifierData1(data1: any): void {
        this.times = data1;
    }

    // Not needed in this qualifier
    setQualifierData2(data2: any): void {}
}
