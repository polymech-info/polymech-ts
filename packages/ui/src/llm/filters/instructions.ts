/**
 * Instruction system for building prompts from flags
 * Based on commons.json instruction structure
 */

import { FilterCategory } from './types';

export interface Instruction {
  flag: string;
  text: string;
}

export interface InstructionSet {
  tone: Instruction[];
  content: Instruction[];
  moderation: Instruction[];
  context: Instruction[];
  format: Instruction[];
}

// Load instructions from commons.json structure
export const INSTRUCTIONS: InstructionSet = {
  tone: [
    { flag: 'formal', text: 'use a formal tone' },
    { flag: 'friendly', text: 'Be friendly and approachable!' },
    { flag: 'casual', text: 'use a casual, conversational tone' },
    { flag: 'professional', text: 'use a professional, business-appropriate tone' }
  ],
  content: [
    { flag: 'spellCheck', text: 'spell & grammar fix the text,' },
    { flag: 'removeEmojis', text: 'remove emojis' },
    { flag: 'removePersonalPrefs', text: 'remove personal preferences or biases' },
    { flag: 'removeRedundancy', text: 'remove redundancy, eg: we attached the files' },
    { flag: 'shorten', text: 'shorten text if possible but preserve personality' }
  ],
  moderation: [
    { flag: 'mafiaFilter', text: 'remove references to preciousplastic, bazar and Discord' },
    { flag: 'deprogramming', text: 'remove any brain/green washing, eg: sustainable, circular, recycling ... inflated prospects' },
    { flag: 'emptiness', text: 'Rewrite the following text to remove any inflated or empty language, sugar-coated filler, and needless repetition. The result should be concise, direct, and preserve only the essential ideas.' }
  ],
  context: [
    { flag: 'makerTutorials', text: 'Context: howto tutorials, for makers' },
    { flag: 'units', text: 'Convert units, from metric to imperial and vice versa (in braces)' }
  ],
  format: [
    { flag: 'markdown', text: 'dont comment just return as Markdown' },
    { flag: 'formatStructured', text: 'Format as structured data' }
  ]
};

/**
 * Get instructions for a specific category
 */
export const getInstructionsByCategory = (category: string): Instruction[] => {
  return INSTRUCTIONS[category as keyof InstructionSet] || [];
};

/**
 * Get instruction text by flag
 */
export const getInstructionText = (category: string, flag: string): string => {
  const instructions = getInstructionsByCategory(category);
  const instruction = instructions.find(i => i.flag === flag);
  return instruction?.text || '';
};

/**
 * Build prompt from enabled flags
 * This is the core function that converts enabled flags into prompt text
 */
export const buildInstructionsPrompt = (
  enabledFlags: Record<string, string[]>
): string => {
  const instructionTexts: string[] = [];
  
  Object.entries(enabledFlags).forEach(([category, flags]) => {
    const categoryInstructions = getInstructionsByCategory(category);
    flags.forEach(flag => {
      const instruction = categoryInstructions.find(i => i.flag === flag);
      if (instruction) {
        instructionTexts.push(instruction.text);
      }
    });
  });
  
  return instructionTexts.join('\n');
};

/**
 * Get all available instruction flags
 */
export const getAllInstructionFlags = (): Record<string, string[]> => {
  const result: Record<string, string[]> = {};
  
  Object.entries(INSTRUCTIONS).forEach(([category, instructions]) => {
    result[category] = instructions.map(i => i.flag);
  });
  
  return result;
};

/**
 * Get default enabled flags (from commons.json defaults)
 */
export const getDefaultFlags = (): Record<string, string[]> => {
  return {
    tone: ['formal'],
    content: ['spellCheck', 'removeEmojis', 'removePersonalPrefs', 'shorten'],
    moderation: ['deprogramming'],
    context: ['makerTutorials', 'units'],
    format: ['markdown']
  };
};
