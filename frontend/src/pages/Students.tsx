import React, { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { studentAPI, classAPI } from '../services/api';
import { Student, Class } from '../types';
import { Plus, CreditCard as Edit, Trash2, Download, FileDown, ArrowUpDown, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useToast } from '../components/ui/ToastContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { exportToCSV, exportTableAsPrintPDF } from '../utils/export';

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'rollNumber'>('rollNumber');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPassword, setBulkPassword] = useState('password123');
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const debouncedSearch = useDebouncedValue(search, 300);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    classId: '',
    rollNumber: ''
  });

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, debouncedSearch, sortBy]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedClass) params.classId = selectedClass;
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await studentAPI.getAll(params);

      const sortedStudents = [...response.data.students].sort((a, b) => {
        if (sortBy === 'rollNumber') {
          return (a.rollNumber || '').localeCompare(b.rollNumber || '');
        }
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      });

      setStudents(sortedStudents);
    } catch (error) {
      showToast('Unable to fetch students right now', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classAPI.getAll();
      setClasses(response.data.classes);
    } catch (error) {
      showToast('Unable to load class filters', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingStudent) {
        await studentAPI.update(editingStudent.id, formData);
        showToast('Student updated successfully', 'success');
      } else {
        await studentAPI.create(formData);
        showToast('Student added successfully', 'success');
      }
      setShowModal(false);
      resetForm();
      fetchStudents();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Error saving student', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) {
      return;
    }

    setDeletingId(confirmDeleteId);
    try {
      await studentAPI.delete(confirmDeleteId);
      showToast('Student deleted', 'success');
      await fetchStudents();
    } catch (error) {
      showToast('Error deleting student', 'error');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      email: student.email,
      password: '',
      firstName: student.firstName,
      lastName: student.lastName,
      phone: student.phone || '',
      classId: student.classId?.toString() || '',
      rollNumber: student.rollNumber || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      classId: '',
      rollNumber: ''
    });
    setEditingStudent(null);
  };

  const filteredSummary = useMemo(
    () => `${students.length} student${students.length === 1 ? '' : 's'} found`,
    [students.length]
  );

  const handleCSVExport = () => {
    exportToCSV(
      `students-${new Date().toISOString().slice(0, 10)}`,
      ['Roll No', 'Name', 'Email', 'Class', 'Phone'],
      students.map((student) => [
        student.rollNumber || '-',
        `${student.firstName} ${student.lastName}`,
        student.email,
        student.className ? `${student.className} - ${student.grade} ${student.section}` : '-',
        student.phone || '-'
      ])
    );
    showToast('Students exported as CSV', 'success');
  };

  const handlePDFExport = () => {
    if (!tableRef.current) {
      return;
    }

    exportTableAsPrintPDF('TeachEase - Students', tableRef.current.outerHTML);
    showToast('Print dialog opened for PDF export', 'info');
  };

  const downloadStudentTemplate = () => {
    exportToCSV(
      'teachEase-student-import-template',
      ['className', 'grade', 'section', 'academicYear', 'roomNumber', 'firstName', 'lastName', 'email', 'phone', 'rollNumber'],
      [
        ['Mathematics A', '10', 'A', '2024-2025', '101', 'Aarav', 'Sharma', 'aarav@example.com', '9876543210', 'A01'],
        ['Mathematics A', '10', 'A', '2024-2025', '101', 'Meera', 'Patel', 'meera@example.com', '9876543211', 'A02']
      ]
    );
    showToast('Student import template downloaded', 'success');
  };

  const normalizeCell = (value: string | undefined) => String(value || '').trim();

  const normalizeCSVHeader = (header: string) =>
    normalizeCell(header)
      .replace(/\uFEFF/g, '')
      .replace(/[\s_-]+/g, '')
      .toLowerCase();

  const getRowValue = (row: Record<string, string>, aliases: string[]) => {
    const keySet = new Set(aliases.map((alias) => normalizeCSVHeader(alias)));
    const matchedKey = Object.keys(row).find((key) => keySet.has(normalizeCSVHeader(key)));
    return matchedKey ? normalizeCell(row[matchedKey]) : '';
  };

  const parseSpreadsheetFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return [] as Record<string, string>[];
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: '',
      raw: false,
      blankrows: false
    });

    return rawRows
      .map((row) => {
        const normalized: Record<string, string> = {};
        Object.entries(row).forEach(([key, value]) => {
          normalized[String(key)] = normalizeCell(String(value ?? ''));
        });
        return normalized;
      })
      .filter((row) => Object.values(row).some((value) => normalizeCell(value) !== ''));
  };

  const splitName = (fullName: string) => {
    const cleaned = normalizeCell(fullName);
    if (!cleaned) {
      return { firstName: '', lastName: '' };
    }

    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: parts[0] };
    }

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    };
  };

  const resolveClassIdForFallback = async (classInfo: {
    name: string;
    grade: string;
    section: string;
    academicYear: string;
    roomNumber: string;
  }) => {
    const name = normalizeCell(classInfo.name);
    const grade = normalizeCell(classInfo.grade);
    const section = normalizeCell(classInfo.section);
    const academicYear = normalizeCell(classInfo.academicYear) || '2024-2025';
    const roomNumber = normalizeCell(classInfo.roomNumber);

    if (!name || !grade || !section) {
      throw new Error('Class details are missing in the file. Add className, grade, and section, or select a class before import.');
    }

    const existingClassesResponse = await classAPI.getAll();
    const existingClass = (existingClassesResponse.data?.classes || []).find((item: any) => {
      return (
        String(item.name || '').trim().toLowerCase() === name.toLowerCase() &&
        String(item.grade || '').trim() === grade &&
        String(item.section || '').trim() === section &&
        String(item.academicYear || '').trim() === academicYear
      );
    });

    if (existingClass?.id) {
      return Number(existingClass.id);
    }

    const createdClassResponse = await classAPI.create({
      name,
      grade,
      section,
      academicYear,
      roomNumber: roomNumber || undefined
    });

    return Number(createdClassResponse.data?.class?.id);
  };

  const fallbackImportStudents = async (params: {
    studentsPayload: Array<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      rollNumber: string;
    }>;
    selectedClassId?: number;
    classInfo: {
      name: string;
      grade: string;
      section: string;
      academicYear: string;
      roomNumber: string;
    };
    defaultPassword: string;
  }) => {
    const passwordToUse = normalizeCell(params.defaultPassword) || 'password123';
    let resolvedClassId = params.selectedClassId;

    if (!resolvedClassId) {
      resolvedClassId = await resolveClassIdForFallback(params.classInfo);
    }

    let createdCount = 0;
    const skipped: Array<{ email: string; reason: string }> = [];

    for (const row of params.studentsPayload) {
      const firstName = normalizeCell(row.firstName);
      const lastName = normalizeCell(row.lastName);
      const email = normalizeCell(row.email);

      if (!firstName || !lastName || !email) {
        skipped.push({ email: email || '-', reason: 'Missing first name, last name, or email' });
        continue;
      }

      try {
        await studentAPI.create({
          firstName,
          lastName,
          email,
          phone: normalizeCell(row.phone),
          rollNumber: normalizeCell(row.rollNumber),
          classId: resolvedClassId,
          password: passwordToUse
        });
        createdCount += 1;
      } catch (error: any) {
        skipped.push({
          email,
          reason: error.response?.data?.message || 'Failed to import student'
        });
      }
    }

    return {
      createdCount,
      skippedCount: skipped.length
    };
  };

  const handleBulkImport = async () => {
    if (!bulkFile) {
      showToast('Please choose a CSV file to import', 'error');
      return;
    }

    try {
      setIsBulkImporting(true);
      const rows = await parseSpreadsheetFile(bulkFile);

      if (rows.length === 0) {
        showToast('The file does not contain readable student rows', 'error');
        return;
      }

      const studentsPayload = rows.map((row) => ({
        className: getRowValue(row, ['className', 'class name']),
        grade: getRowValue(row, ['grade']),
        section: getRowValue(row, ['section']),
        academicYear: getRowValue(row, ['academicYear', 'academic year']) || '2024-2025',
        roomNumber: getRowValue(row, ['roomNumber', 'room number']),
        firstName: getRowValue(row, ['firstName', 'first name']) || splitName(getRowValue(row, ['name', 'studentName', 'student name'])).firstName,
        lastName: getRowValue(row, ['lastName', 'last name']) || splitName(getRowValue(row, ['name', 'studentName', 'student name'])).lastName,
        email: getRowValue(row, ['email']),
        phone: getRowValue(row, ['phone']),
        rollNumber: getRowValue(row, ['rollNumber', 'roll number', 'rollno', 'roll no'])
      })).filter((row) => row.firstName || row.lastName || row.email);

      if (studentsPayload.length === 0) {
        showToast('No valid student rows found. Check headers like firstName/lastName/email or name/email.', 'error');
        return;
      }

      const firstRow = rows[0] || {};
      const fileClassInfo = {
        name: getRowValue(firstRow, ['className', 'class name']),
        grade: getRowValue(firstRow, ['grade']),
        section: getRowValue(firstRow, ['section']),
        academicYear: getRowValue(firstRow, ['academicYear', 'academic year']) || '2024-2025',
        roomNumber: getRowValue(firstRow, ['roomNumber', 'room number'])
      };

      let createdCount = 0;
      let skippedCount = 0;

      try {
        const response = await studentAPI.bulkCreate({
          classId: selectedClass ? Number(selectedClass) : undefined,
          classInfo: selectedClass ? undefined : fileClassInfo,
          defaultPassword: bulkPassword,
          students: studentsPayload
        });

        createdCount = Number(response.data?.createdCount || 0);
        skippedCount = Number(response.data?.skippedCount || 0);
      } catch (error: any) {
        if (error?.response?.status !== 404) {
          throw error;
        }

        const fallbackResult = await fallbackImportStudents({
          studentsPayload,
          selectedClassId: selectedClass ? Number(selectedClass) : undefined,
          classInfo: fileClassInfo,
          defaultPassword: bulkPassword
        });

        createdCount = fallbackResult.createdCount;
        skippedCount = fallbackResult.skippedCount;
      }

      showToast(`Imported ${createdCount} students${skippedCount ? `, skipped ${skippedCount}` : ''}`, 'success');
      setBulkFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchStudents();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Error importing students', 'error');
    } finally {
      setIsBulkImporting(false);
    }
  };

  return (
    <Layout>
      <div>
        <PageHeader
          title="Students"
          description="Manage records, enrollment, and contact details in one place"
          actions={
            <>
              <button type="button" onClick={downloadStudentTemplate} className="btn-secondary">
                <Download size={16} className="mr-2" />
                Download Template
              </button>
              <button type="button" onClick={handleCSVExport} className="btn-secondary">
                <Download size={16} className="mr-2" />
                Export CSV
              </button>
              <button type="button" onClick={handlePDFExport} className="btn-secondary">
                <FileDown size={16} className="mr-2" />
                Export PDF
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="btn-primary"
              >
                <Plus size={18} className="mr-2" />
                Add Student
              </button>
            </>
          }
        />

        <div className="card mb-6">
          <div className="border-b border-slate-200 p-4">
            <div className="mb-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Bulk Student Import</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Download the template, fill it in Excel or CSV, select a class, and upload the file to create students quickly.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={(event) => setBulkFile(event.target.files?.[0] || null)}
                    className="block w-full max-w-xs rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm file:mr-3 file:rounded-xl file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
                  />
                  <input
                    type="text"
                    value={bulkPassword}
                    onChange={(event) => setBulkPassword(event.target.value)}
                    className="input-base w-full max-w-xs"
                    placeholder="Default password"
                  />
                  <button type="button" onClick={handleBulkImport} disabled={isBulkImporting} className="btn-primary whitespace-nowrap">
                    {isBulkImporting ? 'Importing...' : 'Import CSV'}
                  </button>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                File columns supported: className, grade, section, academicYear, roomNumber, firstName, lastName, name, email, phone, rollNumber. CSV and Excel (.xlsx/.xls) are supported. If class is not selected, the class will be created or reused from the file.
              </p>
            </div>

            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search by name, email, or roll number"
                />
              </div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input-base md:w-64"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - Grade {cls.grade} {cls.section}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-secondary md:w-48"
                onClick={() => setSortBy((current) => (current === 'rollNumber' ? 'name' : 'rollNumber'))}
              >
                <ArrowUpDown size={16} className="mr-2" />
                Sort: {sortBy === 'rollNumber' ? 'Roll Number' : 'Name'}
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-600">{filteredSummary}</p>
          </div>

          {loading ? (
            <LoadingState compact message="Loading students..." />
          ) : students.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No students found"
                description="Try changing your filters or add a new student."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table ref={tableRef} className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Roll No.</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {students.map((student) => (
                    <tr key={student.id} className="transition hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-800">{student.rollNumber || '-'}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                        <Link to={`/students/${student.id}`} className="inline-flex items-center gap-2 text-teal-700 hover:underline">
                          {student.firstName} {student.lastName}
                          <Eye size={14} />
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{student.email}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {student.className ? `${student.className} - ${student.grade} ${student.section}` : '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{student.phone || '-'}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(student)}
                            className="rounded-lg border border-slate-200 p-2 text-sky-700 transition hover:bg-sky-50"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(student.id)}
                            className="rounded-lg border border-slate-200 p-2 text-rose-700 transition hover:bg-rose-50"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">First Name</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Last Name</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="input-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-base"
                  />
                </div>

                {!editingStudent && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                    <input
                      type="password"
                      required={!editingStudent}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input-base"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-base"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Class</label>
                    <select
                      value={formData.classId}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                      className="input-base"
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} - {cls.grade} {cls.section}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Roll Number</label>
                    <input
                      type="text"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                      className="input-base"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary flex-1"
                  >
                    {isSaving ? 'Saving...' : editingStudent ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn-secondary flex-1"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={confirmDeleteId !== null}
          title="Delete student?"
          description="This action removes the student record permanently."
          confirmLabel="Delete"
          tone="danger"
          isBusy={deletingId !== null}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={handleDelete}
        />
      </div>
    </Layout>
  );
};

export default Students;
