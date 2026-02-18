'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateHunterAvatarUrl, getCurrentUser, updateUserProfile } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Save, Upload, Sparkles, Shield, UserRound, Link2, AtSign, Mail, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { Orbitron, Rajdhani } from 'next/font/google';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type EditableUser = {
  id: string;
  email: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  github_username: string | null;
  linkedin_url: string | null;
  role: string | null;
  level?: number | null;
  xp?: number | null;
  total_xp?: number | null;
  total_points?: number | null;
  created_at?: string | null;
};

type ProfileFormData = {
  full_name: string;
  bio: string;
  avatar_url: string;
  github_username: string;
  linkedin_url: string;
};

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<EditableUser | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    bio: '',
    avatar_url: '',
    github_username: '',
    linkedin_url: '',
  });

  const avatarPreview = useMemo(() => {
    if (formData.avatar_url) return formData.avatar_url;
    if (user?.id) {
      return generateHunterAvatarUrl(`${user.id}-${formData.full_name || user.email || 'hunter'}`);
    }
    return generateHunterAvatarUrl('hunter');
  }, [formData.avatar_url, formData.full_name, user?.email, user?.id]);

  const joinedAt = useMemo(() => {
    if (!user?.created_at) return 'Unknown';
    return new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [user?.created_at]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        toast.error('Failed to process image');
        return;
      }
      setFormData((prev) => ({ ...prev, avatar_url: result }));
      toast.success('Profile photo uploaded');
    };
    reader.onerror = () => toast.error('Failed to read image file');
    reader.readAsDataURL(file);
  };

  const handleGenerateAvatar = () => {
    const seed = `${user?.id || 'hunter'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const generated = generateHunterAvatarUrl(seed);
    setFormData((prev) => ({ ...prev, avatar_url: generated }));
    toast.success('Generated a new avatar');
  };

  const loadUser = useCallback(async () => {
    try {
      const currentUser = (await getCurrentUser()) as EditableUser | null;
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      setUser(currentUser);
      setFormData({
        full_name: currentUser.full_name || '',
        bio: currentUser.bio || '',
        avatar_url: currentUser.avatar_url || '',
        github_username: currentUser.github_username || '',
        linkedin_url: currentUser.linkedin_url || '',
      });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (!user) {
      toast.error('User not loaded');
      setSaving(false);
      return;
    }

    try {
      const { error } = await updateUserProfile(user.id, formData);

      if (error) {
        toast.error('Failed to update profile');
        setSaving(false);
        return;
      }

      toast.success('Profile updated successfully!');
      router.push('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An unexpected error occurred');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${rajdhani.className} relative min-h-screen overflow-hidden text-slate-100`}>
      <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-10" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-purple-950/20 via-black to-cyan-950/20" />
      <div className="hunter-grid-bg pointer-events-none fixed inset-0 z-0 opacity-70" />
      <div className="nebula-bg pointer-events-none fixed inset-0 z-0 opacity-70" />

      <div className="relative z-20 mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">System Interface // Profile Editing</p>
            <h1 className={`${orbitron.className} text-3xl font-bold text-white md:text-4xl`}>Profile Editor</h1>
          </div>
          <div className="flex items-center gap-2 rounded border border-cyan-500/30 bg-black/50 px-3 py-1.5 text-xs text-cyan-200">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            Synchronization Stable
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={() => router.push('/profile')}
          className="mb-5 text-slate-200 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="h-fit border-white/15 bg-black/60 text-slate-100 lg:col-span-4">
          <CardHeader>
            <CardTitle className={`${orbitron.className} text-lg`}>Learner Preview</CardTitle>
            <CardDescription className="text-slate-400">Live profile panel with realtime values.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative flex justify-center rounded-xl border border-purple-500/25 bg-slate-950/80 py-8">
              <div className="pointer-events-none absolute inset-x-10 top-4 h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
              <Avatar className="h-36 w-36 border border-purple-400/40 shadow-[0_0_24px_rgba(127,13,242,0.35)]">
                <AvatarImage src={avatarPreview} onError={() => setFormData((prev) => ({ ...prev, avatar_url: generateHunterAvatarUrl(`${user?.id || 'hunter'}-${formData.full_name || user?.email || 'hunter'}`) }))} />
                <AvatarFallback className="bg-slate-900 text-slate-200">
                  {formData.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="rounded border border-white/10 bg-slate-900/70 p-4">
              <p className={`${orbitron.className} text-lg text-white`}>{formData.full_name || 'Unknown Learner'}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-purple-300">{user?.role || 'user'} profile</p>
              <p className="mt-3 line-clamp-5 text-sm text-slate-300">{formData.bio || 'Add your bio to complete the profile.'}</p>
            </div>
            <div className="space-y-2 rounded border border-white/10 bg-slate-900/60 p-3 text-xs text-slate-300">
              <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-purple-300" /> Profile Integrity: Active</div>
              <div className="flex items-center gap-2"><UserRound className="h-3.5 w-3.5 text-cyan-300" /> Identity: {user?.email || 'loading...'}</div>
              <div className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-cyan-300" /> Member Since: {joinedAt}</div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded border border-purple-500/20 bg-slate-900/80 px-2 py-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Level</p>
                <p className={`${orbitron.className} text-lg text-white`}>{Number(user?.level ?? 1)}</p>
              </div>
              <div className="rounded border border-cyan-500/20 bg-slate-900/80 px-2 py-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">XP</p>
                <p className={`${orbitron.className} text-lg text-white`}>{Number(user?.total_xp ?? user?.xp ?? user?.total_points ?? 0).toLocaleString()}</p>
              </div>
              <div className="rounded border border-indigo-500/20 bg-slate-900/80 px-2 py-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">XP (Synced)</p>
                <p className={`${orbitron.className} text-lg text-white`}>{Number(user?.total_xp ?? user?.xp ?? user?.total_points ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/15 bg-black/60 text-slate-100 lg:col-span-8">
          <CardHeader>
            <CardTitle className={orbitron.className}>Edit Learner Profile</CardTitle>
            <CardDescription className="text-slate-400">Update your profile and portrait with realtime preview sync.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg border border-purple-500/20 bg-slate-950/60 p-4">
              <p className="mb-3 text-xs uppercase tracking-[0.14em] text-purple-300">Portrait Protocol</p>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <Avatar className="h-20 w-20 shrink-0">
                <AvatarImage src={avatarPreview} onError={() => setFormData((prev) => ({ ...prev, avatar_url: generateHunterAvatarUrl(`${user?.id || 'hunter'}-${formData.full_name || user?.email || 'hunter'}`) }))} />
                <AvatarFallback>
                  {formData.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 w-full">
                <Label htmlFor="avatar">Avatar URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="avatar"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                    className="bg-black/60 border-white/15 text-slate-100"
                  />
                  <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => document.getElementById('avatar-file')?.click()}>
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <input id="avatar-file" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('avatar-file')?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Portrait
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleGenerateAvatar}>
                    <Sparkles className="mr-2 h-4 w-4" /> Auto-Generate Avatar
                  </Button>
                </div>
                <p className="mt-2 text-xs text-slate-400">Upload your own image or auto-generate a unique avatar.</p>
              </div>
            </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-lg border border-white/10 bg-slate-950/60 p-4">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
                className="bg-black/60 border-white/15 text-slate-100"
                required
              />
            </div>

            <div className="space-y-2 rounded-lg border border-white/10 bg-slate-950/60 p-4">
              <Label htmlFor="email" className="flex items-center gap-2"><Mail className="h-4 w-4 text-cyan-300" /> Email</Label>
              <Input
                id="email"
                value={user?.email || ''}
                readOnly
                disabled
                className="bg-black/40 border-white/10 text-slate-400"
              />
              <p className="text-xs text-slate-400">
                Email cannot be changed
              </p>
            </div>
            </div>

            <div className="space-y-2 rounded-lg border border-white/10 bg-slate-950/60 p-4">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Write your bio..."
                rows={4}
                className="bg-black/60 border-white/15 text-slate-100"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-lg border border-white/10 bg-slate-950/60 p-4">
                <Label htmlFor="github" className="flex items-center gap-2"><AtSign className="h-4 w-4 text-purple-300" /> GitHub Username</Label>
                <Input
                  id="github"
                  value={formData.github_username}
                  onChange={(e) => setFormData({ ...formData, github_username: e.target.value })}
                  placeholder="johndoe"
                  className="bg-black/60 border-white/15 text-slate-100"
                />
              </div>

              <div className="space-y-2 rounded-lg border border-white/10 bg-slate-950/60 p-4">
                <Label htmlFor="linkedin" className="flex items-center gap-2"><Link2 className="h-4 w-4 text-cyan-300" /> LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/johndoe"
                  className="bg-black/60 border-white/15 text-slate-100"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/profile')}
                disabled={saving}
                className="border-white/20 bg-transparent text-slate-200 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="btn-hunter border border-purple-400/40 bg-gradient-to-r from-purple-700/80 to-indigo-700/80 text-white hover:from-purple-600 hover:to-indigo-600">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
