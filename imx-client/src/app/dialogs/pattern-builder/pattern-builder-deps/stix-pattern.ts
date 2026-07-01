import { ObservationExpression } from './observation-expression';
import { ObservationExpressionQualifier } from './observation-expression-qualifiers/observation-expression-qualifier';
import { RepeatsQualifier } from './observation-expression-qualifiers/observation-expression-qualifier-repeats';
import { StartsQualifier } from './observation-expression-qualifiers/observation-expression-qualifier-starts';
import { WithinQualifier } from './observation-expression-qualifiers/observation-expression-qualifier-within';

export class StixPattern {
    observationExpression: ObservationExpression;
    qualifier: ObservationExpressionQualifier = null;

    /**
     * Created special getter in the event qualifier is null (qualifier isn't required and may be null if not selected).
     * This getter will return an empty string so that the frontend doesn't have a null accessor error.
     */
    get qualifierForDropdown(): string {
        if (this.qualifier) return this.qualifier.qualifier;
        return '';
    }

    get getQualifier(): any {
        if (this.qualifier) return this.qualifier;
        return null;
    }

    /**
     * Assign and create the appropriate class of qualifier for this instance
     *
     * @param qualifier the key corresponding to which class this qualifier is
     */
    set qualifierForDropdown(qualifier: string) {
        if (qualifier === 'REPEATS') {
            this.qualifier = new RepeatsQualifier();
        } else if (qualifier === 'WITHIN') {
            this.qualifier = new WithinQualifier();
        } else if (qualifier === 'START') {
            this.qualifier = new StartsQualifier();
        } else {
            this.qualifier = null;
        }
    }

    /**
     * Prints the entire expression plus the selected qualifier if one was selected
     *
     * @returns the entire stix pattern
     */
    getDisplayForStixPattern(): string {
        const exp = `${this.getDisplayForStixPatternBuilder()} ${this.qualifier ? this.qualifier.getDisplayForQualifier() : ''}`;
        return exp;
    }

    /**
     * When building the stix pattern, we only want to show the expression since the building part will happen after the display output
     *
     * @returns string that shows only the expression chain without any qualifiers
     */
    getDisplayForStixPatternBuilder(): string {
        const exp = `${this.qualifier ? '(' : ''}${this.observationExpression.showEntireExpressionChain(true)}${this.qualifier ? ')' : ''}`;
        return exp;
    }

    /**
     * We've abstracted each of the data fields for each qualifier so it can be easily called.
     * Each qualifier only has two fields possible, with most of them only having one data field.
     * Therefore, we can abstract this process with a parent class so we don't have to worry about defining each variable's class in the app question component.
     * We simply set the data field that corresponds to either data field 1 or in the case of the qualifier "START", data field 2 for the end date.
     *
     * @param qualifierType specifies what qualifier type it is - denotes which class to use
     * @param data the value of the input
     * @param dataIndex each qualifier only has 1-2 data fields possible - this denotes which data field to use
     */
    setQualifierData(qualifierType: string, data: any, dataIndex: number): void {
        if (!this.qualifier) {
            if (qualifierType === 'REPEATS') {
                this.qualifier = new RepeatsQualifier();
            } else if (qualifierType === 'WITHIN') {
                this.qualifier = new WithinQualifier();
            } else if (qualifierType === 'START') {
                this.qualifier = new StartsQualifier();
            } else {
                this.qualifier = null;
            }
        }

        if (this.qualifier) {
            if (dataIndex === 1) {
                this.qualifier.setQualifierData1(data);
            } else {
                this.qualifier.setQualifierData2(data);
            }
        }
    }
}
