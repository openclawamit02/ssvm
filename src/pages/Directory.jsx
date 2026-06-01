import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Pagination from '../components/Pagination';
import { Search, Plus, Loader2, X, User, Phone, MapPin, Calendar, BookOpen, Ruler, Droplets, Heart, Users, GraduationCap, BarChart2, AlertTriangle } from 'lucide-react';
import { DirectoryApiService } from '../services/SchoolApiService';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CLASSES = ['LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
const PAGE_SIZE = 10;

const Directory = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('students');
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);
  const [showDashboard, setShowDashboard] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [classFilter, setClassFilter] = useState('');
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const initialStudentState = { name: '', fatherName: '', studentClass: '', rollNumber: '', address: '', dob: '', bloodGroup: '', gender: 'Male', fatherMobile: '', status: 'Active' };
  const initialTeacherState = { name: '', fatherName: '', gender: 'Male', joiningDate: '', address: '', qualification: '', bloodGroup: '', mobile: '', subjects: '', status: 'Active' };
  const [formData, setFormData] = useState(initialStudentState);

  useEffect(() => {
    fetchData();
  }, [activeTab, page, pageSize, searchTerm, classFilter]);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await (activeTab === 'students' 
        ? DirectoryApiService.getStudents(searchTerm, page - 1, pageSize, classFilter)
        : DirectoryApiService.getTeachers(searchTerm, page - 1, pageSize));
      setData(result.content);
      setTotalItems(result.totalElements);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to load directory items');
    }
    finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try {
      const s = await DirectoryApiService.getSummary();
      setSummary(s);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    setFormData(activeTab === 'students' ? initialStudentState : initialTeacherState);
    setSearchTerm(''); setPage(1); setClassFilter('');
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedPerson) {
        activeTab === 'students' ? await DirectoryApiService.updateStudent(selectedPerson.id, formData) : await DirectoryApiService.updateTeacher(selectedPerson.id, formData);
      } else {
        activeTab === 'students' ? await DirectoryApiService.addStudent(formData) : await DirectoryApiService.addTeacher(formData);
      }
      setShowForm(false); setSelectedPerson(null);
      fetchData();
      fetchSummary();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      activeTab === 'students' ? await DirectoryApiService.deleteStudent(id) : await DirectoryApiService.deleteTeacher(id);
      fetchData();
      fetchSummary();
    } catch (e) { console.error(e); }
  };

  const pagedData = data;

  return (
    <div className="page-container">
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .dir-row:hover{background:rgba(212,175,55,0.04)}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>{t('directory')}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setShowDashboard(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart2 size={16} /> Analytics
          </button>
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setSelectedPerson(null); setFormData(activeTab === 'students' ? initialStudentState : initialTeacherState); }}>
            <Plus size={18} /> {t('add_new')}
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showDashboard && summary && (
        <div style={{ animation: 'fadeIn 0.35s ease-out', marginBottom: '28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            {activeTab === 'students' ? (<>
              <StatCard icon={Users} label="Total Students" value={summary.totalStudents} color="var(--color-mustard-dark)" />
              <StatCard icon={Users} label="Male" value={summary.genderDistribution?.M} color="var(--color-success)" />
              <StatCard icon={Users} label="Female" value={summary.genderDistribution?.F} color="var(--color-danger)" />
              <StatCard icon={Users} label="Active" value={summary.statusCounts?.Active} color="var(--color-mustard)" />
            </>) : (<>
              <StatCard icon={Users} label="Total Teachers" value={summary.totalTeachers} color="var(--color-mustard-dark)" />
              <StatCard icon={BookOpen} label="Subjects Taught" value="Many" color="var(--color-success)" />
            </>)}
          </div>

          {activeTab === 'students' && (
            <div className="glass" style={{ borderRadius: '14px', padding: '16px 20px', marginTop: '14px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '10px' }}>Filter by Class</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {CLASSES.map(c => (
                  <div key={c} onClick={() => { setClassFilter(v => v === c ? '' : c); setPage(1); }}
                    style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                      background: classFilter === c ? 'var(--color-mustard)' : 'rgba(225,173,1,0.08)',
                      color: classFilter === c ? 'white' : 'var(--color-mustard-dark)' }}>
                    {c}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '24px', position: 'relative' }}>
            <button onClick={() => setShowForm(false)} style={{ position: 'absolute', right: '24px', top: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ marginBottom: '24px' }}>{selectedPerson ? t('edit') : t('add_new')} {activeTab === 'students' ? t('students') : t('teachers')}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {activeTab === 'students' ? (<>
                <div className="form-group"><label>{t('name')}</label><input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="form-group"><label>{t('father_name')}</label><input required value={formData.fatherName} onChange={e => setFormData({ ...formData, fatherName: e.target.value })} /></div>
                <div className="form-group"><label>{t('class')}</label>
                  <select required value={formData.class} onChange={e => setFormData({ ...formData, class: e.target.value })}>
                    <option value="">{t('select_class')}</option>
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
                <div className="form-group"><label>{t('father_mobile')}</label><input required type="tel" value={formData.fatherMobile} onChange={e => setFormData({ ...formData, fatherMobile: e.target.value })} /></div>
                <div className="form-group"><label>{t('roll_number')}</label><input value={formData.rollNumber} onChange={e => setFormData({ ...formData, rollNumber: e.target.value })} /></div>
                <div className="form-group"><label>{t('dob')}</label><input required type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} /></div>
                <div className="form-group"><label>{t('gender')}</label>
                  <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                    <option value="Male">{t('male')}</option><option value="Female">{t('female')}</option>
                  </select></div>
                <div className="form-group"><label>{t('blood_group')}</label>
                  <select value={formData.bloodGroup} onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}>
                    <option value="">{t('select_blood_group')}</option>
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select></div>
                <div className="form-group"><label>{t('is_special_abled')}</label>
                  <select value={formData.isSpecialAbled} onChange={e => setFormData({ ...formData, isSpecialAbled: e.target.value })}>
                    <option value="No">{t('no')}</option><option value="Yes">{t('yes')}</option>
                  </select></div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>{t('address')}</label>
                  <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }} /></div>
              </>) : (<>
                <div className="form-group"><label>{t('name')}</label><input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="form-group"><label>{t('father_name')}</label><input required value={formData.fatherName} onChange={e => setFormData({ ...formData, fatherName: e.target.value })} /></div>
                <div className="form-group"><label>{t('gender')}</label>
                  <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                    <option value="Male">{t('male')}</option><option value="Female">{t('female')}</option>
                  </select></div>
                <div className="form-group"><label>{t('joining_date')}</label><input required type="date" value={formData.joiningDate} onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} /></div>
                <div className="form-group"><label>{t('qualification')}</label><input required value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} /></div>
                <div className="form-group"><label>{t('mobile')}</label><input required type="tel" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} /></div>
                <div className="form-group"><label>{t('emergency_number')}</label><input type="tel" value={formData.emergencyNumber} onChange={e => setFormData({ ...formData, emergencyNumber: e.target.value })} /></div>
                <div className="form-group"><label>{t('subjects')}</label><input required value={formData.subjects} onChange={e => setFormData({ ...formData, subjects: e.target.value })} placeholder="e.g. Math, Science" /></div>
                <div className="form-group"><label>{t('blood_group')}</label>
                  <select value={formData.bloodGroup} onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}>
                    <option value="">{t('select_blood_group')}</option>
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select></div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>{t('address')}</label>
                  <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }} /></div>
              </>)}
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{selectedPerson ? t('edit') : t('add_new')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {viewDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass" style={{ width: '90%', maxWidth: '600px', padding: '32px', borderRadius: '24px', position: 'relative' }}>
            <button onClick={() => setViewDetails(null)} style={{ position: 'absolute', right: '24px', top: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '36px', background: 'var(--color-mustard)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '28px', fontWeight: 700 }}>
                {viewDetails.name?.charAt(0)}
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{viewDetails.name}</h2>
                <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{activeTab === 'students' ? `Class ${viewDetails.class}` : viewDetails.subjects}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {[
                { icon: Heart, label: t('father_name'), val: viewDetails.fatherName },
                { icon: Calendar, label: activeTab === 'students' ? t('dob') : t('joining_date'), val: activeTab === 'students' ? viewDetails.dob : viewDetails.joiningDate },
                { icon: Phone, label: activeTab === 'students' ? t('father_mobile') : t('mobile'), val: activeTab === 'students' ? viewDetails.fatherMobile : viewDetails.mobile },
                { icon: Droplets, label: t('blood_group'), val: viewDetails.bloodGroup || 'N/A' },
                { icon: MapPin, label: t('address'), val: viewDetails.address },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '4px' }}>
                    <Icon size={13} /> {label}
                  </label>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setViewDetails(null); setSelectedPerson(viewDetails); setFormData(viewDetails); setShowForm(true); }}>{t('edit')}</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setViewDetails(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Main List Card */}
      <Card padding="0">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['students', 'teachers'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: '8px 18px', borderRadius: '20px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTab === tab ? 'rgba(225,173,1,0.1)' : 'transparent',
                  color: activeTab === tab ? 'var(--color-mustard-dark)' : 'var(--color-text-muted)' }}>
                {t(tab)}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', flex: '1', maxWidth: '360px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input type="text" placeholder={t('search')} value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              style={{ paddingLeft: '38px', width: '100%', padding: '9px 9px 9px 38px', borderRadius: '10px', border: '1px solid var(--color-border)' }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto', minHeight: '200px' }}>
          {error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '8px', color: 'var(--color-danger)' }}>
              <AlertTriangle size={32} />
              <div style={{ fontWeight: 600 }}>{error}</div>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-mustard)' }} />
              <style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
            </div>
          ) : data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}>
              {data.length === 0 ? `No ${activeTab} found.` : t('no_results')}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '14px 20px', color: 'var(--color-text-muted)', fontWeight: 500, fontSize: '13px' }}>{t('name')}</th>
                  <th style={{ padding: '14px 20px', color: 'var(--color-text-muted)', fontWeight: 500, fontSize: '13px' }}>{activeTab === 'students' ? t('class') : t('subjects')}</th>
                  <th style={{ padding: '14px 20px', color: 'var(--color-text-muted)', fontWeight: 500, fontSize: '13px' }}>{activeTab === 'students' ? t('father_name') : t('qualification')}</th>
                  <th style={{ padding: '14px 20px', color: 'var(--color-text-muted)', fontWeight: 500, fontSize: '13px' }}>{activeTab === 'students' ? 'Roll No.' : t('mobile')}</th>
                  <th style={{ padding: '14px 20px', color: 'var(--color-text-muted)', fontWeight: 500, fontSize: '13px' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pagedData.map(person => (
                  <tr key={person.id} className="dir-row" style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(225,173,1,0.12)', color: 'var(--color-mustard-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                          {person.name?.charAt(0)}
                        </div>
                        {person.name}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--color-text-muted)' }}>{activeTab === 'students' ? (person.class || '-') : (person.subjects || '-')}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--color-text-muted)' }}>{activeTab === 'students' ? (person.fatherName || '-') : (person.qualification || '-')}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--color-text-muted)' }}>{activeTab === 'students' ? (person.rollNumber || '-') : (person.mobile || '-')}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-mustard-dark)', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => setViewDetails(person)}>{t('view')}</button>
                        <button style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-mustard-dark)', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => { setSelectedPerson(person); setFormData(person); setShowForm(true); }}>{t('edit')}</button>
                        <button style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-danger)', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => handleDelete(person.id)}>{t('delete')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && data.length > 0 && (
          <div style={{ padding: '0 20px' }}>
            <Pagination currentPage={page} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={ps => { setPageSize(ps); setPage(1); }} />
          </div>
        )}
      </Card>
    </div>
  );
};

export default Directory;
