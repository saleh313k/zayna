<<<<<<< HEAD
// ============================================
// src/components/customer/Profile.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import Layout from '../common/Layout';
import { FiUser, FiMail, FiPhone, FiStar, FiGift } from 'react-icons/fi';

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || ''
  });
  const [loyaltyPoints, setLoyaltyPoints] = useState(250);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // API call to update profile
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-8">
          {t('customer.profile')}
        </h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="md:col-span-2">
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Personal Information</h2>
                <button
                  onClick={() => setEditing(!editing)}
                  className="text-primary hover:underline"
                >
                  {editing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <FiUser className="inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    disabled={!editing}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <FiMail className="inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!editing}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <FiPhone className="inline mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    disabled
                    className="input-field bg-gray-100"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Phone number cannot be changed
                  </p>
                </div>

                {editing && (
                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                )}
              </form>
            </div>

            {/* Notification Settings */}
            <div className="card mt-6">
              <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-primary" />
                  <span>SMS notifications</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-primary" />
                  <span>Email notifications</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="w-5 h-5 text-primary" />
                  <span>Promotional offers</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1 space-y-6">
            {/* Loyalty Points */}
            <div className="card bg-gradient-to-br from-primary to-accent text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Loyalty Points</h3>
                <FiStar className="text-2xl" />
              </div>
              <p className="text-4xl font-bold mb-2">{loyaltyPoints}</p>
              <p className="text-sm opacity-90">Points available</p>
              <button className="mt-4 w-full bg-white text-primary font-medium py-2 rounded-lg hover:bg-opacity-90 transition-colors">
                Redeem Points
              </button>
            </div>

            {/* Rewards */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Rewards</h3>
                <FiGift className="text-xl text-primary" />
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-800">10% off next booking</p>
                  <p className="text-sm text-green-600">Valid until Dec 31</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-800">Free upgrade</p>
                  <p className="text-sm text-blue-600">Use on any service</p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="card">
              <h3 className="font-semibold mb-4">Your Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Bookings</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Favorite Salon</span>
                  <span className="font-semibold">Elite Salon</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-semibold">Jan 2024</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

=======
// ============================================
// src/components/customer/Profile.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import Layout from '../common/Layout';
import { FiUser, FiMail, FiPhone, FiStar, FiGift } from 'react-icons/fi';

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || ''
  });
  const [loyaltyPoints, setLoyaltyPoints] = useState(250);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // API call to update profile
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-8">
          {t('customer.profile')}
        </h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="md:col-span-2">
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Personal Information</h2>
                <button
                  onClick={() => setEditing(!editing)}
                  className="text-primary hover:underline"
                >
                  {editing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <FiUser className="inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    disabled={!editing}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <FiMail className="inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!editing}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <FiPhone className="inline mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    disabled
                    className="input-field bg-gray-100"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Phone number cannot be changed
                  </p>
                </div>

                {editing && (
                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                )}
              </form>
            </div>

            {/* Notification Settings */}
            <div className="card mt-6">
              <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-primary" />
                  <span>SMS notifications</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-primary" />
                  <span>Email notifications</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="w-5 h-5 text-primary" />
                  <span>Promotional offers</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1 space-y-6">
            {/* Loyalty Points */}
            <div className="card bg-gradient-to-br from-primary to-accent text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Loyalty Points</h3>
                <FiStar className="text-2xl" />
              </div>
              <p className="text-4xl font-bold mb-2">{loyaltyPoints}</p>
              <p className="text-sm opacity-90">Points available</p>
              <button className="mt-4 w-full bg-white text-primary font-medium py-2 rounded-lg hover:bg-opacity-90 transition-colors">
                Redeem Points
              </button>
            </div>

            {/* Rewards */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Rewards</h3>
                <FiGift className="text-xl text-primary" />
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-800">10% off next booking</p>
                  <p className="text-sm text-green-600">Valid until Dec 31</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-800">Free upgrade</p>
                  <p className="text-sm text-blue-600">Use on any service</p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="card">
              <h3 className="font-semibold mb-4">Your Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Bookings</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Favorite Salon</span>
                  <span className="font-semibold">Elite Salon</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-semibold">Jan 2024</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
export default Profile;