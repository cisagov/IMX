export abstract class ObservationExpressionQualifier {
    qualifier: string;

    abstract getDisplayForQualifier(): string;
    abstract setQualifierData1(data1: any): void;
    abstract setQualifierData2(data2: any): void;

    constructor(qualifier: string) {
        this.qualifier = qualifier;
    }

    setQualifier(qualifier: string): void {
        this.qualifier = qualifier;
    }
}
