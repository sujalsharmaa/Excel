import { useState, useMemo,useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
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
import { useSpreadsheetStore } from "../../Store/useStore.js";
import { useAuthStore } from "../../Store/useStore.js";
import NewFileButton from "../NewFileButton.jsx";


const Spinner = ({ color = "text-purple-500", size = "h-5 w-5" }) => (
  <svg
    className={`animate-spin ${color} ${size}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);





const AdminPanel = () => {
  const [generatingToken, setGeneratingToken] = useState(null);
const [deletingFile, setDeletingFile] = useState(null);
const [deletingUser, setDeletingUser] = useState({ fileName: null, email: null });
const [renamingFile, setRenamingFile] = useState(null);
  const { renameFile,deleteUserPermission,deleteFile } = useSpreadsheetStore();
    const {isLoading,setIsLoading} = useAuthStore()
    const {LoadAdminData,UpdateUserPermission,AddEmailToFile,generateToken} = useSpreadsheetStore()
    const [editingRowId, setEditingRowId] = useState(null);
    const [newFileName, setNewFileName] = useState("");
const [data,setData] = useState([]);

  const [globalFilter, setGlobalFilter] = useState("");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [selectedFileIndex, setSelectedFileIndex] = useState(-1);
  const [tokenExpiryTimes, setTokenExpiryTimes] = useState({});


  if (isLoading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Spinner color="text-purple-600" size="h-12 w-12" />
    </div>
  );

  

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setIsLoading(true)
        const backendData = await LoadAdminData();
        const transformedData = transformBackendData(backendData);
        // console.log("tfdata",backendData)
        setData(transformedData);
      } catch (err) {
        console.log(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadAdminData();
  }, []);



  const handleDeleteFile = useCallback(async (fileName) => {
    if (window.confirm(`Are you sure you want to delete ${fileName}?`)) {
      try {
        const newData = await deleteFile(fileName);
        setData(transformBackendData(newData));
      } catch (error) {
        console.error('Failed to delete file:', error);
        alert('Failed to delete file');
      }
    }
  }, [deleteFile]);
  
  const handleDeleteUser = useCallback(async (fileName, email) => {
    if (window.confirm(`Remove ${email} from ${fileName}?`)) {
      try {
        const newData = await deleteUserPermission(fileName, email);
        setData(transformBackendData(newData));
      } catch (error) {
        console.error('Failed to remove user:', error);
        alert('Failed to remove user');
      }
    }
  }, [deleteUserPermission]);


  const transformBackendData = (backendData) => {
    if (!backendData || typeof backendData !== "object") return [];
    return Object.keys(backendData).map((fileName) => {
      const users = Array.isArray(backendData[fileName]) 
        ? backendData[fileName] 
        : [backendData[fileName]];
        
      return {
        fileId: users[0].fileId, // Assuming backend sends file_id
        fileName: users[0].file_name_user,
        authorizedEmails: users[0].permissions.map(p => p.email),
        permissions: users[0].permissions.map(p => 
          p.read_permission && p.write_permission 
            ? "Read + Write" 
            : "Read"
        ),
        lastModified: new Date(users[0].modified_at).toISOString(),
        token: { value: "", expiresAt: null }
      };
    });
  };
  

  //if (isLoading) return <div>Loading...</div>;
  // if (error) return <div>Error: {error}</div>;

  

  const handleRenameFile = useCallback(async (fileId, newName) => {
    try {
      if (fileId === newName) {
        throw new Error('Same name');
      }
      
      const updatedData = await renameFile(fileId, newName);
      setData(transformBackendData(updatedData));
    } catch (error) {
      console.error('Rename failed:', error);
      alert(`Renaming failed: ${error.message}`);
    }
  }, [renameFile]);

  const AddEmailCell = ({ handleAddEmail }) => {
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
              handleAddEmail(localEmail);
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

  const handlePermissionChange = useCallback(async (fileName, email, newPermission) => {
    try {
      const newData = await UpdateUserPermission(
        fileName, 
        email,
        newPermission
      );
      setData(transformBackendData(newData));
    } catch (error) {
      console.error('Failed to update permission:', error);
      // Consider adding error state/notification
    }
  }, [UpdateUserPermission]);

  const handleAddEmail = useCallback(async (fileName, email) => {
    try {
      const newData = await AddEmailToFile(fileName, email, 'Read');
      setData(transformBackendData(newData));
    } catch (error) {
      console.error('Failed to add email:', error);
      // Consider adding error state/notification
    }
  }, [AddEmailToFile]);

  const handleGenerateToken = useCallback(async (fileIndex) => {
    try {
      const fileData = data[fileIndex];
      const time = tokenExpiryTimes[fileIndex] || "10m";
      
      const response = await generateToken(time, fileData.fileName);
      
      setData(prevData => {
        const newData = [...prevData];
        newData[fileIndex] = {
          ...newData[fileIndex],
          token: {
            value: response.token,
            // expiresAt: new Date(response.expiresAt).toISOString()
            expiresAt: response.expiresAt
          }
        };
        return newData;
      });
  
    } catch (error) {
      console.error("Token generation failed:", error);
      alert("Failed to generate token. Please try again.");
    }
  }, [data, tokenExpiryTimes]);

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
                          setRenamingFile(row.original.fileName);
                          handleRenameFile(row.original.fileName, newFileName)
                            .finally(() => setRenamingFile(null));
                          setEditingRowId(null);
                        }}
                        className="p-1 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
                        disabled={renamingFile === row.original.fileName}
                      >
                        {renamingFile === row.original.fileName ? (
                          <Spinner color="text-purple-600" size="h-4 w-4" />
                        ) : (
                          <Save size={16} />
                        )}
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
                      {/* <span className="font-semibold text-gray-800">{row.original.fileName}</span> */}
                      {/* {console.log("my row id =>",row.original)} */}
                      <Link
                  to={`${import.meta.env.VITE_FRONTEND_URL}/file/${row.original.fileId}`}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  {row.original.fileName}
                </Link>
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
            {row.original.authorizedEmails.map((email, idx) => (
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
                  <AddEmailCell 
          row={row} 
          handleAddEmail={(email) => 
            handleAddEmail(row.original.fileName, email)
          } 
        />
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
                  onChange={(e) => 
                    handlePermissionChange(
                      row.original.fileName,
                      email,
                      e.target.value
                    )
                  }
                  className="rounded-lg border-2 border-black px-2 py-1 text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                >
                  <option value="Read">Read</option>
                  <option value="Read + Write">Read + Write</option>
                </select>
                <button
            onClick={() => handleDeleteUser(row.original.fileName, email)}
            disabled={deletingUser.fileName === row.original.fileName && deletingUser.email === email}
            className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
          >
            {deletingUser.fileName === row.original.fileName && deletingUser.email === email ? (
              <Spinner color="text-red-500" size="h-4 w-4" />
            ) : (
              <Trash size={16} />
            )}
          </button>
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
                  disabled={generatingToken === row.index}
                  className="text-sm font-semibold bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 rounded-lg hover:from-green-600 hover:to-blue-600 transition-colors shadow-sm disabled:opacity-50"
                >
                  {generatingToken === row.index ? (
                    <div className="flex items-center gap-2">
                      <Spinner color="text-white" size="h-4 w-4" />
                      Generating...
                    </div>
                  ) : (
                    'Generate Token'
                  )}
                </button>
                <button
                onClick={() => handleDeleteFile(row.original.fileName)}
                disabled={deletingFile === row.original.fileName}
                className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
              >
                {deletingFile === row.original.fileName ? (
                  <Spinner color="text-red-500" size="h-5 w-5" />
                ) : (
                  <Trash size={20} />
                )}
              </button>
              </div>
              {row.original.token.value && (
                <div className="flex items-center gap-1 text-xs bg-purple-50 px-2 py-1 rounded">
                  <span className="text-purple-700">{`${import.meta.env.VITE_FRONTEND_URL}/token/file/${row.original.fileName}/${row.original.token.value}`}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(`${import.meta.env.VITE_FRONTEND_URL}/token/file/${row.original.fileName}/${row.original.token.value}`)}
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
            <div className="relative flex-1 max-w-xl flex">
              
              <Search className="absolute left-3 top-3 h-5 w-5 text-purple-400" />
             
              <input
                type="text"
                placeholder="Search files..."
                className="w-full rounded-xl border-2 border-purple-700 py-2 pl-10 pr-4 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
              
            </div>
            <NewFileButton/>
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
                className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm font-medium text-white hover:from-purple-600 hover:to-blue-600 transition-colors shadow-sm disabled:opacity-50"
                disabled={isLoading} // Add your share loading state here if needed
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Spinner color="text-white" size="h-4 w-4" />
                    Sending...
                  </div>
                ) : (
                  'Send Invite'
                )}
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