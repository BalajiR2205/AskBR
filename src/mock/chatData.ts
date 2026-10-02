/**
 * Mock Data Architecture for Segment 2 — Chat Interface
 * 
 * Strictly separated from UI presentation components.
 * Anchored in verified historical primary sources of Dr. B. R. Ambedkar.
 * 
 * Note: This data is for frontend testing and prototyping only.
 * Real RAG retrieval will be connected in future segments.
 */

export interface MockEvidence {
  id: string;
  workTitle: string;
  sourceType: 'Book' | 'Speech' | 'Constituent Assembly Debate' | 'Interview' | 'Letter' | 'Article';
  year?: string;
  chapterOrSection?: string;
  page?: string;
  verbatimPassage: string;
  metadata: {
    author: 'Dr. B. R. Ambedkar';
    originalLanguage: string;
    reference: string;
    volume?: string;
  };
}

export interface MockSourceCardData {
  id: string;
  workTitle: string;
  sourceType: string;
  year?: string;
  chapterOrSection?: string;
  evidenceId: string;
}

export interface MockChatResponse {
  answer: string;
  sourceSummary: string; // e.g. "Based on 2 primary sources"
  sources: MockSourceCardData[];
  evidence: Record<string, MockEvidence>;
  status: 'sufficient_evidence' | 'insufficient_evidence';
}

/**
 * Repository of authentic mock primary evidence
 */
