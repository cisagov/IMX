import { ObservationExpressionQualifier } from './observation-expression-qualifier';

export class StartsQualifier extends ObservationExpressionQualifier {
    startDate: Date;
    endDate: Date;

    constructor() {
        super('START');
    }

    getDisplayForQualifier(): string {
        return `START t'${this.startDate.toISOString()}' STOP t'${this.endDate.toISOString()}'`;
    }

    // Data1 = Start Date
    setQualifierData1(startDate: any): void {
        this.startDate = startDate;
    }

    // Data2 = End Date
    setQualifierData2(endDate: any): void {
        this.endDate = endDate;
    }
}
