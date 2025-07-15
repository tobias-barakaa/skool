// src/teacher/test/utils/map-create-to-output.ts (optional helper file)
import { CreateQuestionInput } from '../dtos/create-question-input.dto';
import {
  GeneratedQuestionOutput,
  GeneratedOptionOutput,
} from '../dtos/generated-question-output.dto';

export function mapToGeneratedQuestionOutput(
  input: CreateQuestionInput[],
): GeneratedQuestionOutput[] {
  return input.map((q) => ({
    text: q.text,
    marks: q.marks,
    order: q.order,
    type: q.type,
    isAIGenerated: q.isAIGenerated,
    aiPrompt: q.aiPrompt,
    options: (q.options || []).map((opt) => ({
      text: opt.text,
      isCorrect: opt.isCorrect,
      order: opt.order,
    })),
  }));
}
