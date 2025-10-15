import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Save,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Building,
  GraduationCap,
  BookOpen,
  Briefcase,
  Languages,
  Award,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  UserPlus,
  MapPin,
  Send
} from 'lucide-react';
import { getSchools, sendPasswordResetEmailToUser } from '../../lib/firebase';

export interface UserFormData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  role: 'student' | 'teacher' | 'school' | 'admin' | 'consultant';
  password: string;
  confirmPassword: string;
  school_id: string;
  grade: string;
  subject: string;
  schoolIdNumber: string;
  specializations: string[];
  experience_years: number;
  hourly_rate: number;
  languages: string[];
  status: 'active' | 'pending' | 'inactive' | 'suspended';
  otherSpecialization: string;
  city: string;
  location: string;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: Partial<UserFormData>) => Promise<void>;
  editingUser?: any | null;
  isEditing?: boolean;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingUser = null,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    role: 'student',
    password: '',
    confirmPassword: '',
    school_id: '',
    grade: '',
    subject: '',
    schoolIdNumber: '',
    specializations: [],
    experience_years: 0,
    hourly_rate: 150,
    languages: ['العربية'],
    status: 'active',
    otherSpecialization: '',
    city: '',
    location: ''
  });

  const [schools, setSchools] = useState<{id: string, name: string}[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState<string | null>(null);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);

  // Available specializations for consultants
  const specializations = [
    'الذكاء الاصطناعي',
    'تعلم الآلة',
    'الروبوتات',
    'تطوير التطبيقات',
    'تطوير الويب',
    'قواعد البيانات',
    'الأمن السيبراني',
    'الشبكات',
    'التصميم الجرافيكي',
    'تجربة المستخدم',
    'التسويق الرقمي',
    'ريادة الأعمال',
    'إدارة المشاريع',
    'العلوم',
    'الرياضيات',
    'الفيزياء',
    'الكيمياء',
    'الأحياء',
    'الهندسة الميكانيكية',
    'الهندسة الكهربائية',
    'الهندسة المدنية',
    'الطب العام',
    'طب الأطفال',
    'الجراحة العامة',
    'أخرى'
  ];

  // Available languages
  const availableLanguages = [
    'العربية',
    'الإنجليزية',
    'الفرنسية',
    'الإسبانية',
    'الألمانية',
    'الصينية',
    'اليابانية',
    'الروسية',
    'الهندية',
    'البرتغالية'
  ];

  // Available statuses
  const userStatuses = [
    { id: 'active', name: 'نشط', color: 'bg-green-100 text-green-800' },
    { id: 'pending', name: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'inactive', name: 'غير نشط', color: 'bg-gray-100 text-gray-800' },
    { id: 'suspended', name: 'موقوف', color: 'bg-red-100 text-red-800' }
  ];

  // Fetch schools when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchSchoolsData = async () => {
        try {
          setSchoolsLoading(true);
          const fetchedSchools = await getSchools();
          if (fetchedSchools && fetchedSchools.length > 0) {
            setSchools(fetchedSchools);
          } else {
            setSchools([]);
          }
        } catch (err) {
          console.error('Error fetching schools:', err);
          setSchools([]);
        } finally {
          setSchoolsLoading(false);
        }
      };
      fetchSchoolsData();
    }
  }, [isOpen]);

  // Initialize form data when editing user or modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingUser && isEditing) {
        // Populate form with existing user data
        setFormData({
          name: editingUser.name || '',
          email: editingUser.email || '',
          phone: editingUser.phone || '',
          bio: editingUser.bio || '',
          role: editingUser.role || 'student',
          password: '', // Don't pre-fill password for security
          confirmPassword: '',
          school_id: editingUser.school_id || '',
          grade: editingUser.grade || '',
          subject: editingUser.subject || '',
          schoolIdNumber: editingUser.schoolIdNumber || '',
          specializations: editingUser.specializations || [],
          experience_years: editingUser.experience_years || 0,
          hourly_rate: editingUser.hourly_rate || 150,
          languages: editingUser.languages || ['العربية'],
          status: editingUser.status || 'active',
          otherSpecialization: '',
          city: editingUser.city || editingUser.location || '',
          location: editingUser.location || editingUser.city || ''
        });
      } else {
        // Reset form for new user
        setFormData({
          name: '',
          email: '',
          phone: '',
          bio: '',
          role: 'student',
          password: '',
          confirmPassword: '',
          school_id: '',
          grade: '',
          subject: '',
          schoolIdNumber: '',
          specializations: [],
          experience_years: 0,
          hourly_rate: 150,
          languages: ['العربية'],
          status: 'active',
          otherSpecialization: '',
          city: '',
          location: ''
        });
      }
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, editingUser, isEditing]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSpecializationToggle = (specialization: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }));
  };

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const validateForm = () => {
    console.log('🔍 Starting form validation...');
    console.log('📋 Form data to validate:', {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      hasPassword: !!formData.password,
      passwordLength: formData.password.length,
      hasConfirmPassword: !!formData.confirmPassword,
      school_id: formData.school_id,
      isEditing: isEditing
    });

    if (!formData.name || !formData.email || !formData.role) {
      console.log('❌ Validation failed: Missing required fields');
      setError('يرجى ملء جميع الحقول المطلوبة');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.log('❌ Validation failed: Invalid email format');
      setError('يرجى إدخال بريد إلكتروني صالح');
      return false;
    }

    // Password validation for new users
    if (!isEditing) {
      if (!formData.password || formData.password.length < 6) {
        console.log('❌ Validation failed: Password too short or missing');
        setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        console.log('❌ Validation failed: Passwords do not match');
        setError('كلمات المرور غير متطابقة');
        return false;
      }
    }

    // Password validation for editing (only if password is provided)
    if (isEditing && formData.password) {
      if (formData.password.length < 6) {
        console.log('❌ Validation failed: New password too short');
        setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        console.log('❌ Validation failed: New passwords do not match');
        setError('كلمات المرور غير متطابقة');
        return false;
      }
    }

    // Role-specific validation
    if ((formData.role === 'student' || formData.role === 'teacher') && !formData.school_id) {
      console.log('❌ Validation failed: School required for student/teacher');
      setError('يرجى اختيار المدرسة');
      return false;
    }

    console.log('✅ Form validation passed successfully');
    return true;
  };

  const handleSendPasswordReset = async () => {
    if (!formData.email) {
      setPasswordResetError('البريد الإلكتروني مطلوب لإرسال رابط إعادة تعيين كلمة المرور');
      return;
    }

    setIsSendingPasswordReset(true);
    setPasswordResetError(null);
    setPasswordResetSuccess(null);

    try {
      const result = await sendPasswordResetEmailToUser(formData.email);

      if (result.success) {
        setPasswordResetSuccess(result.message);
        setTimeout(() => {
          setPasswordResetSuccess(null);
        }, 5000);
      } else {
        setPasswordResetError(result.message);
      }
    } catch (err) {
      console.error('Error sending password reset email:', err);
      setPasswordResetError(err instanceof Error ? err.message : 'حدث خطأ في إرسال رابط إعادة تعيين كلمة المرور');
    } finally {
      setIsSendingPasswordReset(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🚀 Form submission started:', {
      isEditing: isEditing,
      userRole: formData.role,
      userName: formData.name,
      userEmail: formData.email,
      timestamp: new Date().toISOString()
    });
    
    if (!validateForm()) {
      console.log('❌ Form submission stopped: Validation failed');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    console.log('📤 Preparing user data for submission...');

    try {
      // Prepare specializations array including custom specialization if provided
      let finalSpecializations = [...formData.specializations];
      
      // If "أخرى" is selected and custom specialization is provided, add it
      if (formData.specializations.includes('أخرى') && formData.otherSpecialization.trim()) {
        finalSpecializations = finalSpecializations.filter(s => s !== 'أخرى');
        finalSpecializations.push(formData.otherSpecialization.trim());
      }

      // Prepare user data
      const userData = {
        ...formData,
        specializations: finalSpecializations
      };

      // Remove password fields if editing and no new password provided
      if (isEditing && !formData.password) {
        delete userData.password;
        delete userData.confirmPassword;
      }

      console.log('📋 Final user data prepared:', {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        school_id: userData.school_id,
        hasPassword: !!userData.password,
        specializations: userData.specializations,
        status: userData.status,
        isEditing: isEditing
      });

      console.log('📡 Calling onSubmit function...');
      await onSubmit(userData);
      console.log('✅ onSubmit completed successfully');
      
      setSuccess(isEditing ? 'تم تحديث المستخدم بنجاح' : 'تم إنشاء المستخدم بنجاح');
      console.log('🎉 User operation completed successfully');
      
      // Close modal after success
      setTimeout(() => {
        console.log('🚪 Closing modal after success');
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error submitting user form:', err);
      console.log('❌ Detailed error in form submission:', {
        error: err,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorStack: err instanceof Error ? err.stack : 'No stack trace',
        formData: {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          school_id: formData.school_id
        }
      });
      setError(err instanceof Error ? err.message : 'حدث خطأ في حفظ بيانات المستخدم');
    } finally {
      setIsSubmitting(false);
      console.log('🏁 Form submission process completed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-blue-600" />
            {isEditing ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>{success}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              المعلومات الأساسية
            </h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم الكامل *
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل الاسم الكامل"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المدينة
                </label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل المدينة"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني *
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل البريد الإلكتروني"
                    required
                    disabled={isEditing} // Disable email editing for security
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="05xxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الحساب *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="student">طالب</option>
                  <option value="teacher">معلم</option>
                  <option value="school">مدرسة</option>
                  <option value="consultant">مستشار</option>
                  <option value="admin">مدير</option>
                </select>
              </div>

              {/* Status field for editing */}
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    حالة الحساب
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {userStatuses.map(status => (
                      <option key={status.id} value={status.id}>{status.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {isEditing ? 'إدارة كلمة المرور' : 'كلمة المرور *'}
            </h4>

            {isEditing ? (
              <div className="space-y-4">
                {/* Password Reset Success Message */}
                {passwordResetSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>{passwordResetSuccess}</span>
                  </div>
                )}

                {/* Password Reset Error Message */}
                {passwordResetError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{passwordResetError}</span>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-3">
                    لتحديث كلمة مرور المستخدم، يمكنك إرسال رابط إعادة تعيين كلمة المرور إلى بريده الإلكتروني.
                  </p>
                  <button
                    type="button"
                    onClick={handleSendPasswordReset}
                    disabled={isSendingPasswordReset || !formData.email}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSendingPasswordReset ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        إرسال رابط إعادة تعيين كلمة المرور
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة المرور *
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full pr-12 pl-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="أدخل كلمة المرور"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">يجب أن تكون 6 أحرف على الأقل</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تأكيد كلمة المرور *
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="أعد إدخال كلمة المرور"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Role-specific fields */}
          {(formData.role === 'student' || formData.role === 'teacher') && (
            <div className="bg-green-50 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5" />
                معلومات المدرسة
              </h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المدرسة *
                  </label>
                  <select
                    value={formData.school_id}
                    onChange={(e) => handleInputChange('school_id', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={schoolsLoading}
                  >
                    <option value="">
                      {schoolsLoading ? 'جاري التحميل...' : 'اختر المدرسة'}
                    </option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الرقم المدرسي
                  </label>
                  <input
                    type="text"
                    value={formData.schoolIdNumber}
                    onChange={(e) => handleInputChange('schoolIdNumber', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل الرقم المدرسي"
                  />
                </div>

                {formData.role === 'student' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الصف الدراسي
                    </label>
                    <select
                      value={formData.grade}
                      onChange={(e) => handleInputChange('grade', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">اختر الصف</option>
                      <option value="1">الأول الابتدائي</option>
                      <option value="2">الثاني الابتدائي</option>
                      <option value="3">الثالث الابتدائي</option>
                      <option value="4">الرابع الابتدائي</option>
                      <option value="5">الخامس الابتدائي</option>
                      <option value="6">السادس الابتدائي</option>
                      <option value="7">الأول المتوسط</option>
                      <option value="8">الثاني المتوسط</option>
                      <option value="9">الثالث المتوسط</option>
                      <option value="10">الأول الثانوي</option>
                      <option value="11">الثاني الثانوي</option>
                      <option value="12">الثالث الثانوي</option>
                    </select>
                  </div>
                )}

                {formData.role === 'teacher' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المادة التدريسية
                    </label>
                    <div className="relative">
                      <BookOpen className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="مثل: الرياضيات، العلوم، اللغة العربية"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {formData.role === 'consultant' && (
            <div className="bg-purple-50 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                معلومات المستشار
              </h4>
              
              <div className="space-y-6">
                {/* Specializations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    التخصصات *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {specializations.map(spec => (
                      <label key={spec} className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.specializations.includes(spec)}
                          onChange={() => handleSpecializationToggle(spec)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{spec}</span>
                      </label>
                    ))}
                  </div>
                  
                  {/* Custom specialization input */}
                  {formData.specializations.includes('أخرى') && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={formData.otherSpecialization}
                        onChange={(e) => handleInputChange('otherSpecialization', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="حدد التخصص الآخر"
                      />
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      سنوات الخبرة
                    </label>
                    <div className="relative">
                      <Award className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={formData.experience_years}
                        onChange={(e) => handleInputChange('experience_years', parseInt(e.target.value) || 0)}
                        className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      السعر بالساعة (ريال)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        min="50"
                        max="1000"
                        step="25"
                        value={formData.hourly_rate}
                        onChange={(e) => handleInputChange('hourly_rate', parseInt(e.target.value) || 150)}
                        className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="150"
                      />
                    </div>
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    اللغات
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border border-gray-200 rounded-lg p-3">
                    {availableLanguages.map(lang => (
                      <label key={lang} className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.languages.includes(lang)}
                          onChange={() => handleLanguageToggle(lang)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{lang}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نبذة شخصية
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="اكتب نبذة مختصرة عن نفسك..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEditing ? 'حفظ التغييرات' : 'إنشاء الحساب'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};