// Syllabus and Curriculum Types
export interface Syllabus {
  id: number;
  classId: number;
  subjectId: number;
  teacherId: number;
  title: string;
  description?: string;
  academicYear: string;
  fileUrl?: string;
  fileName?: string;
  totalTopics: number;
  topicsCovered: number;
  coveragePercentage: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SyllabusTopic {
  id: number;
  syllabusId: number;
  topicNumber: number;
  title: string;
  description?: string;
  status: 'pending' | 'ongoing' | 'covered';
  coveredDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Test and Quiz Types
export interface Test {
  id: number;
  classId: number;
  subjectId: number;
  teacherId: number;
  title: string;
  description?: string;
  instructions?: string;
  durationMinutes?: number;
  totalQuestions: number;
  passingScore?: number;
  testType: 'manual' | 'ai_generated';
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'archived';
  startTime?: string;
  endTime?: string;
  showAnswers: boolean;
  shuffleQuestions: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestQuestion {
  id: number;
  testId: number;
  questionNumber: number;
  questionText: string;
  questionType: 'mcq' | 'short_answer' | 'long_answer' | 'true_false';
  correctAnswer?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  options?: QuestionOption[];
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionOption {
  id: number;
  questionId: number;
  optionNumber: number;
  optionText: string;
  isCorrect: boolean;
  createdAt?: string;
}

export interface TestSubmission {
  id: number;
  testId: number;
  studentId: number;
  classId: number;
  startedAt?: string;
  submittedAt?: string;
  score?: number;
  totalScore: number;
  percentage?: number;
  status: 'in_progress' | 'submitted' | 'graded';
  answers?: TestAnswer[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TestAnswer {
  id: number;
  submissionId: number;
  questionId: number;
  studentAnswer?: string;
  pointsAwarded?: number;
  isCorrect?: boolean;
  gradedAt?: string;
  gradedBy?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// API Request/Response Types
export interface CreateSyllabusRequest {
  classId: number;
  subjectId: number;
  title: string;
  description?: string;
  topics: Array<{
    topicNumber: number;
    title: string;
    description?: string;
  }>;
}

export interface CreateTestRequest {
  classId: number;
  subjectId: number;
  title: string;
  description?: string;
  instructions?: string;
  durationMinutes?: number;
  passingScore?: number;
  testType: 'manual' | 'ai_generated';
  questions: TestQuestion[];
  startTime?: string;
  endTime?: string;
}

export interface GenerateQuizFromPDFRequest {
  classId: number;
  subjectId: number;
  syllabusId?: number;
  title: string;
  pdfUrl: string;
  numQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questionTypes: ('mcq' | 'short_answer' | 'long_answer')[];
}

export interface SubmitTestAnswersRequest {
  testId: number;
  studentId: number;
  answers: Array<{
    questionId: number;
    answer: string | number;
  }>;
}
