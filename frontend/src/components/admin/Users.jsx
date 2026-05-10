<<<<<<< HEAD
// ============================================
// src/components/admin/Users.jsx
// ============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../common/Layout';
import { FiSearch, FiFilter, FiUserPlus } from 'react-icons/fi';

const Users = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const users = [
    {
      id: '1',
      name: 'Ahmed Al-Said',
      phone: '+96891234567',
      email: 'ahmed@example.com',
      role: 'Customer',
      status: 'Active',
      joinedDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Elite Salon',
      phone: '+96824567890',
      email: 'info@elitesalon.om',
      role: 'Salon',
      status: 'Active',
      joinedDate: '2024-01-10'
    },
    {
      id: '3',
      name: 'Mohammed Al-Hinai',
      phone: '+96892345678',
      email: 'mohammed@example.com',
      role: 'Stylist',
      status: 'Active',
      joinedDate: '2024-01-20'
    }
  ];

  const getRoleBadge = (role) => {
    const colors = {
      Admin: 'bg-red-100 text-red-800',
      Salon: 'bg-blue-100 text-blue-800',
      Stylist: 'bg-purple-100 text-purple-800',
      Customer: 'bg-green-100 text-green-800'
    };
    return `badge ${colors[role] || 'bg-gray-100 text-gray-800'}`;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">User Management</h1>
            <p className="text-gray-600">Manage all system users</p>
          </div>
          <button className="btn-primary flex items-center space-x-2">
            <FiUserPlus />
            <span>Add User</span>
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field min-w-[200px]"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="salon">Salons</option>
              <option value="stylist">Stylists</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Contact</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Joined Date</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <p className="font-semibold">{user.name}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm">{user.phone}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={getRoleBadge(user.role)}>{user.role}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`badge ${
                        user.status === 'Active' ? 'badge-confirmed' : 'badge-cancelled'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">{user.joinedDate}</td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button className="text-primary hover:underline text-sm">
                          Edit
                        </button>
                        <button className="text-red-600 hover:underline text-sm">
                          Disable
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600">Showing 1-10 of 156 users</p>
            <div className="flex space-x-2">
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">Previous</button>
              <button className="px-4 py-2 bg-primary text-white rounded-lg">1</button>
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">2</button>
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">3</button>
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

=======
// ============================================
// src/components/admin/Users.jsx
// ============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../common/Layout';
import { FiSearch, FiFilter, FiUserPlus } from 'react-icons/fi';

const Users = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const users = [
    {
      id: '1',
      name: 'Ahmed Al-Said',
      phone: '+96891234567',
      email: 'ahmed@example.com',
      role: 'Customer',
      status: 'Active',
      joinedDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Elite Salon',
      phone: '+96824567890',
      email: 'info@elitesalon.om',
      role: 'Salon',
      status: 'Active',
      joinedDate: '2024-01-10'
    },
    {
      id: '3',
      name: 'Mohammed Al-Hinai',
      phone: '+96892345678',
      email: 'mohammed@example.com',
      role: 'Stylist',
      status: 'Active',
      joinedDate: '2024-01-20'
    }
  ];

  const getRoleBadge = (role) => {
    const colors = {
      Admin: 'bg-red-100 text-red-800',
      Salon: 'bg-blue-100 text-blue-800',
      Stylist: 'bg-purple-100 text-purple-800',
      Customer: 'bg-green-100 text-green-800'
    };
    return `badge ${colors[role] || 'bg-gray-100 text-gray-800'}`;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">User Management</h1>
            <p className="text-gray-600">Manage all system users</p>
          </div>
          <button className="btn-primary flex items-center space-x-2">
            <FiUserPlus />
            <span>Add User</span>
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field min-w-[200px]"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="salon">Salons</option>
              <option value="stylist">Stylists</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Contact</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Joined Date</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <p className="font-semibold">{user.name}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm">{user.phone}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={getRoleBadge(user.role)}>{user.role}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`badge ${
                        user.status === 'Active' ? 'badge-confirmed' : 'badge-cancelled'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">{user.joinedDate}</td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button className="text-primary hover:underline text-sm">
                          Edit
                        </button>
                        <button className="text-red-600 hover:underline text-sm">
                          Disable
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600">Showing 1-10 of 156 users</p>
            <div className="flex space-x-2">
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">Previous</button>
              <button className="px-4 py-2 bg-primary text-white rounded-lg">1</button>
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">2</button>
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">3</button>
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
export default Users;