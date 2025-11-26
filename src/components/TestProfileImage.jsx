'use client';
import React from 'react';
import ProfileImage from '@/components/ProfileImage';
export default function TestProfileImage() {
    // Test with different scenarios
    const testUsers = [
        {
            name: 'User with photoURL',
            photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User1'
        },
        {
            name: 'User with customPhotoURL',
            customPhotoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User2',
            photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShouldNotShow'
        },
        {
            name: 'User with profilePic',
            profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User3'
        },
        {
            name: 'User with avatar',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User4'
        },
        {
            name: 'User with no image',
            // No image URLs
        }
    ];
    return (<div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Profile Image Test</h1>
      <div className="flex flex-wrap gap-4">
        {testUsers.map((user, index) => (<div key={index} className="border p-4 rounded-lg">
            <h2 className="font-semibold mb-2">{user.name}</h2>
            <ProfileImage user={user} size={100} className="rounded-full"/>
          </div>))}
      </div>
    </div>);
}
