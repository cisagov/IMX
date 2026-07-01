import { QuestionBase } from '../question-base';

export class RelationshipQuestion extends QuestionBase<string[]> {
    controlType = 'rel-type';
}
