import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { School, ArrowRight, CircleCheck as CheckCircle, Users, BookOpen, Award, Info } from 'lucide-react';
import { ClasseraLoginButton } from '../../components/Auth/ClasseraLoginButton';

export const ClasseraLogin: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: 'تسجيل دخول موحد',
      description: 'استخدم حساب Classera الخاص بك للوصول المباشر باستخدام LTI 1.3'
    },
    {
      icon: BookOpen,
      title: 'مزامنة البيانات',
      description: 'تزامن تلقائي لبيانات الطلاب والمشرفين'
    },
    {
      icon: Award,
      title: 'تتبع التقدم',
      description: 'مشاركة درجات ونتائج المشاريع مع Classera'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-right"
          >
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
              <img 
                src="/mashroui-logo.png" 
                alt="مشروعي" 
                className="h-16 w-auto"
              />
              <div className="text-2xl font-bold text-gray-800">×</div>
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                <School className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              تسجيل الدخول عبر Classera
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              استخدم حساب Classera الخاص بك للوصول المباشر إلى منصة مشروعي
            </p>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-right">
                    <h3 className="font-semibold text-gray-800">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* LTI Info */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                <div className="text-right">
                  <h4 className="font-medium text-blue-800 mb-1">معلومات الاتصال</h4>
                  <p className="text-blue-700 text-sm">
                    نستخدم بروتوكول LTI 1.3 للمصادقة الآمنة مع Classera
                    <br />
                    اتصال مشفر ومصادق عليه بالكامل
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <School className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">مرحباً بك</h2>
              <p className="text-gray-600">سجل دخولك باستخدام حساب Classera</p>
            </div>

            <div className="space-y-4">
              <ClasseraLoginButton />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">أو</span>
                </div>
              </div>

              <Link
                to="/login"
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                تسجيل الدخول العادي
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                ليس لديك حساب؟{' '}
                <Link to="/register" className="text-green-600 hover:text-green-800 font-medium">
                  إنشاء حساب جديد
                </Link>
              </p>
            </div>


            {/* Security Notice */}
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-800 text-sm">اتصال آمن</h4>
                  <p className="text-green-700 text-xs">
                    يتم تشفير جميع البيانات المنقولة بين Classera ومنصة مشروعي
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};