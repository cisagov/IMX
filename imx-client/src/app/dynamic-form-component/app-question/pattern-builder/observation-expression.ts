import { StixExpression } from './stix-expression';

export class ObservationExpression extends StixExpression {
    comparisonExpression: StixExpression;
    comparisonOperator: string = 'AND';
    nextObservation: ObservationExpression | undefined;

    /**
     * Expression to add to the chain
     *
     * @param expression comparison expression to add
     */
    addExpression(expression: StixExpression): void {
        if (!this.comparisonExpression) {
            this.comparisonExpression = expression;
            return;
        }

        if (!this.nextObservation) this.nextObservation = new ObservationExpression();

        this.nextObservation.setComparisonExpression(expression);
    }

    /**
     * This is the caller function for the showEntireExpressionChain below.
     * This is needed so the showEntireExpressionChain can call itself until there are no more children left.
     *
     * @returns string representing this expression and all of its children
     */
    getDisplayForExpression(): string {
        if (this.comparisonExpression instanceof ObservationExpression) return this.comparisonExpression.showEntireExpressionChain();
        return this.comparisonExpression.getDisplayForExpression();
    }

    /**
     * This is the caller function for the recursiveExpressionArray below.
     * This is needed so the recursiveExpressionArray can call itself until there are no more children left.
     *
     * @returns array expression that displays the entire recursive chain
     */
    getExpressionArray(): ObservationExpression[] {
        let expressionArray = this.recursiveExpressionArray();
        return expressionArray.reverse();
    }

    /**
     * This will add the comparison expression to the appropriate part in the chain
     *
     * @param comparisonExpression comparison expression to add
     */
    setComparisonExpression(comparisonExpression: StixExpression) {
        if (!this.comparisonExpression) this.comparisonExpression = comparisonExpression;
        else {
            if (!this.nextObservation) this.nextObservation = new ObservationExpression();
            this.nextObservation.setComparisonExpression(comparisonExpression);
        }
    }

    /**
     * Instead of parsing the recursive linked list, this will return an array populated with all child expressions in order which is much easier to handle on the frontend.
     *
     * @returns array expression that displays the entire recursive chain
     */
    recursiveExpressionArray(): ObservationExpression[] {
        let observationExpressions = [];
        if (this.nextObservation) observationExpressions = this.nextObservation.recursiveExpressionArray();

        observationExpressions.push(this);

        return observationExpressions;
    }

    /**
     * This is used for displaying this entire observation expression to the frontend in a nice way.
     *
     * @returns string representing this expression and all of its children
     */
    showEntireExpressionChain(initialCall: boolean = false): string {
        let expressionChain = '';
        if (this.comparisonExpression instanceof ObservationExpression) expressionChain = this.comparisonExpression.showEntireExpressionChain();
        else expressionChain = this.comparisonExpression.getDisplayForExpression();

        let exp;
        if (this.comparisonExpression instanceof ObservationExpression) {
            if (this.nextObservation) {
                exp = `[ ${expressionChain} ] ${this.nextObservation ? this.comparisonOperator : ''} ${this.nextObservation ? this.nextObservation.showEntireExpressionChain() : ''}`;
            } else {
                exp = `[ ${expressionChain} ]`;
            }
        } else {
            if (this.nextObservation) {
                exp = `${initialCall ? '[' : ''}${expressionChain} ${this.nextObservation ? this.comparisonOperator : ''} ${this.nextObservation ? this.nextObservation.showEntireExpressionChain() : ''}${initialCall ? ']' : ''}`;
            } else {
                exp = `${initialCall ? '[' : ''}${expressionChain}${initialCall ? ']' : ''}`;
            }
        }

        return exp;
    }
}
