import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import "../../../src/index.css";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useSpreadsheetStore } from "../../Store/useStore.js";
import { useAuthStore } from "../../Store/useStore.js";
import NewFileButton from "../NewFileButton.jsx";
import { Search, Copy, Pencil, Save, Trash2, Share2, X, ArrowBigLeft } from "lucide-react";

// Import shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

//cool loading spinner

export const LoadingSpinner = () => (
  <div className="flex h-screen items-center justify-center bg-gray-900">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const AddEmailCell = ({ handleAddEmail }) => {
  const [localEmail, setLocalEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { EmailArray } = useSpreadsheetStore();
  const suggestionRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionRef.current && 
        !suggestionRef.current.contains(event.target) &&
        inputRef.current && 
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (localEmail && !isSubmitting) {
      try {
        setIsSubmitting(true);
        await handleAddEmail(localEmail);
        setLocalEmail("");
        toast.success(`Added ${localEmail} to the file`);
      } catch (error) {
        toast.error(`Failed to add email: Email does not Exist on our Platform`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const emailSuggestions = [...EmailArray]
    .filter((email) => email.toLowerCase().includes(localEmail.toLowerCase()))
    .slice(0, 2); // Show only first 2 suggestions

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="email"
          placeholder="Add email"
          className="w-40 bg-gray-800 text-white"
          value={localEmail}
          onChange={(e) => {
            setLocalEmail(e.target.value);
            setShowSuggestions(e.target.value.length > 0); // Show suggestions when user types
          }}
          disabled={isSubmitting}
          onFocus={() => {
            if (localEmail.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        <Button type="submit" size="sm" disabled={isSubmitting}
        className='bg-teal-600'
        >
          {isSubmitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            "Add"
          )}
        </Button>
      </form>

      {/* Suggestion Dropdown */}
      {showSuggestions && emailSuggestions.length > 0 && (
        <ul
          ref={suggestionRef}
          className="relative mt-1 w-fit bg-gray-800 text-white border border-gray-700 rounded-md shadow-md z-50"
          style={{ zIndex: 1600 }}
        >
          {emailSuggestions.map((email) => (
            <li
              key={email}
              className="p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => {
                setLocalEmail(email);
                setShowSuggestions(false); // Hide suggestions after selection
              }}
            >
              {email}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


const AdminPanel = () => {
  const navigate = useNavigate();
  const [generatingToken, setGeneratingToken] = useState(null);
  const [deletingFile, setDeletingFile] = useState(null);
  const [deletingUser, setDeletingUser] = useState({ fileName: null, email: null });
  const [renamingFile, setRenamingFile] = useState(null);
  const [editingRowId, setEditingRowId] = useState(null);
  const [newFileName, setNewFileName] = useState("");
  const [data, setData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [selectedFileIndex, setSelectedFileIndex] = useState(-1);
  const [tokenExpiryTimes, setTokenExpiryTimes] = useState({});
  const [error, setError] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);


  const { renameFile, deleteUserPermission, deleteFile, sendEmailFileLink } = useSpreadsheetStore();
  const { isLoading, setIsLoading,user } = useAuthStore();
  const { LoadAdminData, UpdateUserPermission, AddEmailToFile, generateToken } = useSpreadsheetStore();

  const gradients = [
   "linear-gradient(135deg, #FF0000 0%, #FF7F00 100%)",  // Red to Orange
    "linear-gradient(135deg, #FF7F00 0%, #FFFF00 100%)",  // Orange to Yellow
    "linear-gradient(135deg, #FFFF00 0%, #00FF00 100%)",  // Yellow to Green
    "linear-gradient(135deg, #00FF00 0%, #0000FF 100%)",  // Green to Blue
    "linear-gradient(135deg, #0000FF 0%, #4B0082 100%)",  // Blue to Indigo
    "linear-gradient(135deg, #4B0082 0%, #9400D3 100%)",  // Indigo to Violet
    "linear-gradient(135deg, #9400D3 0%, #EE82EE 100%)", // Violet to Violet(Light)
    "linear-gradient(135deg, #8A2BE2 0%, #4B0082 100%)", // Violet to Indigo(Dark)
    "linear-gradient(135deg, #FF6347 0%, #FFD700 100%)", // Tomato to Gold
    "linear-gradient(135deg, #00CED1 0%, #1E90FF 100%)", // Dark Turquoise to Dodger Blue
    "linear-gradient(135deg, #8B008B 0%, #DA70D6 100%)", // Dark Magenta to Orchid
    "linear-gradient(135deg, #32CD32 0%, #98FB98 100%)", // LimeGreen to PaleGreen
    "linear-gradient(135deg, #FFA500 0%, #FFFFE0 100%)", // Orange to LightYellow
    "linear-gradient(135deg, #CD5C5C 0%, #F08080 100%)", // IndianRed to LightCoral
    "linear-gradient(135deg, #708090 0%, #D3D3D3 100%)"  // SlateGray to LightGray
];
  
  const UserProfile = ({ user }) => {
    const randomGradient = useMemo(() => {
      return gradients[Math.floor(Math.random() * gradients.length)];
    }, []);
  
    return (
      <img
        className="absolute right-1 w-24 h-24 rounded-full"
        src={user.imageurl}
        alt="User Profile"
        style={{
          borderRadius: "50%",
          padding: "4px",
          border: "4px solid transparent",
          background: `linear-gradient(white, white) padding-box, ${randomGradient} border-box`,
        
        }}
      />
    );
  };
  

  const transformBackendData = useCallback((backendData) => {
    if (!backendData || typeof backendData !== "object") return [];
    
    return Object.entries(backendData).map(([_, fileData]) => {
      const users = Array.isArray(fileData) ? fileData : [fileData];
      const firstUser = users[0];
      
      if (!firstUser) return null; // Skip if no user data
      
      return {
        fileId: firstUser.fileId,
        fileName: firstUser.file_name_user,
        authorizedEmails: firstUser.permissions.map(p => p.email),
        permissions: firstUser.permissions.map(p => 
          p.read_permission && p.write_permission ? "Read + Write" : "Read"
        ),
        lastModified: new Date(firstUser.modified_at).toISOString(),
        token: { value: "", expiresAt: null }
      };
    }).filter(Boolean); // Remove any null entries
  }, []);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const backendData = await LoadAdminData();
        const transformedData = transformBackendData(backendData);
        setData(transformedData);
      } catch (err) {
        setError(err.message);
        console.error("Failed to load admin data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAdminData();
  }, [LoadAdminData, setIsLoading, transformBackendData]);

  const handleDeleteFile = useCallback(async (fileName) => {
    try {
      setDeletingFile(fileName);
      const newData = await deleteFile(fileName);
      setData(transformBackendData(newData));
      toast.success("File deleted successfully");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast.error("Failed to delete file");
    } finally {
      setDeletingFile(null);
      setFileToDelete(null);
    }
  }, [deleteFile, transformBackendData]);

  const handleDeleteUser = useCallback(async (fileName, email) => {
    try {
      setDeletingUser({ fileName, email });
      const newData = await deleteUserPermission(fileName, email);
      setData(transformBackendData(newData));
      toast.success("User removed successfully");
    } catch (error) {
      console.error('Failed to remove user:', error);
      toast.error("Failed to remove User");
    } finally {
      setDeletingUser({ fileName: null, email: null });
    }
  }, [deleteUserPermission, transformBackendData, toast]);

  const handleRenameFile = useCallback(async (fileId, newName) => {
    if (!newName.trim()) {
toast.error("File Name cannot be Empty")
      return;
    }

    try {
      setRenamingFile(fileId);
      const updatedData = await renameFile(fileId, newName);
      setData(transformBackendData(updatedData));
      setEditingRowId(null);
toast.success("File renamed successfully")
    } catch (error) {
      console.error('Rename failed:', error);
toast.error("Failed to rename file")
    } finally {
      setRenamingFile(null);
    }
  }, [renameFile, transformBackendData, toast]);

  const handleGenerateToken = useCallback(async (fileIndex) => {
    try {
      setGeneratingToken(fileIndex);
      const fileData = data[fileIndex];
      const time = tokenExpiryTimes[fileIndex] || "10m";
      
      const response = await generateToken(time, fileData.fileName);
      
      setData(prevData => {
        const newData = [...prevData];
        newData[fileIndex] = {
          ...newData[fileIndex],
          token: {
            value: response.url,
            expiresAt: response.expiresAt
          }
        };
        return newData;
      });

toast.success("Token generated successfully")
    } catch (error) {
      console.error("Token generation failed:", error);
toast.error("Failed to generate Token")
    } finally {
      setGeneratingToken(null);
    }
  }, [data, tokenExpiryTimes, generateToken, toast]);

  const handleShare = useCallback(async () => {
    if (!shareEmail || !shareEmail.includes('@')) {
toast.error("Please Enter a Valid Email")
      return;
    }
  
    try {
      const fileId = data[selectedFileIndex].fileId;
      const fileName = data[selectedFileIndex].fileName
      console.log(data[selectedFileIndex].fileName)
      await AddEmailToFile(data[selectedFileIndex].fileName, shareEmail, 'Read');
      await sendEmailFileLink(shareEmail, fileId,fileName);
      
      setIsShareOpen(false);
      setShareEmail("");
toast.success("file send successfully")
    } catch (error) {
      console.error('Failed to share file:', error);
toast.error("failed to send file")
    }
  }, [shareEmail, selectedFileIndex, data, AddEmailToFile, sendEmailFileLink, toast]);

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
                <div className="flex items-center gap-2">
                <Input
                  value={newFileName}
                  onChange={(e) => {
                    // Limit input to 50 characters
                    if (e.target.value.length <= 50) {
                      setNewFileName(e.target.value);
                    }
                  }}
                  maxLength={50}
                  className="w-40 bg-gray-700 text-white border-gray-600"
                  autoFocus
                />
                {newFileName.length > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    {newFileName.length}/50 characters
                  </div>
                )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRenameFile(row.original.fileName, newFileName)}
                    disabled={renamingFile === row.original.fileName}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    {renamingFile === row.original.fileName ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingRowId(null)}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to={`${import.meta.env.VITE_FRONTEND_URL}/file/${row.original.fileId}`}
                    className="font-medium text-gray-100 hover:underline bg-green-700 rounded-md py-1 px-2"
                  >
                    {row.original.fileName}
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setNewFileName(row.original.fileName);
                      setEditingRowId(row.index);
                    }}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        },
      },
// Replace the current "Authorized Emails" cell with this implementation
{
  accessorKey: "authorizedEmails",
  header: "Authorized Emails",
  cell: ({ row }) => {
    // Use a shared state from a context or pass down from the parent component
    // This example assumes you'll add this state to your component
    const [currentPage, setCurrentPage] = useState(0);
    const emailsPerPage = 5;
    
    const emails = row.original.authorizedEmails;
    const totalEmails = emails.length;
    const totalPages = Math.ceil(totalEmails / emailsPerPage);
    
    // Display emails for the current page
    const startIndex = currentPage * emailsPerPage;
    const endIndex = Math.min(startIndex + emailsPerPage, totalEmails);
    const displayEmails = emails.slice(startIndex, endIndex);
    
    return (
      <div className="flex flex-col w-60">
        <div className="gap-2 flex-col">
          {displayEmails.map((email, idx) => (
            <Badge 
              key={idx} 
              variant="secondary" 
              className="mr-2 my-2 bg-blue-600 rounded-md text-gray-200 px-2 py-1"
            >
              {email}
            </Badge>
          ))}
        </div>
        
        {totalEmails > emailsPerPage && (
          <div className="flex items-center justify-between mt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              className="p-1 h-8 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Previous
            </Button>
            
            <span className="text-xs text-gray-400">
              {startIndex + 1}-{endIndex} of {totalEmails}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              className="p-1 h-8 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Next
            </Button>
          </div>
        )}

        {/* Store the current page in a data attribute for other cells to access */}
        <div data-row-page={`${row.index}-${currentPage}`} className="hidden" />
      </div>
    );
  },
},
      {
        header: "Add Email",
        cell: ({ row }) => (
          <AddEmailCell 
                handleAddEmail={async (email) => {
                  try {
                    const newData = await AddEmailToFile(row.original.fileName, email, 'Read');
                    // Update the data state with the transformed new data
                    setData(transformBackendData(newData));
                    return true;
                  } catch (error) {
                    console.error('Error adding email:', error);
                    throw error;
                  }
                }}
                fileId={row.original.fileId}
              />
        ),
      },
      {
        accessorKey: "permissions",
        header: "Permissions",
        cell: ({ row }) => {
          // Access the same page state that's used in the emails cell
          // For this example, we'll use a ref to read the data attribute set by the emails cell
          const [updatingPermission, setUpdatingPermission] = useState({ fileName: "", email: "" });
          const [currentPage, setCurrentPage] = useState(0);
          const emailsPerPage = 5;
          
          // Use effect to keep the pagination state in sync with the emails cell
          useEffect(() => {
            const syncPagination = () => {
              const dataAttr = document.querySelector(`[data-row-page^="${row.index}-"]`);
              if (dataAttr) {
                const pageValue = dataAttr.getAttribute('data-row-page').split('-')[1];
                setCurrentPage(parseInt(pageValue, 10));
              }
            };
            
            // Initial sync
            syncPagination();
            
            // Set up observer to detect changes
            const observer = new MutationObserver(syncPagination);
            observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['data-row-page'] });
            
            return () => observer.disconnect();
          }, [row.index]);
          
          // Calculate the same slice of emails/permissions as the emails cell
          const startIndex = currentPage * emailsPerPage;
          const endIndex = Math.min(startIndex + emailsPerPage, row.original.authorizedEmails.length);
          const displayEmails = row.original.authorizedEmails.slice(startIndex, endIndex);
          const displayPermissions = row.original.permissions.slice(startIndex, endIndex);
          
          return (
            <div className="space-y-2">
              {displayEmails.map((email, idx) => {
                const permission = displayPermissions[idx];
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <Select
                      value={permission}
                      onValueChange={async (value) => {
                        // Set the updating state to show the spinner
                        setUpdatingPermission({ 
                          fileName: row.original.fileName, 
                          email: email 
                        });
                        
                        try {
                          const updatedData = await UpdateUserPermission(
                            row.original.fileName, 
                            email, 
                            value
                          );
                          // Update the data state with the transformed new data
                          setData(transformBackendData(updatedData));
                          toast.success(`Permission updated for ${email}`);
                        } catch (error) {
                          console.error('Error updating permission:', error);
                          toast.error(`Failed to update permission: ${error.message}`);
                        } finally {
                          // Clear the updating state when done
                          setUpdatingPermission({ fileName: "", email: "" });
                        }
                      }}
                      disabled={updatingPermission.fileName === row.original.fileName && updatingPermission.email === email}
                    >
                      <SelectTrigger className="w-32 bg-gray-700 text-white border-gray-600">
                        {updatingPermission.fileName === row.original.fileName && updatingPermission.email === email ? (
                          <div className="flex items-center justify-center w-full">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          </div>
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 text-white border-gray-600">
                        <SelectItem value="Read" className="hover:bg-gray-700">Read</SelectItem>
                        <SelectItem value="Read + Write" className="hover:bg-gray-700">Read + Write</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="destructive"
                      className='bg-red-700'
                      onClick={() => handleDeleteUser(row.original.fileName, email)}
                      disabled={deletingUser.fileName === row.original.fileName && deletingUser.email === email}
                    >
                      {deletingUser.fileName === row.original.fileName && deletingUser.email === email ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          );
        },
      },
      {
        accessorKey: "lastModified",
        header: "Last Modified",
        cell: ({ row }) => (
          <span className="text-gray-400">
            {new Date(row.original.lastModified).toLocaleString()}
          </span>
        ),
      },
      {
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Select
                value={tokenExpiryTimes[row.index] || "10m"}
                onValueChange={(value) => {
                  setTokenExpiryTimes(prev => ({
                    ...prev,
                    [row.index]: value
                  }));
                }}
              >
                <SelectTrigger className="w-24 bg-gray-700 text-white border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-600">
                <SelectItem value="1m" className="hover:bg-gray-700">1m</SelectItem>
                  <SelectItem value="10m" className="hover:bg-gray-700">10m</SelectItem>
                  <SelectItem value="1h" className="hover:bg-gray-700">1h</SelectItem>
                  <SelectItem value="1d" className="hover:bg-gray-700">1d</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                onClick={() => handleGenerateToken(row.index)}
                disabled={generatingToken === row.index}
                className="bg-gray-600 text-white hover:bg-gray-700"
              >
                {generatingToken === row.index ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                ) : null}
                Generate Token
              </Button>
              <Button
                    size="icon"
                    variant="destructive"
                    className='bg-red-700'
                    onClick={() => {
                      setFileToDelete(row.original.fileName);
                      setIsDeleteDialogOpen(true);
                    }}
                    disabled={deletingFile === row.original.fileName}
                  >
                    {deletingFile === row.original.fileName ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
            </div>
            {row.original.token.value && (
              <div className="flex items-center rounded-md bg-gray-700 p-2 text-md">
                <span className="truncate text-gray-200 w-36">{row.original.token.value}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(row.original.token.value);
toast.success("copied to clipboard")
                  }}
                  className="text-gray-300 hover:text-white hover:bg-gray-600"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFileIndex(row.index);
                setIsShareOpen(true);
              }}
              className="border-gray-600 bg-gray-700 text-white hover:bg-gray-800"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        ),
      },
    ],
    [editingRowId, newFileName, renamingFile, handleRenameFile, deletingUser, handleDeleteUser, 
     deletingFile, handleDeleteFile, generatingToken, handleGenerateToken, tokenExpiryTimes, 
     UpdateUserPermission, AddEmailToFile, toast]
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <Card className="w-96 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8 p-8 bg-gray-900 text-white">
      <div className="container mx-auto">
        <Card className="border-gray-700 bg-gray-800">
          <CardHeader>
          <CardTitle className="text-3xl font-bold flex flex-col gap-2 text-white justify-center relative p-4">
  <button
    onClick={() => navigate(-1)}
    className="absolute left-4 top-4 hover:text-primary transition-colors"
  >
    <ArrowBigLeft size={40} />
  </button>

  <div className="flex flex-col items-center">
<UserProfile user={user}/>
  <span>{user.display_name} Admin Dashboard</span>
</div>



  <CardDescription className="text-gray-400 text-center">
    Manage your files, permissions, and sharing settings
  </CardDescription>

  <CardDescription className="text-gray-400 text-center">
    {user.email}
  </CardDescription>
</CardTitle>


          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search files..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9 bg-gray-700 text-white border-gray-600"
                />
              </div>
              <NewFileButton />
            </div>

            <ScrollArea className="rounded-md border border-gray-700 h-[calc(100vh-300px)]">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="border-gray-700">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="text-gray-400">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-gray-400"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="border-gray-700">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="text-gray-300">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </span>
                <Select
                  value={String(table.getState().pagination.pageSize)}
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger className="w-32 bg-gray-700 text-white border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white border-gray-600">
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={String(pageSize)} className="hover:bg-gray-700">
                        Show {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
          <DialogContent className="bg-gray-800 border border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Share File</DialogTitle>
              <DialogDescription className="text-gray-400">
                Enter an email address to share this file with
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                type="email"
                placeholder="Enter email address"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsShareOpen(false)}
                className="border-gray-600 text-black hover:bg-gray-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button
               className='bg-green-500'
              onClick={handleShare}>Share</Button>
            </DialogFooter>
          </DialogContent>
                </Dialog>

                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-gray-800 border border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Confirm Deletion</DialogTitle>
              <DialogDescription className="text-gray-400">
                Are you sure you want to delete the file "{fileToDelete}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex items-center justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="border-gray-600 text-black hover:bg-gray-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteFile(fileToDelete)}
                disabled={deletingFile === fileToDelete}
                className='bg-red-600'
              >
                {deletingFile === fileToDelete ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                ) : null}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPanel;