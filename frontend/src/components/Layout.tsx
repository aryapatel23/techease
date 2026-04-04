import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  FileText, 
  BarChart3, 
  Calendar, 
  BookOpen, 
  Layers,
  ClipboardList,
  LogOut, 
  Menu, 
  X,
  Search,
  ArrowRight
} from 'lucide-react';
import { classAPI, studentAPI } from '../services/api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useToast } from './ui/ToastContext';

interface SearchResult {
  id: number;
  label: string;
  subtitle: string;
  path: string;
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [searching, setSearching] = React.useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  React.useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const loadResults = async () => {
      try {
        setSearching(true);
        const [studentsRes, classesRes] = await Promise.all([
          studentAPI.getAll({ search: debouncedQuery }),
          classAPI.getAll()
        ]);

        const studentMatches: SearchResult[] = (studentsRes.data.students || [])
          .slice(0, 4)
          .map((student: any) => ({
            id: student.id,
            label: `${student.firstName} ${student.lastName}`,
            subtitle: student.className ? `${student.className} • Roll ${student.rollNumber || '-'}` : 'Student',
            path: '/students'
          }));

        const classMatches: SearchResult[] = (classesRes.data.classes || [])
          .filter((cls: any) => {
            const fullName = `${cls.name} ${cls.grade} ${cls.section}`.toLowerCase();
            return fullName.includes(debouncedQuery.toLowerCase());
          })
          .slice(0, 4)
          .map((cls: any) => ({
            id: cls.id,
            label: cls.name,
            subtitle: `Grade ${cls.grade} ${cls.section}`,
            path: '/classes'
          }));

        setResults([...studentMatches, ...classMatches]);
      } catch (error) {
        setResults([]);
      } finally {
        setSearching(false);
      }
    };

    void loadResults();
  }, [debouncedQuery]);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['teacher', 'student', 'admin'] },
    { path: '/students', label: 'Students', icon: Users, roles: ['teacher', 'admin'] },
    { path: '/classes', label: 'Classes', icon: BookOpen, roles: ['teacher', 'admin'] },
    { path: '/attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['teacher', 'admin'] },
    { path: '/grades', label: 'Grades', icon: FileText, roles: ['teacher', 'admin'] },
    { path: '/timetable', label: 'Timetable', icon: Calendar, roles: ['teacher', 'student', 'admin'] },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['teacher', 'admin'] },
    { path: '/syllabus', label: 'Syllabus', icon: Layers, roles: ['teacher', 'student', 'admin'] },
    { path: '/tests', label: 'Tests', icon: ClipboardList, roles: ['teacher', 'student', 'admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(user?.role || '')
  );

  const resolvePath = (path: string) => (user?.role === 'student' ? `/student${path}` : path);

  const visibleMenuItems = filteredMenuItems.filter((item) => {
    if (user?.role === 'student') {
      return ['/dashboard', '/timetable', '/grades', '/syllabus', '/tests'].includes(item.path);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/85 backdrop-blur-xl">
        <div className="page-shell">
          <div className="flex h-20 items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-1 rounded-2xl p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-xl font-bold text-brand-700 sm:text-2xl"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-sm font-bold text-white shadow-premium">
                  T
                </span>
                <span className="hidden sm:inline">TeachEase</span>
              </button>
            </div>

            <div className="relative hidden w-full max-w-xl items-center md:flex">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="input-base pl-10"
                placeholder="Global search students or classes"
              />
              {(query || searching || results.length > 0) && (
                <div className="absolute left-0 top-14 w-full rounded-3xl border border-slate-200 bg-white p-2 shadow-lifted">
                  {searching ? (
                    <p className="px-2 py-4 text-center text-sm text-slate-500">Searching...</p>
                  ) : results.length > 0 ? (
                    <div className="space-y-1">
                      {results.map((result) => (
                        <button
                          key={`${result.path}-${result.id}`}
                          type="button"
                          onClick={() => {
                            navigate(result.path);
                            setQuery('');
                            setResults([]);
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-slate-50"
                        >
                          <span>
                            <span className="block text-sm font-semibold text-slate-800">{result.label}</span>
                            <span className="block text-xs text-slate-500">{result.subtitle}</span>
                          </span>
                          <ArrowRight className="h-4 w-4 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="px-2 py-4 text-center text-sm text-slate-500">No matches found</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right md:block">
                <p className="text-sm font-semibold text-slate-700">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[1px] lg:hidden"
          />
        ) : null}

        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed bottom-0 left-0 top-20 z-40 w-[86vw] max-w-sm overflow-y-auto border-r border-slate-100 bg-white/95 px-3 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:w-80 lg:max-w-none lg:translate-x-0`}
        >
          <nav className="mt-5 px-2">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const targetPath = resolvePath(item.path);
              const isActive = location.pathname === targetPath;
              return (
                <Link
                  key={item.path}
                  to={targetPath}
                  onClick={() => setSidebarOpen(false)}
                  className={`${
                    isActive
                      ? 'border border-brand-100 bg-brand-50 text-brand-700 shadow-sm'
                      : 'border border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50'
                  } group mb-1 flex items-center rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Quick actions</p>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/attendance');
                    showToast('Ready to mark attendance', 'info');
                  }}
                  className="btn-secondary justify-start"
                >
                  Mark attendance
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/grades');
                    showToast('Open gradebook tools', 'info');
                  }}
                  className="btn-secondary justify-start"
                >
                  Update grades
                </button>
              </div>
            </div>
          </nav>
        </aside>

        <main className="flex-1 px-3 py-4 sm:px-4 md:px-6 md:py-6">
          <div className="page-shell">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
