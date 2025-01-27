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
import { Search, ChevronLeft, ChevronRight, Copy, X } from "react-feather";

const AdminPanel = () => {
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
  const [newEmailInputs, setNewEmailInputs] = useState({});
  const [tokenExpiryTimes, setTokenExpiryTimes] = useState({});

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
        cell: ({ row }) => (
          <div className="font-medium text-gray-900">{row.getValue("fileName")}</div>
        ),
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
              <li className="text-sm text-gray-500">
                + {row.original.authorizedEmails.length - 3} more...
              </li>
            )}
          </ul>
        ),
      },
      {
        header: "Add Email",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Add email"
              className="border rounded px-2 py-1 text-sm w-32"
              value={newEmailInputs[row.index] || ""}
              onChange={(e) => {
                const newInputs = { ...newEmailInputs };
                newInputs[row.index] = e.target.value;
                setNewEmailInputs(newInputs);
              }}
            />
            <button
              onClick={() => {
                const email = newEmailInputs[row.index];
                if (email) {
                  handleAddEmail(row.index, email);
                  const newInputs = { ...newEmailInputs };
                  delete newInputs[row.index];
                  setNewEmailInputs(newInputs);
                }
              }}
              className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        ),
      },
      {
        accessorKey: "permissions",
        header: "Permissions",
        cell: ({ row }) => (
          <ul className="space-y-2">
            {row.original.authorizedEmails.map((email, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="text-sm">{email}:</span>
                <select
                  value={row.original.permissions[idx]}
                  onChange={(e) => handlePermissionChange(row.index, idx, e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
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
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="10m">10m</option>
                  <option value="1h">1h</option>
                  <option value="1d">1d</option>
                </select>
                <button
                  onClick={() => handleGenerateToken(row.index)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Generate Token
                </button>
              </div>
              {row.original.token.value && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-600">{row.original.token.value}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(row.original.token.value)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Copy size={14} />
                  </button>
                  <span className="text-gray-500">
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
              className="text-sm font-medium text-green-600 hover:text-green-800"
            >
              Share
            </button>
          </div>
        ),
      },
    ],
    [handleAddEmail, handleGenerateToken, handlePermissionChange, newEmailInputs, tokenExpiryTimes]
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Admin Panel</h1>
        
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:ring-blue-500"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>
          </div>

          <table className="mt-4 w-full">
            <thead className="border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-900"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
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
              <span className="text-sm text-gray-700">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <select
                className="rounded border border-gray-300 px-2 py-1 text-sm"
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
                className="rounded p-1 hover:bg-gray-100"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <button
                className="rounded p-1 hover:bg-gray-100"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <Dialog
          open={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-semibold">
                  Share File
                </Dialog.Title>
                <button
                  onClick={() => setIsShareOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <input
                type="email"
                placeholder="Enter email address"
                className="w-full rounded border border-gray-300 px-4 py-2 mb-4"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsShareOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShare}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Send
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