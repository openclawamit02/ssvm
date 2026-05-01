import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import { Search, Plus, Loader2, X, User, Phone, MapPin, Calendar, BookOpen, Ruler, Droplets, Heart } from 'lucide-react';
import { StudentService, TeacherService, ClassService } from '../services/db';
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CLASSES = ['LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

const Directory = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('students');
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);

  // Form State
  const initialStudentState = {
    name: '', fatherName: '', class: '', rollNumber: '', address: '', height: '', heightUnit: 'cm',
    dob: '', bloodGroup: '', gender: 'Male', fatherMobile: '', isSpecialAbled: 'No'
  };
  const initialTeacherState = {
    name: '', fatherName: '', gender: 'Male', joiningDate: '', 
    address: '', qualification: '', bloodGroup: '', height: '', heightUnit: 'cm',
    mobile: '', emergencyNumber: '', subjects: ''
  };

  const [formData, setFormData] = useState(initialStudentState);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fetchedData, fetchedClasses] = await Promise.all([
          activeTab === 'students' ? StudentService.getAll() : TeacherService.getAll(),
          ClassService.getAll()
        ]);
        setData(fetchedData);
        setClasses(fetchedClasses);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    setFormData(activeTab === 'students' ? initialStudentState : initialTeacherState);
  }, [activeTab, showForm === false]); // Reset form when tab changes or form closes

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedPerson) {
        if (activeTab === 'students') await StudentService.update(selectedPerson.id, formData);
        else await TeacherService.update(selectedPerson.id, formData);
      } else {
        if (activeTab === 'students') await StudentService.add(formData);
        else await TeacherService.add(formData);
      }
      setShowForm(false);
      setSelectedPerson(null);
      const updatedData = activeTab === 'students' ? await StudentService.getAll() : await TeacherService.getAll();
      setData(updatedData);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredData = data.filter(person => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (person.name && person.name.toLowerCase().includes(term)) ||
      (person.fatherName && person.fatherName.toLowerCase().includes(term)) ||
      (person.rollNumber && person.rollNumber.toString().includes(term)) ||
      (person.mobile && person.mobile.includes(term)) ||
      (person.subjects && person.subjects.toLowerCase().includes(term))
    );
  });

  const handleDelete = async (id) => {
    if (window.confirm(t('confirm_delete'))) {
      try {
        if (activeTab === 'students') await StudentService.delete(id);
        else await TeacherService.delete(id);
        setData(data.filter(d => d.id !== id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleEdit = (person) => {
    setSelectedPerson(person);
    setFormData(person);
    setShowForm(true);
  };

  return (
    <div className="page-container">
      <div className="flex-between" style={{marginBottom: '24px'}}>
        <h1 className="page-title" style={{marginBottom: 0}}>{t('directory')}</h1>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setSelectedPerson(null); setFormData(activeTab === 'students' ? initialStudentState : initialTeacherState); }}>
          <Plus size={18} />
          {t('add_new')}
        </button>
      </div>

      {/* Form Overlay */}
      {showForm && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', 
          alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
        }}>
          <div className="glass" style={{
            width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
            padding: '32px', borderRadius: '24px', position: 'relative'
          }}>
            <button 
              onClick={() => setShowForm(false)} 
              style={{position: 'absolute', right: '24px', top: '24px', background: 'transparent', border: 'none', cursor: 'pointer'}}
            >
              <X size={24} />
            </button>
            <h2 style={{marginBottom: '24px'}}>{selectedPerson ? t('edit') : t('add_new')} {activeTab === 'students' ? t('students') : t('teachers')}</h2>
            
            <form onSubmit={handleSubmit} style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
              {activeTab === 'students' ? (
                <>
                  <div className="form-group">
                    <label>{t('name')}</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>{t('father_name')}</label>
                    <input required value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>{t('class')}</label>
                    <select required value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})}>
                      <option value="">{t('select_class')}</option>
                      {CLASSES.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('father_mobile')}</label>
                    <input required type="tel" value={formData.fatherMobile} onChange={e => setFormData({...formData, fatherMobile: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>{t('roll_number')}</label>
                    <input value={formData.rollNumber} onChange={e => setFormData({...formData, rollNumber: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>{t('dob')}</label>
                    <input required type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>{t('gender')}</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option value="Male">{t('male')}</option>
                      <option value="Female">{t('female')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('blood_group')}</label>
                    <select value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})}>
                      <option value="">{t('select_blood_group')}</option>
                      {BLOOD_GROUPS.map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('height')}</label>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <input type="number" step="0.1" style={{flex: 1}} value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} />
                      <select style={{width: '80px'}} value={formData.heightUnit} onChange={e => setFormData({...formData, heightUnit: e.target.value})}>
                        <option value="cm">{t('cm')}</option>
                        <option value="feet">{t('feet')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>{t('is_special_abled')}</label>
                    <select value={formData.isSpecialAbled} onChange={e => setFormData({...formData, isSpecialAbled: e.target.value})}>
                      <option value="No">{t('no')}</option>
                      <option value="Yes">{t('yes')}</option>
                    </select>
                  </div>
                  <div className="form-group" style={{gridColumn: 'span 2'}}>
                    <label>{t('address')}</label>
                    <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows="2" style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)'}}></textarea>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>{t('name')}</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>{t('father_name')}</label>
                    <input required value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>{t('gender')}</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option value="Male">{t('male')}</option>
                      <option value="Female">{t('female')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('joining_date')}</label>
                    <input required type="date" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>{t('qualification')}</label>
                    <input required value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>{t('mobile')}</label>
                    <input required type="tel" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>{t('emergency_number')}</label>
                    <input required type="tel" value={formData.emergencyNumber} onChange={e => setFormData({...formData, emergencyNumber: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>{t('subjects')}</label>
                    <input required value={formData.subjects} onChange={e => setFormData({...formData, subjects: e.target.value})} placeholder="e.g. Math, Science" />
                  </div>
                  <div className="form-group">
                    <label>{t('blood_group')}</label>
                    <select value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})}>
                      <option value="">{t('select_blood_group')}</option>
                      {BLOOD_GROUPS.map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('height')}</label>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <input type="number" step="0.1" style={{flex: 1}} value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} />
                      <select style={{width: '80px'}} value={formData.heightUnit} onChange={e => setFormData({...formData, heightUnit: e.target.value})}>
                        <option value="cm">{t('cm')}</option>
                        <option value="feet">{t('feet')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group" style={{gridColumn: 'span 2'}}>
                    <label>{t('address')}</label>
                    <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows="2" style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)'}}></textarea>
                  </div>
                </>
              )}
              <div style={{gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px'}}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{selectedPerson ? t('edit') : t('add_new')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Overlay */}
      {viewDetails && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', 
          alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
        }}>
          <div className="glass" style={{
            width: '90%', maxWidth: '600px', padding: '32px', borderRadius: '24px', position: 'relative'
          }}>
            <button 
              onClick={() => setViewDetails(null)} 
              style={{position: 'absolute', right: '24px', top: '24px', background: 'transparent', border: 'none', cursor: 'pointer'}}
            >
              <X size={24} />
            </button>
            <div style={{display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px'}}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '40px', background: 'var(--color-mustard)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
              }}>
                <User size={40} />
              </div>
              <div>
                <h2 style={{margin: 0}}>{viewDetails.name}</h2>
                <p className="text-muted" style={{margin: 0}}>{activeTab === 'students' ? `${t('students')} | ${t('class')} ${viewDetails.class}` : `${t('teachers')} | ${viewDetails.subjects}`}</p>
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
              <div className="detail-item">
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '4px'}}>
                  <Heart size={14} /> {t('father_name')}
                </label>
                <div style={{fontWeight: 600}}>{viewDetails.fatherName}</div>
              </div>
              <div className="detail-item">
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '4px'}}>
                  <Calendar size={14} /> {activeTab === 'students' ? t('dob') : t('joining_date')}
                </label>
                <div style={{fontWeight: 600}}>{activeTab === 'students' ? viewDetails.dob : viewDetails.joiningDate}</div>
              </div>
              <div className="detail-item">
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '4px'}}>
                  <Phone size={14} /> {activeTab === 'students' ? t('father_mobile') : t('mobile')}
                </label>
                <div style={{fontWeight: 600}}>{activeTab === 'students' ? viewDetails.fatherMobile : viewDetails.mobile}</div>
              </div>
              <div className="detail-item">
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '4px'}}>
                  <Droplets size={14} /> {t('blood_group')}
                </label>
                <div style={{fontWeight: 600}}>{viewDetails.bloodGroup || 'N/A'}</div>
              </div>
              <div className="detail-item">
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '4px'}}>
                  <Ruler size={14} /> {t('height')}
                </label>
                <div style={{fontWeight: 600}}>{viewDetails.height ? `${viewDetails.height} ${t(viewDetails.heightUnit || 'cm')}` : 'N/A'}</div>
              </div>
              <div className="detail-item">
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '4px'}}>
                  <MapPin size={14} /> {t('address')}
                </label>
                <div style={{fontWeight: 600}}>{viewDetails.address}</div>
              </div>
              {activeTab === 'students' && (
                <div className="detail-item">
                  <label style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '4px'}}>
                    <BookOpen size={14} /> {t('is_special_abled')}
                  </label>
                  <div style={{fontWeight: 600}}>{viewDetails.isSpecialAbled}</div>
                </div>
              )}
              {activeTab === 'teachers' && (
                <div className="detail-item">
                  <label style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '4px'}}>
                    <BookOpen size={14} /> {t('qualification')}
                  </label>
                  <div style={{fontWeight: 600}}>{viewDetails.qualification}</div>
                </div>
              )}
            </div>
            <div style={{marginTop: '32px', display: 'flex', gap: '12px'}}>
              <button className="btn btn-primary" style={{flex: 1}} onClick={() => { setViewDetails(null); handleEdit(viewDetails); }}>{t('edit')}</button>
              <button className="btn btn-secondary" style={{flex: 1}} onClick={() => setViewDetails(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <Card padding="0">
        <div className="flex-between" style={{padding: '20px', borderBottom: '1px solid var(--color-border)'}}>
          <div className="tabs" style={{display: 'flex', gap: '16px'}}>
            <button 
              className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
              style={{
                padding: '8px 16px', borderRadius: '20px', fontWeight: 600,
                background: activeTab === 'students' ? 'rgba(225, 173, 1, 0.1)' : 'transparent',
                color: activeTab === 'students' ? 'var(--color-mustard-dark)' : 'var(--color-text-muted)',
                transition: 'all 0.2s', border: 'none', cursor: 'pointer'
              }}
            >
              {t('students')}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
              onClick={() => setActiveTab('teachers')}
              style={{
                padding: '8px 16px', borderRadius: '20px', fontWeight: 600,
                background: activeTab === 'teachers' ? 'rgba(225, 173, 1, 0.1)' : 'transparent',
                color: activeTab === 'teachers' ? 'var(--color-mustard-dark)' : 'var(--color-text-muted)',
                transition: 'all 0.2s', border: 'none', cursor: 'pointer'
              }}
            >
              {t('teachers')}
            </button>
          </div>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              placeholder={t('search')} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px', width: '100%' }}
            />
          </div>
        </div>

        <div style={{overflowX: 'auto', minHeight: '300px'}}>
          {loading ? (
            <div className="flex-center" style={{height: '300px'}}>
              <Loader2 className="text-mustard" size={32} style={{animation: 'spin 1s linear infinite'}} />
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : data.length === 0 ? (
            <div className="flex-center" style={{height: '300px', flexDirection: 'column', gap: '12px'}}>
              <p className="text-muted">No {activeTab} found in database.</p>
              <button className="btn btn-secondary" onClick={() => setShowForm(true)}>{t('add_new')} {activeTab === 'students' ? t('students') : t('teachers')}</button>
            </div>
          ) : filteredData.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              {t('no_results')}
            </div>
          ) : (
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{textAlign: 'left', borderBottom: '1px solid var(--color-border)'}}>
                  <th style={{padding: '16px 20px', color: 'var(--color-text-muted)', fontWeight: 500}}>{t('name')}</th>
                  <th style={{padding: '16px 20px', color: 'var(--color-text-muted)', fontWeight: 500}}>{activeTab === 'students' ? t('roll_number') : t('subjects')}</th>
                  <th style={{padding: '16px 20px', color: 'var(--color-text-muted)', fontWeight: 500}}>{activeTab === 'students' ? t('father_name') : t('qualification')}</th>
                  <th style={{padding: '16px 20px', color: 'var(--color-text-muted)', fontWeight: 500}}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(person => (
                  <tr key={person.id} style={{borderBottom: '1px solid var(--color-border)'}}>
                    <td style={{padding: '16px 20px', fontWeight: 600}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <div style={{width: '32px', height: '32px', borderRadius: '16px', background: 'rgba(225, 173, 1, 0.1)', color: 'var(--color-mustard-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'}}>
                          {person.name.charAt(0)}
                        </div>
                        {person.name}
                      </div>
                    </td>
                    <td style={{padding: '16px 20px'}}>{activeTab === 'students' ? (person.rollNumber || '-') : (person.subjects || '-')}</td>
                    <td style={{padding: '16px 20px'}}>{activeTab === 'students' ? (person.fatherName || '-') : (person.qualification || '-')}</td>
                    <td style={{padding: '16px 20px'}}>
                      <div style={{display: 'flex', gap: '12px'}}>
                        <button className="text-mustard" style={{fontWeight: 600, fontSize: '14px', background: 'transparent', border: 'none', cursor: 'pointer'}} onClick={() => setViewDetails(person)}>{t('view')}</button>
                        <button className="text-mustard" style={{fontWeight: 600, fontSize: '14px', background: 'transparent', border: 'none', cursor: 'pointer'}} onClick={() => handleEdit(person)}>{t('edit')}</button>
                        <button className="text-danger" style={{fontWeight: 600, fontSize: '14px', background: 'transparent', border: 'none', cursor: 'pointer'}} onClick={() => handleDelete(person.id)}>{t('delete')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Directory;
