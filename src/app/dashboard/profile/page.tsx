'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert';
import { Badge } from '@/src/components/ui/badge';
import { 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Calendar, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldAlert
} from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    
    return {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial
    };
  };

  const passwordStrength = validatePassword(formData.newPassword);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Fetch latest user data from backend
      const fetchUserData = async () => {
        try {
          const res = await fetch(`/api/users/${parsedUser.id}`);
          if (res.ok) {
            const data = await res.json();
            const updatedUser = data.user;
            setUser(updatedUser);
            setFormData(prev => ({
              ...prev,
              username: updatedUser.username || '',
              email: updatedUser.email || '',
            }));
            // Update local storage too
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } else {
            // Fallback to local data if fetch fails
            setUser(parsedUser);
            setFormData(prev => ({
              ...prev,
              username: parsedUser.username || '',
              email: parsedUser.email || '',
            }));
          }
        } catch (err) {
          console.error('Failed to fetch user data:', err);
          setUser(parsedUser);
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.currentPassword) {
      setError('Değişiklikleri kaydetmek için mevcut şifrenizi girmelisiniz.');
      return;
    }

    if (formData.newPassword) {
      if (!passwordStrength.isValid) {
        setError('Yeni şifre güvenlik standartlarını karşılamıyor.');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('Yeni şifreler uyuşmuyor.');
        return;
      }
    }

    setUpdating(true);

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          currentPassword: formData.currentPassword || undefined,
          password: formData.newPassword || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Profil bilgileriniz başarıyla güncellendi.');
        // Update local storage
        const updatedUser = { ...user, username: formData.username, email: formData.email };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      } else {
        setError(data.error || 'Güncelleme sırasında bir hata oluştu.');
      }
    } catch (err) {
      setError('Sunucu ile iletişim kurulamadı.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profil Ayarları</h2>
        <p className="text-muted-foreground">
          Hesap bilgilerinizi yönetin ve güvenliğinizi sağlayın.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Info Sidebar */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader className="text-center">
            <div className="mx-auto bg-blue-100 dark:bg-blue-900/20 w-20 h-20 rounded-full flex items-center justify-center mb-4">
              <User className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>{user.username}</CardTitle>
            <CardDescription className="capitalize">{user.role}</CardDescription>
            <div className="pt-2">
              <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                {user.status === 'active' ? 'Aktif Hesap' : 'Onay Bekliyor'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Katılım: {new Date().toLocaleDateString('tr-TR')}</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>E-posta Doğrulandı</span>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Bilgileri Güncelle</CardTitle>
            <CardDescription>
              Kullanıcı adı, e-posta ve şifrenizi buradan değiştirebilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <AlertTitle>Başarılı</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Kullanıcı Adı</Label>
                  <Input 
                    id="username" 
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="kullanıcıadınız" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta Adresi</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ornek@mail.com" 
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Şifre İşlemleri
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Mevcut Şifre (Değişiklikleri onaylamak için zorunlu)</Label>
                    <div className="relative">
                      <Input 
                        id="current-password" 
                        type={showCurrentPassword ? "text" : "password"}
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        placeholder="••••••••" 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">Yeni Şifre</Label>
                    <div className="relative">
                      <Input 
                        id="new-password" 
                        type={showNewPassword ? "text" : "password"}
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        placeholder="••••••••" 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                      </Button>
                    </div>
                    {formData.newPassword && (
                      <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2">
                        <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" /> Şifre Güvenlik Kriterleri
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <div className={`text-[11px] flex items-center gap-1.5 ${passwordStrength.minLength ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${passwordStrength.minLength ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            En az 8 karakter
                          </div>
                          <div className={`text-[11px] flex items-center gap-1.5 ${passwordStrength.hasUpper ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${passwordStrength.hasUpper ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            Büyük harf (A-Z)
                          </div>
                          <div className={`text-[11px] flex items-center gap-1.5 ${passwordStrength.hasLower ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${passwordStrength.hasLower ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            Küçük harf (a-z)
                          </div>
                          <div className={`text-[11px] flex items-center gap-1.5 ${passwordStrength.hasNumber ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${passwordStrength.hasNumber ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            Rakam (0-9)
                          </div>
                          <div className={`text-[11px] flex items-center gap-1.5 ${passwordStrength.hasSpecial ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${passwordStrength.hasSpecial ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            Özel karakter (!@#$..)
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Yeni Şifre Tekrar</Label>
                    <div className="relative">
                      <Input 
                        id="confirm-password" 
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="••••••••" 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={updating}>
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    'Değişiklikleri Kaydet'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
