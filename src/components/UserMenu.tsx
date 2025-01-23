import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { LogOut, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserMenuProps {
  onSignInClick: () => void;
}

export function UserMenu({ onSignInClick }: UserMenuProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
    }
  };

  if (!user) {
    return (
      <button
        onClick={onSignInClick}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
      >
        <UserIcon className="w-5 h-5" />
        <span>Sign In</span>
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <span className="text-gray-600">{user.email}</span>
      <button
        onClick={handleSignOut}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
      >
        <LogOut className="w-5 h-5" />
        <span>Sign Out</span>
      </button>
    </div>
  );
}