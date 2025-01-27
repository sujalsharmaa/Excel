import { useState, useMemo, useCallback } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Dialog } from "@headlessui/react";
import { Search, ChevronLeft, ChevronRight, Copy, X, Edit, Save, Trash } from "react-feather";

const AdminPanel = () => {
    const [editingRowId, setEditingRowId] = useState(null);
    const [newFileName, setNewFileName] = useState("");
  const [data, setData] = useState([
    {
      fileName: "File 1.xlsx",
      authorizedEmails: ["user1@example.com", "user2@example.com"],
      permissions: ["Read", "Read + Write"],
      lastModified: "2025-01-20T14:32:00Z",
      token: { value: "", expiresAt: null },
    },
    {
      fileName: "File 2.xlsx",
      authorizedEmails: ["user3@example.com", "user4@example.com", "user5@example.com"],
      permissions: ["Read", "Read", "Read + Write"],
      lastModified: "2025-01-25T08:12:00Z",
      token: { value: "", expiresAt: null },
    },
  ]);

  const [globalFilter, setGlobalFilter] = useState("");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [selectedFileIndex, setSelectedFileIndex] = useState(-1);
  const [tokenExpiryTimes, setTokenExpiryTimes] = useState({});

  const handleRenameFile = useCallback((fileIndex, newName) => {
    setData(prevData => {
      const newData = [...prevData];
      newData[fileIndex] = {
        ...newData[fileIndex],
        fileName: newName,
        lastModified: new Date().toISOString(),
      };
      return newData;
    });
  }, []);

  const AddEmailCell = ({ row, handleAddEmail }) => {
    const [localEmail, setLocalEmail] = useState("");

    return (
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="Add email"
          className="border-2 border-indigo-500 rounded-lg px-3 py-1 text-sm w-40 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
          value={localEmail}
          onChange={(e) => setLocalEmail(e.target.value)}
        />
        <button
          onClick={() => {
            if (localEmail) {
              handleAddEmail(row.index, localEmail);
              setLocalEmail("");
            }
          }}
          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition-colors shadow-sm"
        >
          Add
        </button>
      </div>
    );
  };

  const calculateExpiryDate = (timeString) => {
    const now = new Date();
    const amount = parseInt(timeString.match(/\d+/)[0]);
    const unit = timeString.match(/[mhd]/)[0];
    const multiplier = {
      m: 60000,
      h: 3600000,
      d: 86400000,
    }[unit];
    return new Date(now.getTime() + amount * multiplier);
  };

  const handlePermissionChange = useCallback((fileIndex, userIndex, newPermission) => {
    setData(prevData => {
      const newData = [...prevData];
      newData[fileIndex].permissions[userIndex] = newPermission;
      return newData;
    });
  }, []);

  const handleAddEmail = useCallback((fileIndex, email) => {
    setData(prevData => {
      const newData = [...prevData];
      newData[fileIndex].authorizedEmails.push(email);
      newData[fileIndex].permissions.push("Read");
      return newData;
    });
  }, []);

  const handleGenerateToken = useCallback((fileIndex) => {
    const expiryTime = tokenExpiryTimes[fileIndex] || "10m";
    const expiresAt = calculateExpiryDate(expiryTime);
    const tokenValue = Math.random().toString(36).substr(2, 16);
    
    setData(prevData => {
      const newData = [...prevData];
      newData[fileIndex].token = {
        value: tokenValue,
        expiresAt: expiresAt.toISOString(),
      };
      return newData;
    });
  }, [tokenExpiryTimes]);

  const columns = useMemo(
    () => [
        {
            accessorKey: "fileName",
            header: "File Name",
            cell: ({ row }) => {
              const isEditing = editingRowId === row.index;
              return (
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        className="border-2 border-purple-300 rounded-lg px-2 py-1 text-sm w-40 focus:outline-none focus:border-purple-500"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            handleRenameFile(row.index, newFileName);
                            setEditingRowId(null);
                          }}
                          className="p-1 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={() => setEditingRowId(null)}
                          className="p-1 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-gray-800">{row.original.fileName}</span>
                      <button
                        onClick={() => {
                          setNewFileName(row.original.fileName);
                          setEditingRowId(row.index);
                        }}
                        className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                    </>
                  )}
                </div>
              );
            },
          },
      {
        accessorKey: "authorizedEmails",
        header: "Authorized Emails",
        cell: ({ row }) => (
          <ul className="space-y-1">
            {row.original.authorizedEmails.slice(0, 3).map((email, idx) => (
              <li key={idx} className="text-sm text-gray-600">
                {email}
              </li>
            ))}
            {row.original.authorizedEmails.length > 3 && (
              <li className="text-sm text-purple-500 font-medium">
                + {row.original.authorizedEmails.length - 3} more...
              </li>
            )}
          </ul>
        ),
      },
      {
        header: "Add Email",
        cell: ({ row }) => (
          <AddEmailCell row={row} handleAddEmail={handleAddEmail} />
        ),
      },
      {
        accessorKey: "permissions",
        header: "Permissions",
        cell: ({ row }) => (
          <ul className="space-y-2">
            {row.original.authorizedEmails.map((email, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{email}:</span>
                <select
                  value={row.original.permissions[idx]}
                  onChange={(e) => handlePermissionChange(row.index, idx, e.target.value)}
                  className="rounded-lg border-2 border-gray-100 px-2 py-1 text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                >
                  <option value="Read">Read</option>
                  <option value="Read + Write">Read + Write</option>
                </select>
              </li>
            ))}
          </ul>
        ),
      },
      {
        accessorKey: "lastModified",
        header: "Last Modified",
        cell: ({ row }) => (
          <div className="text-sm text-gray-600">
            {new Date(row.original.lastModified).toLocaleString()}
          </div>
        ),
      },
      {
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <select
                  value={tokenExpiryTimes[row.index] || "10m"}
                  onChange={(e) => {
                    const newExpiryTimes = { ...tokenExpiryTimes };
                    newExpiryTimes[row.index] = e.target.value;
                    setTokenExpiryTimes(newExpiryTimes);
                  }}
                  className="rounded-lg border-2 border-black px-2 py-1 text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                >
                  <option value="10m">10m</option>
                  <option value="1h">1h</option>
                  <option value="1d">1d</option>
                </select>
                <button
                  onClick={() => handleGenerateToken(row.index)}
                  className="text-sm font-semibold bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 rounded-lg hover:from-green-600 hover:to-blue-600 transition-colors shadow-sm"
                >
                  Generate Token
                </button>
              </div>
              {row.original.token.value && (
                <div className="flex items-center gap-1 text-xs bg-purple-50 px-2 py-1 rounded">
                  <span className="text-purple-700">{row.original.token.value}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(row.original.token.value)}
                    className="text-purple-500 hover:text-purple-700 transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                  <span className="text-gray-500 text-xs">
                    (Expires: {new Date(row.original.token.expiresAt).toLocaleString()})
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedFileIndex(row.index);
                setIsShareOpen(true);
              }}
              className="text-sm font-semibold bg-gradient-to-r from-green-500 to-teal-500 text-white px-3 py-1 rounded-lg hover:from-green-600 hover:to-teal-600 transition-colors shadow-sm"
            >
              Share
            </button>
          </div>
        ),
      },
    ],
    [handleAddEmail, handleGenerateToken, handlePermissionChange, tokenExpiryTimes,editingRowId, newFileName, handleRenameFile]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleShare = () => {
    if (shareEmail) {
      alert(`Sharing ${data[selectedFileIndex].fileName} with ${shareEmail}`);
      setIsShareOpen(false);
      setShareEmail("");
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-r from-indigo-200 via-red-200 to-yellow-100">
      <div className="mx-auto w-fit">
        <h1 className="mb-8 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
          Admin Dashboard
        </h1>
        
        <div className="mb-6 rounded-xl bg-white
 p-6 shadow-xl border-purple-500 border-4">
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-3 h-5 w-5 text-purple-400" />
              <input
                type="text"
                placeholder="Search files..."
                className="w-full rounded-xl border-2 border-purple-700 py-2 pl-10 pr-4 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>
          </div>

          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="rounded-xl">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-semibold text-purple-800 uppercase tracking-wider first:rounded-tl-xl last:rounded-tr-xl"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-purple-100">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-purple-50 transition-colors even:bg-purple-50/30">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <select
                className="rounded-lg border-2 border-violet-500 px-2 py-1 text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
              >
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    Show {pageSize}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg p-1.5 hover:bg-purple-100 transition-colors"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-5 w-5 text-purple-600" />
              </button>
              <button
                className="rounded-lg p-1.5 hover:bg-purple-100 transition-colors"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-5 w-5 text-purple-600" />
              </button>
            </div>
          </div>
        </div>

        <Dialog
          open={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border-4 border-indigo-500">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Share File
                </Dialog.Title>
                <button
                  onClick={() => setIsShareOpen(false)}
                  className="text-gray-500 hover:text-purple-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <input
                type="email"
                placeholder="Enter email address"
                className="w-full rounded-xl border-2 border-violet-600 px-4 py-2 mb-4 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsShareOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-purple-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShare}
                  className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm font-medium text-white hover:from-purple-600 hover:to-blue-600 transition-colors shadow-sm"
                >
                  Send Invite
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPanel;