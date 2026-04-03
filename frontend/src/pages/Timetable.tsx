import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { classAPI, timetableAPI, studentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Class, Subject, Timetable as TimetableType } from '../types';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import { Plus } from 'lucide-react';
import { useToast } from '../components/ui/ToastContext';

const Timetable: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [timetable, setTimetable] = useState<TimetableType[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    dayOfWeek: '1',
    startTime: '09:00',
    endTime: '10:00',
    roomNumber: ''
  });

  const getStudentClassId = async () => {
    const studentRes = await studentAPI.getById(user!.id);
    const student = studentRes.data.student || {};
    return Number(
      student.classId ??
      student.class_id ??
      student.classid ??
      student.enrolledClassId ??
      student.enrolled_class_id ??
      0
    ) || null;
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      if (user?.role === 'teacher') {
        const response = await timetableAPI.getByTeacher();
        setTimetable((response.data.timetable || []).map((item: any) => ({
          ...item,
          dayOfWeek: Number(item.dayOfWeek ?? item.day_of_week),
          startTime: item.startTime ?? item.start_time,
          endTime: item.endTime ?? item.end_time,
          roomNumber: item.roomNumber ?? item.room_number,
          subjectName: item.subjectName ?? item.subject_name,
          className: item.className ?? item.class_name,
          grade: item.grade,
          section: item.section
        })));
      } else if (user?.role === 'student') {
        const classId = await getStudentClassId();
        if (classId) {
          const response = await timetableAPI.getByClass(classId);
          setTimetable((response.data.timetable || []).map((item: any) => ({
            ...item,
            dayOfWeek: Number(item.dayOfWeek ?? item.day_of_week),
            startTime: item.startTime ?? item.start_time,
            endTime: item.endTime ?? item.end_time,
            roomNumber: item.roomNumber ?? item.room_number,
            subjectName: item.subjectName ?? item.subject_name,
            className: item.className ?? item.class_name,
            grade: item.grade,
            section: item.section
          })));
        } else {
          setTimetable([]);
        }
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    if (user?.role !== 'teacher' && user?.role !== 'admin') {
      return;
    }

    try {
      const [classRes, subjectRes] = await Promise.all([
        classAPI.getAll(),
        classAPI.getSubjects()
      ]);
      setClasses(classRes.data.classes || []);
      setSubjects(subjectRes.data.subjects || []);
    } catch {
      showToast('Failed to load class/subject options', 'error');
    }
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.classId || !formData.subjectId) {
      showToast('Class and subject are required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await timetableAPI.create({
        classId: Number(formData.classId),
        subjectId: Number(formData.subjectId),
        teacherId: user?.id,
        dayOfWeek: Number(formData.dayOfWeek),
        startTime: formData.startTime,
        endTime: formData.endTime,
        roomNumber: formData.roomNumber || null
      });

      showToast('Timetable entry added successfully', 'success');
      setShowCreate(false);
      setFormData({
        classId: '',
        subjectId: '',
        dayOfWeek: '1',
        startTime: '09:00',
        endTime: '10:00',
        roomNumber: ''
      });
      await fetchTimetable();
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Unable to add timetable entry', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const groupByDay = () => {
    const grouped: { [key: number]: TimetableType[] } = {};
    timetable.forEach((item) => {
      if (!grouped[item.dayOfWeek]) {
        grouped[item.dayOfWeek] = [];
      }
      grouped[item.dayOfWeek].push(item);
    });
    return grouped;
  };

  const groupedTimetable = groupByDay();

  useEffect(() => {
    void fetchMeta();
  }, [user?.role]);

  if (loading) {
    return (
      <Layout>
        <LoadingState message="Loading timetable..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <PageHeader
          title="My Timetable"
          description="Weekly teaching schedule at a glance"
          actions={
            (user?.role === 'teacher' || user?.role === 'admin') ? (
              <button type="button" className="btn-primary" onClick={() => setShowCreate(true)}>
                <Plus size={16} className="mr-2" />
                Add Manual Slot
              </button>
            ) : null
          }
        />

        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((day) => (
            <div key={day} className="card">
              <div className="px-6 py-4 bg-primary-50 border-b border-primary-100">
                <h2 className="text-xl font-semibold text-primary-900">
                  {getDayName(day)}
                </h2>
              </div>
              <div className="p-6">
                {groupedTimetable[day] && groupedTimetable[day].length > 0 ? (
                  <div className="space-y-3">
                    {groupedTimetable[day]
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {item.subjectName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {item.className} - Grade {item.grade} {item.section}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {item.startTime} - {item.endTime}
                            </p>
                            {item.roomNumber && (
                              <p className="text-sm text-gray-600">Room {item.roomNumber}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <EmptyState title="No classes scheduled" description="Enjoy the free slot or update your timetable." />
                )}
              </div>
            </div>
          ))}
        </div>

        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-slate-900">Add Timetable Entry</h2>
              <form className="mt-4 space-y-4" onSubmit={handleCreateEntry}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Class</label>
                    <select
                      className="input-base"
                      value={formData.classId}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                      required
                    >
                      <option value="">Select class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} - Grade {cls.grade} {cls.section}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
                    <select
                      className="input-base"
                      value={formData.subjectId}
                      onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                      required
                    >
                      <option value="">Select subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Day</label>
                    <select
                      className="input-base"
                      value={formData.dayOfWeek}
                      onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                    >
                      {[1, 2, 3, 4, 5].map((day) => (
                        <option key={day} value={day}>{getDayName(day)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Room</label>
                    <input
                      className="input-base"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      placeholder="e.g. 101"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Start Time</label>
                    <input
                      type="time"
                      className="input-base"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">End Time</label>
                    <input
                      type="time"
                      className="input-base"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Slot'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Timetable;
