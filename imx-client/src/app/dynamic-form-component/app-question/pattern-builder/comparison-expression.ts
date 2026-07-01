// TODO : Add <T> so that this can be typed per expression

import { StixExpression } from './stix-expression';

export class ComparisonExpression extends StixExpression {
    objectPathValue: string;
    comparisonOperator: string;
    comparisonConstant: string;

    constructor(objectPathValue: string, comparisonOperator: string, comparisonConstant: string) {
        super();
        this.objectPathValue = objectPathValue;
        this.comparisonOperator = comparisonOperator;
        this.comparisonConstant = "'" + comparisonConstant + "'";
    }

    getDisplayForExpression(): string {
        if (this.comparisonOperator !== 'EXISTS') {
            return `${this.objectPathValue} ${this.comparisonOperator} ${this.comparisonConstant}`;
        } else {
            return `${this.comparisonOperator} ${this.objectPathValue}`;
        }
    }
}