export const MOCK_EVIDENCE_STORE: Record<string, MockEvidence> = {
  'ev-aoc-democracy': {
    id: 'ev-aoc-democracy',
    workTitle: 'Annihilation of Caste',
    sourceType: 'Book',
    year: '1936',
    chapterOrSection: 'Section XIV',
    page: 'pp. 56–57',
    verbatimPassage:
      '“Democracy is not merely a form of government. It is primarily a mode of associated living, of conjoint communicated experience. It is essentially an attitude of respect and reverence towards fellowmen.”',
    metadata: {
      author: 'Dr. B. R. Ambedkar',
      originalLanguage: 'English',
      reference: 'Dr. Babasaheb Ambedkar: Writings and Speeches (BAWS), Vol. 1, p. 57',
      volume: 'Vol. 1',
    },
  },
  'ev-cad-social-democracy': {
    id: 'ev-cad-social-democracy',
    workTitle: 'Constituent Assembly Debates',
    sourceType: 'Constituent Assembly Debate',
    year: '1949',
    chapterOrSection: 'Speech on Adoption of the Constitution (25 November 1949)',
    page: 'CAD Vol. XI, pp. 972–981',
    verbatimPassage:
      '“Political democracy cannot last unless there lies at the base of it social democracy. What does social democracy mean? It means a way of life which recognizes liberty, equality and fraternity as the principles of life. They are not to be treated as separate items in a trinity. They form a union of trinity in the sense that to divorce one from the other is to defeat the very purpose of democracy.”',
    metadata: {
      author: 'Dr. B. R. Ambedkar',
      originalLanguage: 'English',
      reference: 'Constituent Assembly of India Debates (Proceedings), Vol. XI, 25 Nov 1949',
      volume: 'Vol. 13 (BAWS)',
    },
  },
  'ev-aoc-division-labour': {
    id: 'ev-aoc-division-labour',
    workTitle: 'Annihilation of Caste',
    sourceType: 'Book',
    year: '1936',
    chapterOrSection: 'Section IV',
    page: 'pp. 47–48',
    verbatimPassage:
      '“Caste is not merely a division of labour. It is also a division of labourers. Civilized society undoubtedly needs division of labour. But in no civilized society is division of labour accompanied by this unnatural division of labourers into water-tight compartments.”',
    metadata: {
      author: 'Dr. B. R. Ambedkar',
      originalLanguage: 'English',
      reference: 'Dr. Babasaheb Ambedkar: Writings and Speeches (BAWS), Vol. 1, p. 47',
      volume: 'Vol. 1',
    },
  },
  'ev-castes-india-endogamy': {
    id: 'ev-castes-india-endogamy',
    workTitle: 'Castes in India: Their Mechanism, Genesis and Development',
    sourceType: 'Book',
    year: '1916',
    chapterOrSection: 'Anthropology Seminar Paper, Columbia University',
    page: 'pp. 5–22',
    verbatimPassage:
      '“Endogamy is the only characteristic that is peculiar to caste... Superimposition of endogamy on exogamy means the creation of caste.”',
    metadata: {
      author: 'Dr. B. R. Ambedkar',
      originalLanguage: 'English',
      reference: 'Indian Antiquary, Vol. XLVI, May 1917 / BAWS Vol. 1',
      volume: 'Vol. 1',
    },
  },
  'ev-cad-const-morality': {
    id: 'ev-cad-const-morality',
    workTitle: 'Constituent Assembly Debates',
    sourceType: 'Constituent Assembly Debate',
    year: '1948',
    chapterOrSection: 'Motion to Introduce the Draft Constitution (4 November 1948)',
    page: 'CAD Vol. VII, pp. 38–44',
    verbatimPassage:
      '“Constitutional morality is not a natural sentiment. It has to be cultivated. We must realize that our people have yet to learn it. Democracy in India is only a top-dressing on an Indian soil, which is essentially undemocratic.”',
    metadata: {
      author: 'Dr. B. R. Ambedkar',
      originalLanguage: 'English',
      reference: 'Constituent Assembly Debates, Vol. VII, 4 Nov 1948 / BAWS Vol. 13',
      volume: 'Vol. 13 (BAWS)',
    },
  },
  'ev-aoc-equality': {
    id: 'ev-aoc-equality',
    workTitle: 'Annihilation of Caste',
    sourceType: 'Book',
    year: '1936',
    chapterOrSection: 'Section XIV',
    page: 'pp. 57–58',
    verbatimPassage:
      '“Equality may be a fiction but nonetheless one must accept it as the governing principle. A man’s power is dependent upon (1) physical heredity, (2) social inheritance or endowments such as parental care, education, and (3) his own efforts... If equality cannot be attained physically, society must still treat men equally as far as possible.”',
    metadata: {
      author: 'Dr. B. R. Ambedkar',
      originalLanguage: 'English',
      reference: 'Dr. Babasaheb Ambedkar: Writings and Speeches (BAWS), Vol. 1',
      volume: 'Vol. 1',
    },
  },
  'ev-speech-nagpur-education': {
    id: 'ev-speech-nagpur-education',
    workTitle: 'Speech at the All-India Depressed Classes Conference',
    sourceType: 'Speech',
    year: '1942',
    chapterOrSection: 'Presidential Address at Nagpur (20 July 1942)',
    page: 'BAWS Vol. 17 (Part 3)',
    verbatimPassage:
      '“My final words of advice to you are educate, agitate and organize; have faith in yourselves. With justice on our side I do not see how we can lose our battle. The battle to me is one of freedom. A battle for the reclamation of human personality.”',
    metadata: {
      author: 'Dr. B. R. Ambedkar',
      originalLanguage: 'English',
      reference: 'Speech delivered at Nagpur, July 20, 1942 / BAWS Vol. 17 (Part 3)',
      volume: 'Vol. 17',
    },
  },
};

/**
 * Predefined realistic mock responses keyed by query keywords
 */
