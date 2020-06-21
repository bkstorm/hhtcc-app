import * as _ from 'lodash';

const DEFAULT_STEPS = [
  'Trước khi nhận chất nạo vét',
  'Sau khi nhận chất nạo vét',
  'Trước khi xả chất nạo vét',
  'Sau khi xả chất nạo vét',
];

export type TEMPLATE_TYPE = 'TEMPLATE_08' | 'TEMPLATE_12';

export class ReportOptions {
  project: string;
  company: string;
  vehicle: string;
  isImageCheckingOn: boolean;
  steps: string[];
  selectedDirectories: Array<string>;
  templateFilePath: string;
  templateType: TEMPLATE_TYPE;

  constructor(steps: string[] = _.cloneDeep(DEFAULT_STEPS)) {
    this.steps = steps;
    this.selectedDirectories = [];
    this.templateType = 'TEMPLATE_08';
  }
}
