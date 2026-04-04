import React, { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { gradeAPI, classAPI, studentAPI } from '../services/api';
import { Grade, Class, ExamType, Subject } from '../types';
import { Plus, Pencil, Save, X, Download, FileDown, Wand2, AlertTriangle, Sparkles, Upload, Loader2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import SearchInput from '../components/ui/SearchInput';
import { useToast } from '../components/ui/ToastContext';
import { exportToCSV, exportTableAsPrintPDF } from '../utils/export';
import { useAuth } from '../context/AuthContext';

const Grades: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showQuickEntryModal, setShowQuickEntryModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [reportStudentId, setReportStudentId] = useState('');
  const [reportData, setReportData] = useState<any | null>(null);
  const [examTypeFilter, setExamTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [riskPackLoading, setRiskPackLoading] = useState(false);
  const [bulkCommonMarks, setBulkCommonMarks] = useState('');
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const [quickEntryStudentIds, setQuickEntryStudentIds] = useState<number[] | null>(null);
  const [coverageSubjectId, setCoverageSubjectId] = useState('');
  const [coverageExamTypeId, setCoverageExamTypeId] = useState('');
  const [bulkFormData, setBulkFormData] = useState({
    subjectId: '1',
    examTypeId: '',
    maxMarks: '100',
    examDate: new Date().toISOString().split('T')[0]
  });
  const [bulkMarks, setBulkMarks] = useState<Record<number, string>>({});
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [inlineForm, setInlineForm] = useState({ marksObtained: '', maxMarks: '', examDate: '' });
  const tableRef = useRef<HTMLTableElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    studentId: '',
    classId: '',
    subjectId: '1',
    examTypeId: '',
    marksObtained: '',
    maxMarks: '',
    examDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchClasses();
    fetchExamTypes();
    fetchSubjects();
    if (user?.role === 'student') {
      void studentAPI.getById(user.id).then((response) => {
        const classId = response.data.student?.classId;
        if (classId) {
          setSelectedClass(String(classId));
          setFormData((current) => ({ ...current, classId: String(classId) }));
        }
      }).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchGrades();
      fetchStudents();
    } else {
      setGrades([]);
      setStudents([]);
      setReportStudentId('');
      setReportData(null);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && reportStudentId) {
      void generateReport();
    }
  }, [reportStudentId, selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await classAPI.getAll();
      setClasses(response.data.classes);
    } catch (error) {
      showToast('Error fetching classes', 'error');
    }
  };

  const fetchExamTypes = async () => {
    try {
      const response = await gradeAPI.getExamTypes();
      setExamTypes(response.data.examTypes);
    } catch (error) {
      showToast('Error fetching exam types', 'error');
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await classAPI.getSubjects();
      const list = response.data.subjects || [];
      setSubjects(list);

      if (list.length > 0) {
        const firstSubjectId = String(list[0].id);
        setFormData((current) => ({ ...current, subjectId: current.subjectId || firstSubjectId }));
        setBulkFormData((current) => ({ ...current, subjectId: current.subjectId || firstSubjectId }));
      }
    } catch (error) {
      showToast('Error fetching subjects', 'error');
    }
  };

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await gradeAPI.getByClass({ classId: selectedClass });
      const normalized = (response.data.grades || []).map((grade: any) => {
        const marksObtained = Number(grade.marksObtained ?? grade.marks_obtained ?? grade.marksobtained ?? 0);
        const maxMarks = Number(grade.maxMarks ?? grade.max_marks ?? grade.maxmarks ?? 0);
        return {
          ...grade,
          id: Number(grade.id),
          firstName: grade.firstName ?? grade.first_name ?? grade.firstname ?? '',
          lastName: grade.lastName ?? grade.last_name ?? grade.lastname ?? '',
          subjectName: grade.subjectName ?? grade.subject_name ?? grade.subjectname ?? '-',
          examTypeName: grade.examTypeName ?? grade.exam_type_name ?? grade.examtypename ?? '-',
          marksObtained,
          maxMarks,
          grade: grade.grade ?? '-'
        };
      });
      setGrades(normalized);
    } catch (error) {
      showToast('Error fetching grades', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentAPI.getAll({ classId: selectedClass });
      const normalized = (response.data.students || []).map((student: any) => ({
        id: Number(student.id ?? student.studentId ?? student.student_id),
        firstName: student.firstName ?? student.first_name ?? 'Student',
        lastName: student.lastName ?? student.last_name ?? '',
        rollNumber: student.rollNumber ?? student.roll_number ?? null
      }));
      setStudents(normalized);
    } catch (error) {
      showToast('Error fetching students', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (Number(formData.maxMarks) <= 0) {
        showToast('Max marks must be greater than zero', 'error');
        return;
      }
      if (Number(formData.marksObtained) < 0 || Number(formData.marksObtained) > Number(formData.maxMarks)) {
        showToast('Marks obtained must be between 0 and max marks', 'error');
        return;
      }

      await gradeAPI.add({
        ...formData,
        studentId: parseInt(formData.studentId),
        classId: parseInt(formData.classId),
        subjectId: parseInt(formData.subjectId),
        examTypeId: parseInt(formData.examTypeId),
        marksObtained: parseFloat(formData.marksObtained),
        maxMarks: parseFloat(formData.maxMarks)
      });
      setShowModal(false);
      fetchGrades();
      resetForm();
      showToast('Grade added successfully', 'success');
    } catch (error) {
      showToast('Error adding grade', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startInlineEdit = (grade: Grade) => {
    setEditingRowId(grade.id);
    setInlineForm({
      marksObtained: String(grade.marksObtained),
      maxMarks: String(grade.maxMarks),
      examDate: grade.examDate ? grade.examDate.slice(0, 10) : new Date().toISOString().split('T')[0]
    });
  };

  const saveInlineEdit = async (gradeId: number) => {
    try {
      await gradeAPI.update(gradeId, {
        marksObtained: Number(inlineForm.marksObtained),
        maxMarks: Number(inlineForm.maxMarks),
        examDate: inlineForm.examDate,
        remarks: null
      });
      setEditingRowId(null);
      showToast('Grade updated', 'success');
      await fetchGrades();
    } catch (error) {
      showToast('Error updating grade', 'error');
    }
  };

  const generateReport = async () => {
    if (!selectedClass || !reportStudentId) {
      showToast('Select class and student to generate report', 'error');
      return;
    }

    try {
      const response = await gradeAPI.getReportCard({ studentId: Number(reportStudentId), classId: Number(selectedClass) });
      const pick = (source: any, keys: string[], fallback: any = '') => {
        for (const key of keys) {
          if (source?.[key] !== undefined && source?.[key] !== null) {
            return source[key];
          }
        }
        return fallback;
      };

      const normalized = {
        student: {
          firstName: pick(response.data?.student, ['firstName', 'first_name', 'firstname'], ''),
          lastName: pick(response.data?.student, ['lastName', 'last_name', 'lastname'], ''),
          rollNumber: pick(response.data?.student, ['rollNumber', 'roll_number', 'rollnumber'], 'No Roll')
        },
        overallStats: {
          overallPercentage: Number(pick(response.data?.overallStats, ['overallPercentage', 'overall_percentage', 'overallpercentage'], 0)),
          totalExams: Number(pick(response.data?.overallStats, ['totalExams', 'total_exams', 'totalexams'], 0)),
          totalMarksObtained: Number(pick(response.data?.overallStats, ['totalMarksObtained', 'total_marks_obtained', 'totalmarksobtained'], 0)),
          totalMaxMarks: Number(pick(response.data?.overallStats, ['totalMaxMarks', 'total_max_marks', 'totalmaxmarks'], 0))
        },
        subjectWiseStats: (response.data?.subjectWiseStats || []).map((row: any) => ({
          subjectName: pick(row, ['subjectName', 'subject_name', 'subjectname'], '-'),
          averagePercentage: Number(pick(row, ['averagePercentage', 'average_percentage', 'averagepercentage'], 0)),
          totalExams: Number(pick(row, ['totalExams', 'total_exams', 'totalexams'], 0))
        })),
        grades: (response.data?.grades || []).map((row: any) => ({
          subjectName: pick(row, ['subjectName', 'subject_name', 'subjectname'], '-'),
          examTypeName: pick(row, ['examTypeName', 'exam_type_name', 'examtypename'], '-'),
          marksObtained: Number(pick(row, ['marksObtained', 'marks_obtained', 'marksobtained'], 0)),
          maxMarks: Number(pick(row, ['maxMarks', 'max_marks', 'maxmarks'], 0)),
          percentage: Number(pick(row, ['percentage'], 0))
        }))
      };

      setReportData(normalized);
      showToast('Report generated', 'success');
    } catch (error) {
      setReportData(null);
      showToast('Unable to generate report', 'error');
    }
  };

  const exportReportCSV = () => {
    if (!reportData) {
      return;
    }

    exportToCSV(
      `report-card-${reportData.student.rollNumber || reportStudentId}`,
      ['Subject', 'Exam', 'Marks', 'Percentage'],
      (reportData.grades || []).map((row: any) => [
        row.subjectName || '-',
        row.examTypeName || '-',
        `${row.marksObtained || 0}/${row.maxMarks || 0}`,
        `${Number(row.percentage || 0).toFixed(2)}%`
      ])
    );
    showToast('Report exported as CSV', 'success');
  };

  const exportReportPDF = () => {
    if (!reportRef.current) {
      return;
    }
    exportTableAsPrintPDF('TeachEase - Report Card', reportRef.current.outerHTML);
    showToast('Print dialog opened for report export', 'info');
  };

  const openInterventionStudent = (studentId: number) => {
    setReportStudentId(String(studentId));
    setTimeout(() => {
      reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const exportInterventionPack = async () => {
    if (!selectedClass || interventionQueue.length === 0) {
      showToast('No intervention queue data to export', 'error');
      return;
    }

    setRiskPackLoading(true);
    try {
      const rows = await Promise.all(
        interventionQueue.map(async (student) => {
          try {
            const response = await gradeAPI.getReportCard({
              studentId: student.studentId,
              classId: Number(selectedClass)
            });

            const overallRaw = response.data?.overallStats?.overallPercentage
              ?? response.data?.overallStats?.overall_percentage
              ?? response.data?.overallStats?.overallpercentage
              ?? student.average;

            return {
              name: student.name,
              priority: student.priority,
              average: Number(student.average).toFixed(2),
              overall: Number(overallRaw || 0).toFixed(2),
              action: student.action
            };
          } catch {
            return {
              name: student.name,
              priority: student.priority,
              average: Number(student.average).toFixed(2),
              overall: Number(student.average).toFixed(2),
              action: student.action
            };
          }
        })
      );

      exportToCSV(
        `intervention-queue-${new Date().toISOString().slice(0, 10)}`,
        ['Student', 'Priority', 'Class Avg %', 'Report Overall %', 'Recommended Action'],
        rows.map((row) => [row.name, row.priority, `${row.average}%`, `${row.overall}%`, row.action])
      );

      showToast('Intervention pack exported', 'success');
    } catch {
      showToast('Failed to export intervention pack', 'error');
    } finally {
      setRiskPackLoading(false);
    }
  };

  const filteredGrades = useMemo(
    () => {
      const studentScopedGrades = reportStudentId
        ? grades.filter((grade) => Number(grade.studentId) === Number(reportStudentId))
        : grades;

      const examScopedGrades = examTypeFilter === 'all'
        ? studentScopedGrades
        : studentScopedGrades.filter((grade) => String(grade.examTypeId) === examTypeFilter);

      return examScopedGrades.filter((grade) =>
        `${grade.firstName} ${grade.lastName} ${grade.subjectName} ${grade.examTypeName}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    },
    [grades, search, reportStudentId, examTypeFilter]
  );

  const averageScore = useMemo(() => {
    if (filteredGrades.length === 0) {
      return 0;
    }
    const total = filteredGrades.reduce((sum, item) => {
      const marks = Number(item.marksObtained) || 0;
      const max = Number(item.maxMarks) || 1;
      return sum + (max > 0 ? (marks / max) * 100 : 0);
    }, 0);
    return isNaN(total) ? 0 : total / filteredGrades.length;
  }, [filteredGrades]);

  const atRiskCount = useMemo(() => {
    return filteredGrades.filter((item) => {
      const max = Number(item.maxMarks) || 0;
      if (max <= 0) {
        return false;
      }
      return (Number(item.marksObtained) / max) * 100 < 40;
    }).length;
  }, [filteredGrades]);

  const interventionQueue = useMemo(() => {
    const grouped = new Map<number, { studentId: number; name: string; total: number; count: number; latest?: string }>();

    grades.forEach((item) => {
      const max = Number(item.maxMarks) || 0;
      if (max <= 0) {
        return;
      }

      const percentage = (Number(item.marksObtained) / max) * 100;
      const existing = grouped.get(Number(item.studentId));

      if (existing) {
        existing.total += percentage;
        existing.count += 1;
        if (item.examDate && (!existing.latest || item.examDate > existing.latest)) {
          existing.latest = item.examDate;
        }
      } else {
        grouped.set(Number(item.studentId), {
          studentId: Number(item.studentId),
          name: `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Student',
          total: percentage,
          count: 1,
          latest: item.examDate
        });
      }
    });

    return Array.from(grouped.values())
      .map((row) => {
        const average = row.count > 0 ? row.total / row.count : 0;
        let priority: 'High' | 'Medium' | 'Low' = 'Low';
        let action = 'Monitor weekly and maintain current plan.';

        if (average < 40) {
          priority = 'High';
          action = 'Immediate parent contact + 1:1 remedial session this week.';
        } else if (average < 60) {
          priority = 'Medium';
          action = 'Assign targeted practice and review progress in next class.';
        }

        return {
          ...row,
          average,
          priority,
          action
        };
      })
      .filter((row) => row.average < 60)
      .sort((a, b) => a.average - b.average)
      .slice(0, 5);
  }, [grades]);

  const quickEntryCoverage = useMemo(() => {
    const total = Object.keys(bulkMarks).length;
    if (total === 0) {
      return 0;
    }
    const filled = Object.values(bulkMarks).filter((mark) => mark !== '' && !Number.isNaN(Number(mark))).length;
    return Math.round((filled / total) * 100);
  }, [bulkMarks]);

  const quickEntryStudents = useMemo(() => {
    if (!quickEntryStudentIds || quickEntryStudentIds.length === 0) {
      return students;
    }
    const idSet = new Set(quickEntryStudentIds.map((id) => Number(id)));
    return students.filter((student) => idSet.has(Number(student.id)));
  }, [students, quickEntryStudentIds]);

  const coverageStats = useMemo(() => {
    if (!selectedClass || !coverageSubjectId || !coverageExamTypeId) {
      return { gradedCount: 0, pendingCount: students.length, pendingStudents: [] as any[] };
    }

    const gradedStudentIds = new Set(
      grades
        .filter(
          (grade) =>
            Number(grade.classId) === Number(selectedClass) &&
            Number(grade.subjectId) === Number(coverageSubjectId) &&
            Number(grade.examTypeId) === Number(coverageExamTypeId)
        )
        .map((grade) => Number(grade.studentId))
    );

    const pendingStudents = students.filter((student) => !gradedStudentIds.has(Number(student.id)));
    return {
      gradedCount: Math.max(students.length - pendingStudents.length, 0),
      pendingCount: pendingStudents.length,
      pendingStudents
    };
  }, [selectedClass, coverageSubjectId, coverageExamTypeId, grades, students]);

  const handleCSVExport = () => {
    exportToCSV(
      `grades-${new Date().toISOString().slice(0, 10)}`,
      ['Student', 'Subject', 'Exam Type', 'Marks', 'Grade', 'Percentage'],
      filteredGrades.map((grade) => [
        `${grade.firstName} ${grade.lastName}`,
        grade.subjectName,
        grade.examTypeName,
        `${grade.marksObtained}/${grade.maxMarks}`,
        grade.grade,
        `${((grade.marksObtained / grade.maxMarks) * 100).toFixed(2)}%`
      ])
    );
    showToast('Grades exported as CSV', 'success');
  };

  const handlePDFExport = () => {
    if (!tableRef.current) {
      return;
    }
    exportTableAsPrintPDF('TeachEase - Grades', tableRef.current.outerHTML);
    showToast('Print dialog opened for PDF export', 'info');
  };

  const draftPercentage =
    Number(formData.maxMarks) > 0
      ? ((Number(formData.marksObtained || 0) / Number(formData.maxMarks)) * 100).toFixed(2)
      : '0.00';

  const resetForm = () => {
    setFormData({
      studentId: '',
      classId: selectedClass,
      subjectId: '1',
      examTypeId: '',
      marksObtained: '',
      maxMarks: '',
      examDate: new Date().toISOString().split('T')[0]
    });
  };

  const openQuickEntry = () => {
    const initialMarks: Record<number, string> = {};
    students.forEach((student) => {
      initialMarks[Number(student.id)] = '';
    });
    setQuickEntryStudentIds(null);
    setBulkMarks(initialMarks);
    setBulkCommonMarks('');
    setBulkPasteText('');
    setBulkFormData({
      subjectId: subjects.length > 0 ? String(subjects[0].id) : '1',
      examTypeId: '',
      maxMarks: '100',
      examDate: new Date().toISOString().split('T')[0]
    });
    setShowQuickEntryModal(true);
  };

  const openQuickEntryForPending = () => {
    if (!coverageSubjectId || !coverageExamTypeId) {
      showToast('Select subject and exam type in Missing Grades Assistant', 'error');
      return;
    }

    if (coverageStats.pendingStudents.length === 0) {
      showToast('Great! No pending students for this subject and exam type.', 'success');
      return;
    }

    const pendingIds = coverageStats.pendingStudents.map((student) => Number(student.id));
    const initialMarks: Record<number, string> = {};
    pendingIds.forEach((id) => {
      initialMarks[id] = '';
    });

    setQuickEntryStudentIds(pendingIds);
    setBulkMarks(initialMarks);
    setBulkCommonMarks('');
    setBulkPasteText('');
    setBulkFormData({
      subjectId: coverageSubjectId,
      examTypeId: coverageExamTypeId,
      maxMarks: '100',
      examDate: new Date().toISOString().split('T')[0]
    });
    setShowQuickEntryModal(true);
  };

  const applyCommonMarks = () => {
    if (bulkCommonMarks === '') {
      return;
    }
    setBulkMarks((current) => {
      const next = { ...current };
      Object.keys(next).forEach((studentId) => {
        if (!next[Number(studentId)]) {
          next[Number(studentId)] = bulkCommonMarks;
        }
      });
      return next;
    });
  };

  const saveQuickEntry = async () => {
    if (!selectedClass || !bulkFormData.examTypeId || !bulkFormData.subjectId) {
      showToast('Select class, subject and exam type for quick entry', 'error');
      return;
    }

    const maxMarksNumber = Number(bulkFormData.maxMarks);
    if (!maxMarksNumber || maxMarksNumber <= 0) {
      showToast('Max marks must be greater than zero', 'error');
      return;
    }

    const rawEntries = Object.entries(bulkMarks)
      .filter(([, marks]) => marks !== '' && !Number.isNaN(Number(marks)))
      .map(([studentId, marks]) => ({
        studentId: Number(studentId),
        marksObtained: Number(marks)
      }));

    const invalidEntries = rawEntries.filter((entry) => entry.marksObtained < 0 || entry.marksObtained > maxMarksNumber);
    const entries = rawEntries.filter((entry) => entry.marksObtained >= 0 && entry.marksObtained <= maxMarksNumber);

    if (rawEntries.length === 0) {
      showToast('Enter at least one mark to save', 'error');
      return;
    }

    if (invalidEntries.length > 0) {
      showToast(`${invalidEntries.length} rows skipped: marks must be between 0 and ${maxMarksNumber}`, 'error');
    }

    if (entries.length === 0) {
      return;
    }

    setBulkSaving(true);
    try {
      const results = await Promise.allSettled(
        entries.map((entry) =>
          gradeAPI.add({
            studentId: entry.studentId,
            classId: Number(selectedClass),
            subjectId: Number(bulkFormData.subjectId),
            examTypeId: Number(bulkFormData.examTypeId),
            marksObtained: entry.marksObtained,
            maxMarks: maxMarksNumber,
            examDate: bulkFormData.examDate
          })
        )
      );

      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const failedCount = entries.length - successCount;

      if (successCount > 0) {
        showToast(`Quick entry saved: ${successCount} records`, 'success');
      }
      if (failedCount > 0) {
        showToast(`${failedCount} records failed. Please retry those students.`, 'error');
      }

      await fetchGrades();
      if (failedCount === 0) {
        setShowQuickEntryModal(false);
      }
    } catch (error) {
      showToast('Quick entry failed', 'error');
    } finally {
      setBulkSaving(false);
    }
  };

  const applyPastedMarks = () => {
    if (!bulkPasteText.trim()) {
      showToast('Paste marks first (one row per student)', 'error');
      return;
    }

    const values = bulkPasteText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const firstCell = line.split(/\t|,|;/)[0].trim();
        const parsed = Number(firstCell);
        return Number.isNaN(parsed) ? null : parsed;
      });

    const validNumbers = values.filter((value): value is number => value !== null);
    if (validNumbers.length === 0) {
      showToast('No valid numeric marks found in pasted data', 'error');
      return;
    }

    setBulkMarks((current) => {
      const next = { ...current };
      quickEntryStudents.forEach((student, index) => {
        if (validNumbers[index] !== undefined) {
          next[Number(student.id)] = String(validNumbers[index]);
        }
      });
      return next;
    });

    showToast(`Applied pasted marks to ${Math.min(validNumbers.length, quickEntryStudents.length)} students`, 'success');
  };

  const parseMarksFromOcrText = (text: string, maxMarks: number) => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const extracted: number[] = [];

    for (const line of lines) {
      const tokens = line.match(/\d+(?:\.\d+)?/g);
      if (!tokens || tokens.length === 0) {
        continue;
      }

      const parsed = tokens.map((token) => Number(token)).filter((value) => !Number.isNaN(value));
      const candidate = parsed
        .slice()
        .reverse()
        .find((value) => value >= 0 && value <= maxMarks);

      if (candidate !== undefined) {
        extracted.push(candidate);
      }
    }

    if (extracted.length > 0) {
      return extracted;
    }

    const fallback = (text.match(/\d+(?:\.\d+)?/g) || [])
      .map((token) => Number(token))
      .filter((value) => !Number.isNaN(value) && value >= 0 && value <= maxMarks);

    return fallback;
  };

  const handleOcrUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (quickEntryStudents.length === 0) {
      showToast('No students available in this quick-entry view', 'error');
      return;
    }

    const maxMarks = Number(bulkFormData.maxMarks) || 100;

    try {
      setOcrLoading(true);
      setOcrStatus('Reading image...');

      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');

      setOcrStatus('Extracting text using OCR...');
      const result = await worker.recognize(file);
      await worker.terminate();

      const recognized = result?.data?.text || '';
      const marks = parseMarksFromOcrText(recognized, maxMarks);

      if (marks.length === 0) {
        showToast('No valid marks detected from image. Try a clearer image.', 'error');
        return;
      }

      setBulkMarks((current) => {
        const next = { ...current };
        quickEntryStudents.forEach((student, index) => {
          if (marks[index] !== undefined) {
            next[Number(student.id)] = String(marks[index]);
          }
        });
        return next;
      });

      showToast(`OCR applied marks for ${Math.min(marks.length, quickEntryStudents.length)} students`, 'success');
    } catch {
      showToast('OCR failed. Please retry with a clearer image.', 'error');
    } finally {
      setOcrLoading(false);
      setOcrStatus('');
    }
  };

  return (
    <Layout>
      <div>
        <PageHeader
          title="Grades Management"
          description="Teacher-first workflow with quick grade entry, inline updates, and one-click report generation"
          actions={user?.role === 'student' ? null : (
            <>
              <button
                type="button"
                className="btn-primary"
                onClick={openQuickEntry}
                disabled={!selectedClass || students.length === 0}
              >
                <Wand2 size={16} className="mr-2" />
                Quick Entry
              </button>
              <button type="button" className="btn-secondary" onClick={handleCSVExport} disabled={!selectedClass || filteredGrades.length === 0}>
                <Download size={16} className="mr-2" />
                Export CSV
              </button>
              <button type="button" className="btn-secondary" onClick={handlePDFExport} disabled={!selectedClass || filteredGrades.length === 0}>
                <FileDown size={16} className="mr-2" />
                Export PDF
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                disabled={!selectedClass}
                className="btn-primary"
              >
                <Plus size={18} className="mr-2" />
                Add Grade
              </button>
            </>
          )}
        />

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card p-4 lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setReportStudentId('');
                setReportData(null);
              }}
              className="input-base md:w-1/2"
              disabled={user?.role === 'student'}
            >
              <option value="">Choose a class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - Grade {cls.grade} {cls.section}
                </option>
              ))}
            </select>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl bg-slate-100 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Entries</p>
                <p className="text-xl font-bold text-slate-900">{filteredGrades.length}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 md:col-span-2">
                <p className="text-xs uppercase tracking-wide text-emerald-700">Average score</p>
                <p className="text-xl font-bold text-emerald-800">{averageScore.toFixed(2)}%</p>
              </div>
              <div className="rounded-xl bg-rose-50 p-3">
                <p className="text-xs uppercase tracking-wide text-rose-700">At-risk records</p>
                <p className="text-xl font-bold text-rose-800">{atRiskCount}</p>
              </div>
            </div>
          </div>

          {user?.role !== 'student' && (
          <div className="card p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Report Generation</h3>
            <select
              value={reportStudentId}
              onChange={(e) => setReportStudentId(e.target.value)}
              className="input-base mt-3"
            >
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName} ({student.rollNumber || 'No Roll'})
                </option>
              ))}
            </select>
            <button type="button" className="btn-primary mt-3 w-full" onClick={generateReport}>
              Generate Report
            </button>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Missing Grades Assistant</h4>
              <div className="mt-2 space-y-2">
                <select
                  value={coverageSubjectId}
                  onChange={(e) => setCoverageSubjectId(e.target.value)}
                  className="input-base"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={`coverage-sub-${subject.id}`} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
                <select
                  value={coverageExamTypeId}
                  onChange={(e) => setCoverageExamTypeId(e.target.value)}
                  className="input-base"
                >
                  <option value="">Select Exam Type</option>
                  {examTypes.map((type) => (
                    <option key={`coverage-exam-${type.id}`} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-emerald-50 p-2">
                  <p className="text-[11px] uppercase tracking-wide text-emerald-700">Graded</p>
                  <p className="text-lg font-bold text-emerald-800">{coverageStats.gradedCount}</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-2">
                  <p className="text-[11px] uppercase tracking-wide text-amber-700">Pending</p>
                  <p className="text-lg font-bold text-amber-800">{coverageStats.pendingCount}</p>
                </div>
              </div>

              <button type="button" className="btn-secondary mt-3 w-full" onClick={openQuickEntryForPending}>
                Open Quick Entry For Pending
              </button>
            </div>
          </div>
          )}
        </div>

        {selectedClass && (
          <div className="card">
            <div className="space-y-3 border-b border-slate-200 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="md:col-span-2">
                  <SearchInput value={search} onChange={setSearch} placeholder="Search by student, subject, or exam type" />
                </div>
                <select
                  className="input-base"
                  value={examTypeFilter}
                  onChange={(e) => setExamTypeFilter(e.target.value)}
                >
                  <option value="all">All exam types</option>
                  {examTypes.map((type) => (
                    <option key={type.id} value={String(type.id)}>{type.name}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-500">
                Workflow tip: Use Quick Entry for full-class marking, then use inline edit only for corrections.
              </p>
            </div>

            {user?.role !== 'student' && interventionQueue.length > 0 && (
              <div className="border-b border-slate-200 bg-amber-50/70 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-amber-900">
                    <AlertTriangle size={18} />
                    <h4 className="text-sm font-semibold uppercase tracking-wide">Intervention Queue (Top 5 At Risk)</h4>
                  </div>
                  <button type="button" className="btn-secondary" onClick={exportInterventionPack} disabled={riskPackLoading}>
                    <Sparkles size={14} className="mr-2" />
                    {riskPackLoading ? 'Preparing...' : 'Export Intervention Pack'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {interventionQueue.map((student) => (
                    <div key={student.studentId} className="rounded-xl border border-amber-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                          <p className="text-xs text-slate-600">Avg: {student.average.toFixed(2)}% • Priority: {student.priority}</p>
                        </div>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          onClick={() => openInterventionStudent(student.studentId)}
                        >
                          Open Report
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-slate-700">{student.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <LoadingState compact message="Loading grades..." />
            ) : filteredGrades.length === 0 ? (
              <div className="p-4">
                <EmptyState title="No grades found" description="Add your first grade or adjust filters." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table ref={tableRef} className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Exam Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Marks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Percentage
                    </th>
                      {user?.role !== 'student' && (
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                          Actions
                        </th>
                      )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredGrades.map((grade) => {
                    const isEditing = editingRowId === grade.id;
                    const percentage = grade.maxMarks > 0 ? ((grade.marksObtained / grade.maxMarks) * 100).toFixed(2) : '0.00';
                    const isAtRisk = Number(percentage) < 40;
                    return (
                    <tr
                      key={grade.id}
                      className={`cursor-pointer transition hover:bg-slate-50 ${isAtRisk ? 'bg-rose-50/60' : ''}`}
                      onClick={() => setReportStudentId(String(grade.studentId))}
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                        {grade.firstName} {grade.lastName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {grade.subjectName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {grade.examTypeName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <input
                              type="number"
                              value={inlineForm.marksObtained}
                              onChange={(e) => setInlineForm({ ...inlineForm, marksObtained: e.target.value })}
                              className="w-14 rounded-lg border border-slate-300 px-2 py-1 text-xs sm:w-20 sm:text-sm"
                            />
                            <span className="text-xs sm:text-sm">/</span>
                            <input
                              type="number"
                              value={inlineForm.maxMarks}
                              onChange={(e) => setInlineForm({ ...inlineForm, maxMarks: e.target.value })}
                              className="w-14 rounded-lg border border-slate-300 px-2 py-1 text-xs sm:w-20 sm:text-sm"
                            />
                          </div>
                        ) : (
                          `${grade.marksObtained} / ${grade.maxMarks}`
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800">
                          {grade.grade}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                        {isEditing
                          ? `${((Number(inlineForm.marksObtained || 0) / Number(inlineForm.maxMarks || 1)) * 100).toFixed(2)}%`
                          : `${percentage}%`}
                      </td>
                      {user?.role !== 'student' && (
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => saveInlineEdit(grade.id)} className="rounded-lg border border-emerald-200 p-2 text-emerald-700 hover:bg-emerald-50">
                              <Save size={15} />
                            </button>
                            <button onClick={() => setEditingRowId(null)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100">
                              <X size={15} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startInlineEdit(grade)} className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100">
                            <Pencil size={15} />
                          </button>
                        )}
                      </td>
                      )}
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {reportData && (
          <div ref={reportRef} className="card mt-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="text-xl font-bold text-slate-900">Report Card Preview</h3>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary" onClick={exportReportCSV}>Export Report CSV</button>
                <button type="button" className="btn-secondary" onClick={exportReportPDF}>Export Report PDF</button>
              </div>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {reportData.student.firstName} {reportData.student.lastName} • Roll {reportData.student.rollNumber}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-slate-100 p-3">
                <p className="text-xs uppercase text-slate-500">Overall %</p>
                <p className="text-xl font-bold text-slate-900">{Number(reportData.overallStats.overallPercentage || 0).toFixed(2)}%</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs uppercase text-emerald-700">Total Exams</p>
                <p className="text-xl font-bold text-emerald-900">{reportData.overallStats.totalExams}</p>
              </div>
              <div className="rounded-xl bg-sky-50 p-3">
                <p className="text-xs uppercase text-sky-700">Total Marks</p>
                <p className="text-xl font-bold text-sky-900">
                  {Number(reportData.overallStats.totalMarksObtained || 0).toFixed(2)}/{Number(reportData.overallStats.totalMaxMarks || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Subject-wise Summary</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Avg %</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Exams</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(reportData.subjectWiseStats || []).map((row: any, idx: number) => (
                        <tr key={`${row.subjectName || 'subject'}-${idx}`}>
                          <td className="px-4 py-2 text-sm text-slate-800">{row.subjectName}</td>
                          <td className="px-4 py-2 text-sm text-slate-800">{Number(row.averagePercentage || 0).toFixed(2)}%</td>
                          <td className="px-4 py-2 text-sm text-slate-800">{row.totalExams}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Exam Details</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Exam</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Marks</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(reportData.grades || []).map((row: any, idx: number) => (
                        <tr key={`${row.subjectName || 'exam'}-${idx}`}>
                          <td className="px-4 py-2 text-sm text-slate-800">{row.subjectName}</td>
                          <td className="px-4 py-2 text-sm text-slate-800">{row.examTypeName}</td>
                          <td className="px-4 py-2 text-sm text-slate-800">{Number(row.marksObtained || 0).toFixed(2)}/{Number(row.maxMarks || 0).toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm text-slate-800">{Number(row.percentage || 0).toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-bold">Add Grade</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Student</label>
                  <select
                    required
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="input-base"
                  >
                    <option value="">Select Student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} ({student.rollNumber || 'No Roll'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
                  <select
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="input-base"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Exam Type</label>
                  <select
                    required
                    value={formData.examTypeId}
                    onChange={(e) => setFormData({ ...formData, examTypeId: e.target.value })}
                    className="input-base"
                  >
                    <option value="">Select Exam Type</option>
                    {examTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Marks Obtained</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.marksObtained}
                      onChange={(e) =>
                        setFormData({ ...formData, marksObtained: e.target.value })
                      }
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Max Marks</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.maxMarks}
                      onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                      className="input-base"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
                  Auto calculation: <strong>{draftPercentage}%</strong>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Exam Date</label>
                  <input
                    type="date"
                    required
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    className="input-base"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex-1"
                  >
                    {saving ? 'Saving...' : 'Add Grade'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showQuickEntryModal && user?.role !== 'student' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Quick Grade Entry</h2>
                  <p className="text-sm text-slate-600">Enter marks for the whole class in one pass to reduce teacher workload.</p>
                </div>
                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                  Coverage: {quickEntryCoverage}%
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
                  <select
                    value={bulkFormData.subjectId}
                    onChange={(e) => setBulkFormData((current) => ({ ...current, subjectId: e.target.value }))}
                    className="input-base"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Exam Type</label>
                  <select
                    value={bulkFormData.examTypeId}
                    onChange={(e) => setBulkFormData((current) => ({ ...current, examTypeId: e.target.value }))}
                    className="input-base"
                  >
                    <option value="">Select Exam Type</option>
                    {examTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Max Marks</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={bulkFormData.maxMarks}
                    onChange={(e) => setBulkFormData((current) => ({ ...current, maxMarks: e.target.value }))}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Exam Date</label>
                  <input
                    type="date"
                    value={bulkFormData.examDate}
                    onChange={(e) => setBulkFormData((current) => ({ ...current, examDate: e.target.value }))}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Apply Common Marks</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={bulkCommonMarks}
                      onChange={(e) => setBulkCommonMarks(e.target.value)}
                      className="input-base"
                    />
                    <button type="button" className="btn-secondary" onClick={applyCommonMarks}>Apply</button>
                  </div>
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="mb-1 block text-sm font-medium text-slate-700">Paste Marks (Spreadsheet Style)</label>
                <p className="mb-2 text-xs text-slate-500">Paste one mark per line from Excel or Sheets. Marks map to the student order shown below.</p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                  <textarea
                    value={bulkPasteText}
                    onChange={(e) => setBulkPasteText(e.target.value)}
                    rows={3}
                    className="input-base"
                    placeholder={`78\n65\n91\n...`}
                  />
                  <button type="button" className="btn-secondary md:self-start" onClick={applyPastedMarks}>
                    Apply Pasted Marks
                  </button>
                </div>

                <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-3">
                  <p className="text-sm font-medium text-slate-700">OCR from marks-sheet image</p>
                  <p className="mt-1 text-xs text-slate-500">Upload a clear photo/screenshot of marks. The system extracts numbers and fills rows automatically.</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <label className="btn-secondary cursor-pointer">
                      {ocrLoading ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Upload size={14} className="mr-2" />}
                      {ocrLoading ? 'Processing...' : 'Upload Image For OCR'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleOcrUpload}
                        className="hidden"
                        disabled={ocrLoading}
                      />
                    </label>
                    {ocrStatus ? <span className="text-xs text-slate-500">{ocrStatus}</span> : null}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Student</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Roll</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Marks</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {quickEntryStudents.map((student) => {
                      const marksValue = bulkMarks[Number(student.id)] ?? '';
                      const maxMarks = Number(bulkFormData.maxMarks) || 0;
                      const percentage = marksValue !== '' && maxMarks > 0
                        ? ((Number(marksValue) / maxMarks) * 100).toFixed(2)
                        : '-';

                      return (
                        <tr key={student.id}>
                          <td className="px-4 py-2 text-sm text-slate-900">{student.firstName} {student.lastName}</td>
                          <td className="px-4 py-2 text-sm text-slate-600">{student.rollNumber || 'No Roll'}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={marksValue}
                              onChange={(e) => {
                                const value = e.target.value;
                                setBulkMarks((current) => ({ ...current, [Number(student.id)]: value }));
                              }}
                              className="w-32 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                              placeholder="Enter marks"
                            />
                          </td>
                          <td className="px-4 py-2 text-sm font-semibold text-slate-800">{percentage === '-' ? '-' : `${percentage}%`}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowQuickEntryModal(false)}
                  className="btn-secondary"
                  disabled={bulkSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveQuickEntry}
                  className="btn-primary"
                  disabled={bulkSaving}
                >
                  {bulkSaving ? 'Saving...' : 'Save All Entered Marks'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Grades;