export const MOCK_RESPONSES: Record<string, MockChatResponse> = {
  democracy: {
    answer:
      'Dr. B. R. Ambedkar defined democracy not merely as a parliamentary mechanism or representative government, but fundamentally as “a mode of associated living” and an attitude of respect and reverence towards fellow human beings.\n\nCrucially, in his historic address to the Constituent Assembly on 25 November 1949, he insisted that political democracy is unsustainable without social democracy at its foundation. He characterized liberty, equality, and fraternity as an inseparable “trinity”—arguing that separating any one from the other defeats the very essence and durability of democratic life.',
    sourceSummary: 'Based on 2 primary sources',
    sources: [
      {
        id: 'card-1',
        workTitle: 'Annihilation of Caste',
        sourceType: 'Book',
        year: '1936',
        chapterOrSection: 'Section XIV',
        evidenceId: 'ev-aoc-democracy',
      },
      {
        id: 'card-2',
        workTitle: 'Constituent Assembly Debates',
        sourceType: 'Speech / Debate',
        year: '1949',
        chapterOrSection: 'Speech on Adoption of the Constitution (25 Nov 1949)',
        evidenceId: 'ev-cad-social-democracy',
      },
    ],
    evidence: {
      'ev-aoc-democracy': MOCK_EVIDENCE_STORE['ev-aoc-democracy'],
      'ev-cad-social-democracy': MOCK_EVIDENCE_STORE['ev-cad-social-democracy'],
    },
    status: 'sufficient_evidence',
  },

  caste: {
    answer:
      'In his extensive analytical writings, Dr. Ambedkar dismantled the common economic defense that caste is simply a traditional division of labour. He argued in Annihilation of Caste that caste is fundamentally an unnatural “division of labourers,” stratifying workers into hierarchical, water-tight compartments without regard to choice or natural aptitudes.\n\nEarlier in his 1916 Columbia University research, he identified endogamy (the prohibition of inter-marriage) as the core structural mechanism that sustains the caste system and prevents the emergence of shared social consciousness.',
    sourceSummary: 'Based on 2 primary sources',
    sources: [
      {
        id: 'card-3',
        workTitle: 'Annihilation of Caste',
        sourceType: 'Book',
        year: '1936',
        chapterOrSection: 'Section IV',
        evidenceId: 'ev-aoc-division-labour',
      },
      {
        id: 'card-4',
        workTitle: 'Castes in India: Their Mechanism, Genesis and Development',
        sourceType: 'Book / Seminar Paper',
        year: '1916',
        chapterOrSection: 'Columbia University Address',
        evidenceId: 'ev-castes-india-endogamy',
      },
    ],
    evidence: {
      'ev-aoc-division-labour': MOCK_EVIDENCE_STORE['ev-aoc-division-labour'],
      'ev-castes-india-endogamy': MOCK_EVIDENCE_STORE['ev-castes-india-endogamy'],
    },
    status: 'sufficient_evidence',
  },

  equality: {
    answer:
      'Dr. Ambedkar addressed the philosophical paradox of equality directly in Annihilation of Caste. While acknowledging that human beings may not be physically, biologically, or circumstantially equal, he argued that society must nonetheless uphold equality as an uncompromised governing principle.\n\nHe reasoned that if society treats individuals unequally based on differences in social privilege or inherited endowments, it rewards circumstance rather than merit. Treating people as equals is therefore a practical and ethical necessity for any society seeking to maximize human flourishing.',
    sourceSummary: 'Based on 1 primary source',
    sources: [
      {
        id: 'card-5',
        workTitle: 'Annihilation of Caste',
        sourceType: 'Book',
        year: '1936',
        chapterOrSection: 'Section XIV',
        evidenceId: 'ev-aoc-equality',
      },
    ],
    evidence: {
      'ev-aoc-equality': MOCK_EVIDENCE_STORE['ev-aoc-equality'],
    },
    status: 'sufficient_evidence',
  },

  'constitutional morality': {
    answer:
      'Addressing the Constituent Assembly on 4 November 1948, Dr. Ambedkar introduced the concept of “constitutional morality,” citing the classical historian George Grote. He underscored that respect for constitutional norms and procedures is not an innate or natural sentiment in society, but something that must be deliberately cultivated.\n\nHe warned that democracy in India was “only a top-dressing on an Indian soil, which is essentially undemocratic,” making adherence to constitutional discipline, institutional restraint, and legal recourse essential to avoid authoritarianism.',
    sourceSummary: 'Based on 1 primary source',
    sources: [
      {
        id: 'card-6',
        workTitle: 'Constituent Assembly Debates',
        sourceType: 'Constituent Assembly Debate',
        year: '1948',
        chapterOrSection: 'Motion to Introduce Draft Constitution (4 Nov 1948)',
        evidenceId: 'ev-cad-const-morality',
      },
    ],
    evidence: {
      'ev-cad-const-morality': MOCK_EVIDENCE_STORE['ev-cad-const-morality'],
    },
    status: 'sufficient_evidence',
  },

  education: {
    answer:
      'Education occupied a central role in Dr. Ambedkar’s vision of social transformation. In his famous presidential address at Nagpur in July 1942, he delivered his enduring call to “Educate, Agitate, and Organize,” framing education not as a path to individual status, but as a collective battle for the reclamation of human personality and freedom.\n\nHe argued that without critical education and self-awareness, marginalized communities could neither perceive their exploitation nor formulate effective democratic resistance.',
    sourceSummary: 'Based on 1 primary source',
    sources: [
      {
        id: 'card-7',
        workTitle: 'Speech at All-India Depressed Classes Conference',
        sourceType: 'Speech',
        year: '1942',
        chapterOrSection: 'Presidential Address at Nagpur (20 July 1942)',
        evidenceId: 'ev-speech-nagpur-education',
      },
    ],
    evidence: {
      'ev-speech-nagpur-education': MOCK_EVIDENCE_STORE['ev-speech-nagpur-education'],
    },
    status: 'sufficient_evidence',
  },
};

