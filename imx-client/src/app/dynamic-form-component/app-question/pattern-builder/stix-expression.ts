export abstract class StixExpression {
    comparisonOperator: string;

    abstract getDisplayForExpression(): string;
}
