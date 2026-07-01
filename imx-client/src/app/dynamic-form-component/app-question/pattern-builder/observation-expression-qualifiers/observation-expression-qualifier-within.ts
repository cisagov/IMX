import { ObservationExpressionQualifier } from './observation-expression-qualifier';

export class WithinQualifier extends ObservationExpressionQualifier {
    seconds: number;

    constructor() {
        super('WITHIN');
    }

    getDisplayForQualifier(): string {
        return `WITHIN ${this.seconds} SECONDS`;
    }

    // Data1 = Seconds
    setQualifierData1(data1: any): void {
        this.seconds = data1;
    }

    // Not needed in this qualifier
    setQualifierData2(data2: any): void {}
}
