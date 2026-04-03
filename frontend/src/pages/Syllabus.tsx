import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import SearchInput from '../components/ui/SearchInput';
import { classAPI, syllabusAPI, studentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/ToastContext';
import { Class, Subject } from '../types';

interface SyllabusTopic {
  id: number;
  topicNumber: number;
  title: string;
  description?: string;
  status: 'pending' | 'ongoing' | 'covered';
}

interface SyllabusRow {
  id: number;
  title: string;
  subject_name: string;
  class_name: string;
  grade: string;
  section: string;
  coverage_percentage: number;
  topics?: SyllabusTopic[];
}

const statusStyles: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  ongoing: 'bg-amber-100 text-amber-700',
  covered: 'bg-emerald-100 text-emerald-700'
};

const Syllabus: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [items, setItems] = useState<SyllabusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    classId: '',
    subjectId: '',
    title: '',
    description: '',
    academicYear: '2024-2025',
    topicsCsv: ''
  });

  useEffect(() => {
    const init = async () => {
      try {
        const [classRes, subjectRes] = await Promise.all([
          classAPI.getAll(),
          classAPI.getSubjects()
        ]);
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
        showToast('Failed to load classes', 'error');
      }
    };
    void init();
  }, [showToast]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (user?.role === 'teacher' || user?.role === 'admin') {
          const res = await syllabusAPI.getTeacherSyllabuses();
          setItems(res.data.syllabuses || []);
        } else if (selectedClass) {
          const res = await syllabusAPI.getStudentView({ classId: Number(selectedClass) });
          setItems(res.data.syllabuses || []);
        } else {
          setItems([]);
        }
      } catch {
        showToast('Failed to load syllabus', 'error');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [selectedClass, showToast, user?.role]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((item) => (`${item.title} ${item.subject_name} ${item.class_name} ${item.grade} ${item.section}`).toLowerCase().includes(q));
  }, [items, search]);

  const selectedClassSubjects = useMemo(() => {
    if (!createForm.classId) {
      return subjects;
    }
    return subjects;
  }, [createForm.classId, subjects]);

  const updateTopicStatus = async (topicId: number, status: 'pending' | 'ongoing' | 'covered') => {
    try {
      await syllabusAPI.updateTopicStatus(topicId, { status });
      showToast('Topic status updated', 'success');
      const res = await syllabusAPI.getTeacherSyllabuses();
      setItems(res.data.syllabuses || []);
    } catch {
      showToast('Unable to update topic status', 'error');
    }
  };

  const createSyllabus = async () => {
    if (!createForm.classId || !createForm.subjectId || !createForm.title) {
      showToast('Class, subject and title are required', 'error');
      return;
    }

    const topics = createForm.topicsCsv
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((title, index) => ({ topicNumber: index + 1, title }));

    try {
      await syllabusAPI.create({
        classId: Number(createForm.classId),
        subjectId: Number(createForm.subjectId),
        title: createForm.title,
        description: createForm.description,
        academicYear: createForm.academicYear,
        topics
      });
      showToast('Syllabus created', 'success');
      setShowCreate(false);
      setCreateForm({
        classId: '',
        subjectId: '',
        title: '',
        description: '',
        academicYear: '2024-2025',
        topicsCsv: ''
      });
      const res = await syllabusAPI.getTeacherSyllabuses();
      setItems(res.data.syllabuses || []);
    } catch {
      showToast('Failed to create syllabus', 'error');
    }
  };

  return (
    <Layout>
      <div>
        <PageHeader
          title="Syllabus Tracker"
          description="Manage subject topics and track what is pending, ongoing, and covered"
          actions={
            (user?.role === 'teacher' || user?.role === 'admin') ? (
              <button className="btn-primary" onClick={() => setShowCreate(true)}>Create Syllabus</button>
            ) : null
          }
        />

        <div className="card mb-6 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search syllabus by class, subject, title" />
          {user?.role === 'student' && (
            <select className="input-base" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="">Select class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name} - Grade {cls.grade} {cls.section}</option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <LoadingState message="Loading syllabus..." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No syllabus found" description="Create one to start tracking curriculum coverage." />
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => (
              <div className="card p-5" key={item.id}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.subject_name} • {item.class_name} • Grade {item.grade} {item.section}</p>
                  </div>
                  <div className="rounded-full bg-teal-50 text-teal-700 px-3 py-1 text-sm font-semibold">
                    Coverage {Math.round(Number(item.coverage_percentage || 0))}%
                  </div>
                </div>

                {Array.isArray(item.topics) && item.topics.length > 0 ? (
                  <div className="space-y-2">
                    {item.topics.map((topic) => (
                      <div key={topic.id} className="flex flex-col md:flex-row md:items-center justify-between gap-2 rounded-xl border border-slate-200 p-3">
                        <div>
                          <p className="font-medium text-slate-800">{topic.topicNumber}. {topic.title}</p>
                          {topic.description ? <p className="text-sm text-slate-500">{topic.description}</p> : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusStyles[topic.status]}`}>{topic.status}</span>
                          {(user?.role === 'teacher' || user?.role === 'admin') && (
                            <select
                              className="input-base"
                              value={topic.status}
                              onChange={(e) => updateTopicStatus(topic.id, e.target.value as 'pending' | 'ongoing' | 'covered')}
                            >
                              <option value="pending">Pending</option>
                              <option value="ongoing">Ongoing</option>
                              <option value="covered">Covered</option>
                            </select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No topics added yet.</p>
                )}
              </div>
            ))}
          </div>
        )}

        {showCreate && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Create Syllabus</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select className="input-base" value={createForm.classId} onChange={(e) => setCreateForm({ ...createForm, classId: e.target.value })}>
                  <option value="">Select class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name} - Grade {cls.grade} {cls.section}</option>
                  ))}
                </select>
                <select className="input-base" value={createForm.subjectId} onChange={(e) => setCreateForm({ ...createForm, subjectId: e.target.value })}>
                  <option value="">Select subject</option>
                  {selectedClassSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>
                  ))}
                </select>
                <input className="input-base md:col-span-2" placeholder="Syllabus title" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} />
                <input className="input-base md:col-span-2" placeholder="Description" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
                <textarea
                  className="input-base md:col-span-2 min-h-[140px]"
                  placeholder="Enter one topic per line"
                  value={createForm.topicsCsv}
                  onChange={(e) => setCreateForm({ ...createForm, topicsCsv: e.target.value })}
                />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn-primary" onClick={createSyllabus}>Create</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Syllabus;
