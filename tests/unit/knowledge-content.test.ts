import { describe, it, expect } from 'vitest';
import { validateKnowledgeFile, type KnowledgeFile } from '../../scripts/lib/validate-knowledge-content';

function validEntry(gradeLevel: number) {
  return {
    gradeLevel,
    title: `Grade ${gradeLevel} Mathematics: Numbers and Operations`,
    contentBody: 'x'.repeat(450),
    pedagogicalNotes: 'y'.repeat(120),
    exampleProblems: [
      { problem: 'p1', solution: 's1', explanation: 'e1', difficulty: 'easy' as const },
      { problem: 'p2', solution: 's2', explanation: 'e2', difficulty: 'medium' as const },
    ],
  };
}

function validFile(): KnowledgeFile {
  return {
    subject: 'Mathematics',
    entries: Array.from({ length: 20 }, (_, i) => validEntry(i + 1)),
  };
}

describe('validateKnowledgeFile', () => {
  it('accepts a complete valid file', () => {
    expect(validateKnowledgeFile(validFile())).toEqual([]);
  });

  it('rejects an unknown subject', () => {
    const f = { ...validFile(), subject: 'Underwater Basket Weaving' };
    const problems = validateKnowledgeFile(f);
    expect(problems.some((p) => p.path === 'subject')).toBe(true);
  });

  it('accepts the French and Canadian history subjects', () => {
    for (const subject of ['French', 'Quebec History', 'Ontario History', 'Canada History']) {
      const f = { ...validFile(), subject };
      expect(validateKnowledgeFile(f)).toEqual([]);
    }
  });

  it('rejects a missing grade', () => {
    const f = validFile();
    f.entries = f.entries.filter((e) => e.gradeLevel !== 7);
    const problems = validateKnowledgeFile(f);
    expect(problems.some((p) => p.message.includes('missing gradeLevel 7'))).toBe(true);
  });

  it('rejects duplicate grades', () => {
    const f = validFile();
    f.entries[1] = { ...f.entries[1], gradeLevel: 1 };
    const problems = validateKnowledgeFile(f);
    expect(problems.some((p) => p.message.includes('duplicate gradeLevel'))).toBe(true);
  });

  it('rejects short contentBody and bad difficulty', () => {
    const f = validFile();
    f.entries[0] = {
      ...f.entries[0],
      contentBody: 'too short',
      exampleProblems: [{ problem: 'p', solution: 's', explanation: 'e', difficulty: 'impossible' as never }],
    };
    const problems = validateKnowledgeFile(f);
    expect(problems.some((p) => p.path.includes('contentBody'))).toBe(true);
    expect(problems.some((p) => p.path.includes('difficulty'))).toBe(true);
  });

  it('rejects a title over 120 chars', () => {
    const f = validFile();
    f.entries[0] = { ...f.entries[0], title: 'T'.repeat(121) };
    const problems = validateKnowledgeFile(f);
    expect(problems.some((p) => p.path.includes('title'))).toBe(true);
  });
});
