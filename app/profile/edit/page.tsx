'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateHunterAvatarUrl, getCurrentUser, updateUserProfile } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Save, Upload, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    avatar_url: '',
    github_username: '',
    linkedin_url: '',
  });

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
      toast.success('Hunter portrait uploaded');
    };
    reader.onerror = () => toast.error('Failed to read image file');
    reader.readAsDataURL(file);
  };

  const handleGenerateAvatar = () => {
    const seed = `${user?.id || 'hunter'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const generated = generateHunterAvatarUrl(seed);
    setFormData((prev) => ({ ...prev, avatar_url: generated }));
    toast.success('Generated a new hunter avatar');
  };

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
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
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

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
    <div className="container py-8 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => router.push('/profile')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Hunter Profile
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Hunter Profile</CardTitle>
          <CardDescription>Update your hunter dossier and portrait</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <Avatar className="h-20 w-20 shrink-0">
                <AvatarImage src={formData.avatar_url} />
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
                    <Sparkles className="mr-2 h-4 w-4" /> Auto-Generate Hunter
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Upload your own image or auto-generate a unique Solo-style hunter avatar.</p>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Hunter Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Write your hunter background..."
                rows={4}
              />
            </div>

            {/* GitHub Username */}
            <div className="space-y-2">
              <Label htmlFor="github">GitHub Username</Label>
              <Input
                id="github"
                value={formData.github_username}
                onChange={(e) => setFormData({ ...formData, github_username: e.target.value })}
                placeholder="johndoe"
              />
            </div>

            {/* LinkedIn URL */}
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email}
                readOnly
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/profile')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
