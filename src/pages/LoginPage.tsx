import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { AnimatedDiv } from '@/components/ui/AnimatedText';
import { ArrowLeft, Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import HCaptcha from '@hcaptcha/react-hcaptcha';

export function LoginPage() {
  const navigate = useNavigate();
  const captchaRef = useRef<HCaptcha | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetAllData = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu phiên cũ? Hành động này sẽ yêu cầu bạn đăng nhập lại.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Clear stale data on mount
  React.useEffect(() => {
     localStorage.removeItem('userUUID');
     localStorage.removeItem('isAdmin');
     localStorage.removeItem('isLoggedIn');
     localStorage.removeItem('vuiCoinBalance');
     localStorage.removeItem('coinTaskBalance');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError("Vui lòng xác minh Captcha!");
      return;
    }

    setLoading(true);
    
    if (!email.endsWith('@gmail.com')) {
      setError('Chỉ chấp nhận email định dạng @gmail.com');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: token,
        }
      });

      if (authError) {
        if (captchaRef.current) {
          captchaRef.current.resetCaptcha();
        }
        setToken(null);
        // Fallback for development if Supabase is not configured or user doesn't exist yet
        if (authError.message.includes('Invalid login credentials')) {
           setError('Thông tin đăng nhập không chính xác');
        } else {
           setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        localStorage.setItem('userUUID', data.user.id);
        
        // Sync profile immediately - Bearer token will be picked up by UserContext 
        // but we can pass it here as well for immediate effect
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;

          await fetch('/api/user/sync-profile', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ 
              uuid: data.user.id, 
              email: email
            })
          });
        } catch (err) {
          console.error("Immediate Sync Error:", err);
        }

        navigate('/app');
      }
    } catch (e) {
      setError('Đã xảy ra lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col relative">
      {/* Back button */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-primary transition-colors">
        <ArrowLeft size={16} /> QUAY LẠI
      </Link>

      <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-center mb-8">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <Logo />
          </Link>
        </div>

        <AnimatedDiv delay={0.1} className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-10 px-8 shadow-2xl shadow-slate-200/50 sm:rounded-2xl border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Chào mừng trở lại!</h2>
              <p className="text-sm text-gray-500">Vui lòng đăng nhập để tiếp tục</p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              {!import.meta.env.VITE_SUPABASE_URL && (
                <div className="bg-amber-50 text-amber-600 p-3 rounded-xl text-xs font-medium border border-amber-100 mb-4">
                  ⚠️ Hệ thống chưa kết nối Supabase. Vui lòng thiết lập biến môi trường VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong Settings.
                </div>
              )}
              {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Email (Gmail)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-gray-50/50 focus:bg-white"
                    placeholder="user@gmail.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-gray-50/50 focus:bg-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center">
                  <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer" />
                  <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-slate-700 cursor-pointer">Ghi nhớ</label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-bold text-primary hover:text-orange-500">Quên mật khẩu?</a>
                </div>
              </div>

              <div className="space-y-1.5 flex justify-center">
                <HCaptcha
                  sitekey="832ae6de-e0d6-4b9a-a87c-d3dc8cd0d000"
                  onVerify={(t) => {
                    setToken(t);
                    setError('');
                  }}
                  ref={captchaRef}
                />
              </div>

              <div className="pt-2">
                <button
                   type="submit"
                   disabled={loading}
                   className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />} 
                  {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
                </button>
              </div>
              
              <div className="mt-6 text-center text-sm font-medium text-slate-600">
                 Chưa có tài khoản? <Link to="/register" className="font-bold text-slate-900 hover:text-primary transition-colors">Đăng ký ngay</Link>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                 <p className="text-center text-xs text-gray-500 mb-4">Trang web gặp lỗi treo hoặc nghẽn mạng?</p>
                 <button 
                    type="button" 
                    onClick={resetAllData}
                    className="w-full py-2.5 px-4 border-2 border-dashed border-gray-200 text-gray-400 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-[10px] uppercase tracking-widest"
                 >
                    Xóa Cache & Reset Phiên
                 </button>
              </div>
            </form>
          </div>
        </AnimatedDiv>
      </div>
    </div>
  );
}
