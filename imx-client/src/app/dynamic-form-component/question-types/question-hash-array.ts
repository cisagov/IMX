import { QuestionBase } from '../question-base';

export class HashArrayQuestion extends QuestionBase<string[]> {
    controlType = 'hash-array';
    hashes = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512', 'SHA3-256', 'SHA3-512', 'SSDEEP', 'TLSH'];
}
