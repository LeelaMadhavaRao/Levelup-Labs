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
import { ArrowLeft, Save, Upload, Sparkles, Mail } from 'lucide-react';
import { toast } from 'sonner';

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
      return generateHunterAvatarUrl(
        `${user.id}-${formData.full_name || user.email || 'user'}`
      );
    }
    return generateHunterAvatarUrl('user');
  }, [formData.avatar_url, formData.full_name, user?.email, user?.id]);

  const joinedAt = useMemo(() => {
    if (!user?.created_at) return 'Unknown';
    return new Date(user.created_at).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
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
    const seed = `${user?.id || 'user'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded-md bg-gray-200" />
          <div className="h-96 rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/profile')}
          className="mb-3 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update your profile information
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Preview sidebar */}
        <Card className="h-fit border-gray-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-gray-900">Preview</CardTitle>
            <CardDescription className="text-gray-400">
              Live preview of your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-28 w-28 border-2 border-purple-200">
                <AvatarImage
                  src={avatarPreview}
                  onError={() =>
                    setFormData((prev) => ({
                      ...prev,
                      avatar_url: generateHunterAvatarUrl(
                        `${user?.id || 'user'}-${formData.full_name || user?.email || 'user'}`
                      ),
                    }))
                  }
                />
                <AvatarFallback className="bg-purple-50 text-xl text-purple-600">
                  {formData.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">
                {formData.full_name || 'Your Name'}
              </p>
              <p className="text-xs text-gray-500">{user?.role || 'user'}</p>
            </div>
            <p className="line-clamp-4 text-sm text-gray-500">
              {formData.bio || 'Add a bio to complete your profile.'}
            </p>
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Email</span>
                <span className="text-gray-900">{user?.email || '...'}</span>
              </div>
              <div className="flex justify-between">
                <span>Joined</span>
                <span className="text-gray-900">{joinedAt}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-gray-900">Profile Information</CardTitle>
            <CardDescription className="text-gray-400">
              Update your details and save changes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar section */}
              <div className="space-y-3">
                <Label>Avatar</Label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Avatar className="h-16 w-16 shrink-0">
                    <AvatarImage
                      src={avatarPreview}
                      onError={() =>
                        setFormData((prev) => ({
                          ...prev,
                          avatar_url: generateHunterAvatarUrl(
                            `${user?.id || 'user'}-${formData.full_name || user?.email || 'user'}`
                          ),
                        }))
                      }
                    />
                    <AvatarFallback className="bg-purple-50 text-purple-600">
                      {formData.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={formData.avatar_url}
                      onChange={(e) =>
                        setFormData({ ...formData, avatar_url: e.target.value })
                      }
                      placeholder="https://example.com/avatar.jpg"
                      className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-gray-200 text-gray-600 hover:bg-gray-100"
                        onClick={() =>
                          document.getElementById('avatar-file')?.click()
                        }
                      >
                        <Upload className="mr-2 h-4 w-4" /> Upload
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-gray-200 text-gray-600 hover:bg-gray-100"
                        onClick={handleGenerateAvatar}
                      >
                        <Sparkles className="mr-2 h-4 w-4" /> Generate
                      </Button>
                    </div>
                    <input
                      id="avatar-file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    placeholder="John Doe"
                    required
                    className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="flex items-center gap-1.5"
                  >
                    <Mail className="h-3.5 w-3.5 text-gray-500" /> Email
                  </Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    readOnly
                    disabled
                    className="border-gray-200 bg-gray-50 text-gray-400"
                  />
                  <p className="text-xs text-gray-400">
                    Email cannot be changed.
                  </p>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Write a short bio..."
                  rows={3}
                  className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* Social links */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub Username</Label>
                  <Input
                    id="github"
                    value={formData.github_username}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        github_username: e.target.value,
                      })
                    }
                    placeholder="johndoe"
                    className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input
                    id="linkedin"
                    value={formData.linkedin_url}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        linkedin_url: e.target.value,
                      })
                    }
                    placeholder="https://linkedin.com/in/johndoe"
                    className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/profile')}
                  disabled={saving}
                  className="border-gray-200 text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-purple-600 text-white hover:bg-purple-500"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