/**
 * Suggested sample questions for the empty state
 */
export const SUGGESTED_QUESTIONS = [
  'What did Ambedkar say about democracy?',
  'What did Ambedkar write about caste?',
  'What was Ambedkar\'s view of equality?',
  'What did Ambedkar say about constitutional morality?',
  'What did Ambedkar write about education?',
];

/**
 * Heuristic mock retriever simulating backend query resolution
 */
export async function getMockChatResponse(query: string): Promise<MockChatResponse> {
  // Simulate natural search delay (450ms–750ms) for realistic UX
  await new Promise((resolve) => setTimeout(resolve, 600));

  const lower = query.toLowerCase();

  if (lower.includes('democracy') || lower.includes('democratic')) {
    return MOCK_RESPONSES.democracy;
  }
  if (lower.includes('caste') || lower.includes('varna') || lower.includes('untouchab')) {
    return MOCK_RESPONSES.caste;
  }
  if (lower.includes('equality') || lower.includes('equal') || lower.includes('fraternity')) {
    return MOCK_RESPONSES.equality;
  }
  if (lower.includes('constitution') || lower.includes('morality') || lower.includes('law')) {
    return MOCK_RESPONSES['constitutional morality'];
  }
  if (lower.includes('education') || lower.includes('school') || lower.includes('teach') || lower.includes('agitate')) {
    return MOCK_RESPONSES.education;
  }

  // Modern / Anachronistic speculation refusal check
  const modernTerms = ['artificial intelligence', 'ai', 'crypto', 'internet', 'social media', 'smartphone', 'blockchain'];
  if (modernTerms.some(term => lower.includes(term))) {
    return {
      answer:
        `The question concerns a modern subject that post-dates Dr. B. R. Ambedkar's historical lifetime. Dr. Ambedkar's documented writings and recorded statements contain no position on this subject.\n\nIn accordance with our core principle, Ask Ambedkar does not speculate on what Ambedkar "would have thought."`,
      sourceSummary: '0 primary sources found (Anachronistic topic)',
      sources: [],
      evidence: {},
      status: 'insufficient_evidence',
    };
  }

  // Generic fallback for unknown queries in mock mode
  return {
    answer:
      `No documented evidence found in the current mock dataset for this query.\n\nThis is placeholder behavior for Segment 2. The full primary-source retrieval system (indexing BAWS Volumes 1–22, CAD, speeches, and correspondence) will be connected in subsequent segments.`,
    sourceSummary: '0 primary sources found in current mock dataset',
    sources: [],
    evidence: {},
    status: 'insufficient_evidence',
  };
}
