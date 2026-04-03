import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import SearchInput from '../components/ui/SearchInput';
import { classAPI, syllabusAPI, testAPI, studentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/ToastContext';
import { Class, Subject } from '../types';

interface TestRow {
  id: number;
  title: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'archived';
  start_time?: string;
  end_time?: string;
  total_questions?: number;
  subject_name?: string;
}

interface DraftOption {
  optionNumber: number;
  optionText: string;
  isCorrect: boolean;
}

interface DraftQuestion {
  questionNumber: number;
  questionText: string;
  questionType: 'mcq' | 'short_answer' | 'long_answer' | 'true_false';
  correctAnswer: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  options: DraftOption[];
}

const emptyQuestion = (questionNumber: number): DraftQuestion => ({
  questionNumber,
  questionText: '',
  questionType: 'mcq',
  correctAnswer: '',
  points: 1,
  difficulty: 'medium',
  options: [
    { optionNumber: 1, optionText: '', isCorrect: false },
    { optionNumber: 2, optionText: '', isCorrect: true },
    { optionNumber: 3, optionText: '', isCorrect: false },
    { optionNumber: 4, optionText: '', isCorrect: false }
  ]
});

const Tests: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [topics, setTopics] = useState<Array<{ id: number; title: string }>>([]);
  const [tests, setTests] = useState<TestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showAiCreate, setShowAiCreate] = useState(false);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfFileData, setPdfFileData] = useState('');
  const [form, setForm] = useState({
    classId: '',
    subjectId: '',
    title: '',
    description: '',
    instructions: '',
    startTime: '',
    endTime: ''
  });
  const [aiForm, setAiForm] = useState({
    classId: '',
    subjectId: '',
    topicId: '',
    title: '',
    pdfUrl: '',
    numQuestions: 10,
    difficulty: 'medium'
  });
  const [questionDrafts, setQuestionDrafts] = useState<DraftQuestion[]>([emptyQuestion(1)]);

  useEffect(() => {
    const init = async () => {
      try {
        const [classRes, subjectRes] = await Promise.all([classAPI.getAll(), classAPI.getSubjects()]);
        setClasses(classRes.data.classes || []);
        setSubjects(subjectRes.data.subjects || []);
        if (user?.role === 'student') {
          const studentRes = await studentAPI.getById(user.id);
          const classId = studentRes.data.student?.classId;
          if (classId) {
            setSelectedClass(String(classId));
          }
        }
      } catch {
        showToast('Unable to load classes or subjects', 'error');
      }
    };
    void init();
  }, [showToast]);

  useEffect(() => {
    const loadTopics = async () => {
      if (!aiForm.classId || !aiForm.subjectId) {
        setTopics([]);
        return;
      }
      try {
        const response = await syllabusAPI.getByClass({ classId: Number(aiForm.classId), subjectId: Number(aiForm.subjectId) });
        const syllabus = response.data.syllabus;
        setTopics(Array.isArray(syllabus?.topics) ? syllabus.topics : []);
      } catch {
        setTopics([]);
      }
    };
    void loadTopics();
  }, [aiForm.classId, aiForm.subjectId]);

  useEffect(() => {
    const loadTests = async () => {
      if (!selectedClass) {
        setTests([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await testAPI.getByClass({ classId: Number(selectedClass) });
        setTests(res.data.tests || []);
      } catch {
        showToast('Unable to load tests', 'error');
      } finally {
        setLoading(false);
      }
    };
    void loadTests();
  }, [selectedClass, showToast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return tests;
    return tests.filter((t) => (`${t.title} ${t.subject_name || ''} ${t.status}`).toLowerCase().includes(q));
  }, [search, tests]);

  const updateDraftQuestion = (index: number, patch: Partial<DraftQuestion>) => {
    setQuestionDrafts((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  const updateDraftOption = (questionIndex: number, optionIndex: number, patch: Partial<DraftOption>) => {
    setQuestionDrafts((current) => current.map((item, itemIndex) => {
      if (itemIndex !== questionIndex) return item;
      const options = item.options.map((option, currentIndex) => currentIndex === optionIndex ? { ...option, ...patch } : option);
      return { ...item, options };
    }));
  };

  const addDraftQuestion = () => {
    setQuestionDrafts((current) => [...current, emptyQuestion(current.length + 1)]);
  };

  const removeDraftQuestion = (index: number) => {
    setQuestionDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index).map((item, itemIndex) => ({ ...item, questionNumber: itemIndex + 1 })));
  };

  const createManualTest = async () => {
    if (!form.classId || !form.subjectId || !form.title) {
      showToast('Class, subject, and title are required', 'error');
      return;
    }
    if (questionDrafts.length === 0) {
      showToast('Add at least one question', 'error');
      return;
    }

    const validQuestions = questionDrafts.filter((question) => question.questionText.trim());
    if (validQuestions.length === 0) {
      showToast('Add question text before saving', 'error');
      return;
    }

    try {
      const testRes = await testAPI.create({
        classId: Number(form.classId),
        subjectId: Number(form.subjectId),
        title: form.title,
        description: form.description,
        instructions: form.instructions,
        testType: 'manual',
        totalQuestions: validQuestions.length,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        showAnswers: false,
        shuffleQuestions: true
      });

      const testId = testRes.data.test.id;
      for (const question of validQuestions) {
        await testAPI.addQuestion(testId, {
          questionNumber: question.questionNumber,
          questionText: question.questionText,
          questionType: question.questionType,
          correctAnswer: question.correctAnswer,
          points: question.points,
          difficulty: question.difficulty,
          options: question.options
        });
      }

      await testAPI.publish(testId, {
        status: form.startTime ? 'scheduled' : 'active',
        startTime: form.startTime || null,
        endTime: form.endTime || null
      });

      showToast('Test created successfully', 'success');
      setShowCreate(false);
      setForm({ classId: '', subjectId: '', title: '', description: '', instructions: '', startTime: '', endTime: '' });
      setQuestionDrafts([emptyQuestion(1)]);
      if (selectedClass) {
        const listRes = await testAPI.getByClass({ classId: Number(selectedClass) });
        setTests(listRes.data.tests || []);
      }
    } catch {
      showToast('Unable to create test', 'error');
    }
  };

  const createAiTest = async () => {
    if (!aiForm.classId || !aiForm.subjectId || !aiForm.title || !pdfFileData) {
      showToast('Please fill required AI test fields and upload notes/PDF', 'error');
      return;
    }

    try {
      await testAPI.generateFromPDF({
        classId: Number(aiForm.classId),
        subjectId: Number(aiForm.subjectId),
        syllabusTopicId: aiForm.topicId ? Number(aiForm.topicId) : null,
        title: aiForm.title,
        pdfUrl: pdfFileData,
        pdfFileName,
        numQuestions: Number(aiForm.numQuestions),
        difficulty: aiForm.difficulty,
        questionTypes: ['mcq', 'short_answer']
      });
      showToast('AI quiz generated and scheduled', 'success');
      setShowAiCreate(false);
      setAiForm({ classId: '', subjectId: '', topicId: '', title: '', pdfUrl: '', numQuestions: 10, difficulty: 'medium' });
      setPdfFileName('');
      setPdfFileData('');
      if (selectedClass) {
        const listRes = await testAPI.getByClass({ classId: Number(selectedClass) });
        setTests(listRes.data.tests || []);
      }
    } catch {
      showToast('AI quiz generation failed. Check Gemini API key and uploaded file.', 'error');
    }
  };

  const handlePdfUpload = async (file: File | null) => {
    if (!file) return;
    setPdfFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPdfFileData(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const canTakeTestNow = (test: TestRow) => {
    const now = Date.now();
    const start = test.start_time ? new Date(test.start_time).getTime() : null;
    const end = test.end_time ? new Date(test.end_time).getTime() : null;
    if (!start || !end) return test.status === 'active';
    return now >= start && now <= end;
  };

  return (
    <Layout>
      <div>
        <PageHeader
          title="Tests & Quiz System"
          description="Create manual tests, generate AI quizzes from uploaded notes, and run scheduled assessments"
          actions={
            (user?.role === 'teacher' || user?.role === 'admin') ? (
              <>
                <button className="btn-secondary" onClick={() => setShowAiCreate(true)}>Generate Quiz from PDF</button>
                <button className="btn-primary" onClick={() => setShowCreate(true)}>Create Manual Test</button>
              </>
            ) : null
          }
        />

        <div className="card mb-6 grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
          <select className="input-base" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">Select class</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name} - Grade {cls.grade} {cls.section}</option>
            ))}
          </select>
          <SearchInput value={search} onChange={setSearch} placeholder="Search tests" />
        </div>

        {loading ? (
          <LoadingState message="Loading tests..." />
        ) : !selectedClass ? (
          <EmptyState title="Select a class" description="Choose a class to load tests and quizzes." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No tests yet" description="Create a manual test or generate one from uploaded notes." />
        ) : (
          <div className="space-y-3">
            {filtered.map((test) => (
              <div key={test.id} className="card flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{test.title}</h3>
                  <p className="text-sm text-slate-600">{test.subject_name || 'Subject'} • {test.total_questions || 0} questions</p>
                  {test.start_time ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Window: {new Date(test.start_time).toLocaleString()} - {test.end_time ? new Date(test.end_time).toLocaleString() : 'No end'}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">{test.status}</span>
                  {user?.role === 'student' && canTakeTestNow(test) ? (
                    <Link to={`/student/tests/${test.id}/attempt`} className="btn-primary">Start Test</Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Create Manual Test</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <select className="input-base" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                  <option value="">Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name} - Grade {cls.grade} {cls.section}</option>
                  ))}
                </select>
                <select className="input-base" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                  <option value="">Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>
                  ))}
                </select>
                <input className="input-base md:col-span-2" placeholder="Test title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <input className="input-base md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <textarea className="input-base md:col-span-2 min-h-[90px]" placeholder="Instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
                <label className="text-sm text-slate-600">Start Time</label>
                <input className="input-base" type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                <label className="text-sm text-slate-600">End Time</label>
                <input className="input-base" type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>

              <div className="mt-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Questions</h3>
                <button className="btn-secondary" onClick={addDraftQuestion}>Add Question</button>
              </div>

              <div className="mt-4 space-y-4">
                {questionDrafts.map((question, questionIndex) => (
                  <div key={questionIndex} className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-semibold text-slate-800">Question {question.questionNumber}</p>
                      {questionDrafts.length > 1 && (
                        <button className="text-sm text-rose-600" onClick={() => removeDraftQuestion(questionIndex)}>Remove</button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <textarea className="input-base min-h-[80px]" placeholder="Question text" value={question.questionText} onChange={(e) => updateDraftQuestion(questionIndex, { questionText: e.target.value })} />
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <select className="input-base" value={question.questionType} onChange={(e) => updateDraftQuestion(questionIndex, { questionType: e.target.value as DraftQuestion['questionType'] })}>
                          <option value="mcq">MCQ</option>
                          <option value="short_answer">Short Answer</option>
                          <option value="long_answer">Long Answer</option>
                          <option value="true_false">True / False</option>
                        </select>
                        <select className="input-base" value={question.difficulty} onChange={(e) => updateDraftQuestion(questionIndex, { difficulty: e.target.value as DraftQuestion['difficulty'] })}>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                        <input className="input-base" type="number" min={1} value={question.points} onChange={(e) => updateDraftQuestion(questionIndex, { points: Number(e.target.value) })} placeholder="Points" />
                        <input className="input-base" value={question.correctAnswer} onChange={(e) => updateDraftQuestion(questionIndex, { correctAnswer: e.target.value })} placeholder="Correct answer" />
                      </div>

                      {question.questionType === 'mcq' && (
                        <div className="grid grid-cols-1 gap-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={option.optionNumber} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2">
                              <input type="radio" name={`correct-${questionIndex}`} checked={option.isCorrect} onChange={() => {
                                const updatedOptions = question.options.map((item, itemIndex) => ({ ...item, isCorrect: itemIndex === optionIndex }));
                                updateDraftQuestion(questionIndex, { options: updatedOptions });
                              }} />
                              <input className="input-base flex-1" value={option.optionText} onChange={(e) => updateDraftOption(questionIndex, optionIndex, { optionText: e.target.value })} placeholder={`Option ${option.optionNumber}`} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn-primary" onClick={createManualTest}>Create Test</button>
              </div>
            </div>
          </div>
        )}

        {showAiCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Generate Quiz from PDF/Notes</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <select className="input-base" value={aiForm.classId} onChange={(e) => setAiForm({ ...aiForm, classId: e.target.value, topicId: '' })}>
                  <option value="">Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name} - Grade {cls.grade} {cls.section}</option>
                  ))}
                </select>
                <select className="input-base" value={aiForm.subjectId} onChange={(e) => setAiForm({ ...aiForm, subjectId: e.target.value })}>
                  <option value="">Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>
                  ))}
                </select>
                <select className="input-base md:col-span-2" value={aiForm.topicId} onChange={(e) => setAiForm({ ...aiForm, topicId: e.target.value })} disabled={!topics.length}>
                  <option value="">Select topic (optional)</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>{topic.title}</option>
                  ))}
                </select>
                <input className="input-base md:col-span-2" placeholder="Quiz title" value={aiForm.title} onChange={(e) => setAiForm({ ...aiForm, title: e.target.value })} />
                <input
                  className="input-base md:col-span-2"
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => void handlePdfUpload(event.target.files?.[0] || null)}
                />
                {pdfFileName ? <p className="md:col-span-2 text-sm text-slate-600">Selected file: {pdfFileName}</p> : null}
                <input className="input-base" type="number" min={5} max={50} placeholder="Number of questions" value={aiForm.numQuestions} onChange={(e) => setAiForm({ ...aiForm, numQuestions: Number(e.target.value) })} />
                <select className="input-base" value={aiForm.difficulty} onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button className="btn-secondary" onClick={() => setShowAiCreate(false)}>Cancel</button>
                <button className="btn-primary" onClick={createAiTest}>Generate</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Tests;
