import React, { useState } from 'react';
import { FileText, Plus, X, User, Lock } from 'lucide-react';
import { useSpreadsheetStore } from "../Store/useStore.js";


const NewFileButton = () => {
  const { createFile } = useSpreadsheetStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [users, setUsers] = useState([{ email: '', permission: 'view' }]);

  const handleAddUser = () => {
    setUsers([...users, { email: '', permission: 'view' }]);
  };

  const handleRemoveUser = (index) => {
    const newUsers = users.filter((_, i) => i !== index);
    setUsers(newUsers);
  };

  const handleUserChange = (index, field, value) => {
    const newUsers = [...users];
    newUsers[index] = { ...newUsers[index], [field]: value };
    setUsers(newUsers);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!fileName.trim()) {
        throw new Error('File name is required');
      }

      await createFile(fileName, users);
      
      setIsOpen(false);
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to create file');
    } finally {
      setIsLoading(false);
    }
  };

  {error && (
    <div className="text-red-500 text-sm mt-2">
      {error}
    </div>
  )}

  const resetForm = () => {
    setFileName('');
    setUsers([{ email: '', permission: 'view' }]);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors"
      >
        <Plus size={20} />
        <FileText size={20} />
        <span>New File</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800">Create New File</h2>
              <p className="text-gray-600 mt-1">Enter file details and set user permissions</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter file name"
                  className="w-full px-3 py-2 border-2 border-black rounded-md focus:ring-2 focus:ring-green-500 focus:border-2 border-black-green-500 text-black"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">User Permissions</label>
                  <button
                    type="button"
                    onClick={handleAddUser}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-md"
                  >
                    <Plus size={16} />
                    Add User
                  </button>
                </div>

                {users.map((user, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                        type='email'
                      placeholder="User email"
                      value={user.email}
                      onChange={(e) => handleUserChange(index, 'email', e.target.value)}
                      className="flex-1 px-3 py-2 border-2 border-black rounded-md focus:ring-2 focus:ring-green-500 text-black"
                    />
                    <select
                      value={user.permission}
                      onChange={(e) => handleUserChange(index, 'permission', e.target.value)}
                      className="px-3 py-2 border-2 border-black rounded-md focus:ring-2 focus:ring-green-500 w-28 text-black"
                    >
                      <option value="view">View</option>
                      <option value="edit">Edit</option>
                      {/* <option value="admin">Admin</option> */}
                    </select>
                    {users.length > 1 && (
                      <button
                        onClick={() => handleRemoveUser(index)}
                        className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md border-2 border-black"
              >
                Cancel
              </button>
              // Update submit button
              <button
                onClick={handleSubmit}
                disabled={!fileName.trim() || isLoading}
                className={`px-4 py-2 text-white rounded-md ${
                  !fileName.trim() || isLoading
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-500'
                }`}
              >
                {isLoading ? 'Creating...' : 'Create File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewFileButton;