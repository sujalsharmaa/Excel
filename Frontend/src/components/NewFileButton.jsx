import React, { useState, useRef, useEffect } from 'react';
import { FileText, Plus, X, User,Smile, Upload, ChevronLeft, ChevronRight, Wand } from 'lucide-react';
import { useSpreadsheetStore } from "../Store/useStore.js";
import { Button } from "@/components/ui/button";
import EmojiPicker from "emoji-picker-react";

const NewFileButton = () => {
  const { createFile, EmailArray } = useSpreadsheetStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [users, setUsers] = useState([{ email: '', permission: 'view' }]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkUsers, setBulkUsers] = useState([]);
  const [bulkPermission, setBulkPermission] = useState('view');
  const [currentPage, setCurrentPage] = useState(1);
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const suggestionRefs = useRef([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const addEmoji = (emojiObject) => {
    setFileName((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };
  
  const MAX_INDIVIDUAL_USERS = 5;
  const USERS_PER_PAGE = 5; // Number of bulk users to show per page

  // Calculate total pages for pagination
  const totalPages = Math.ceil(bulkUsers.length / USERS_PER_PAGE);
  
  // Get current page's users
  const getCurrentPageUsers = () => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    const endIndex = startIndex + USERS_PER_PAGE;
    return bulkUsers.slice(startIndex, endIndex);
  };

  // Navigation functions
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // For debugging purposes
  useEffect(() => {
    if (EmailArray) {
      console.log("Available emails for suggestions:", EmailArray);
    }
  }, [EmailArray]);

  // Reset page when bulk users change
  useEffect(() => {
    setCurrentPage(1);
  }, [bulkUsers.length]);

  const handleAddUser = () => {
    if (users.length < MAX_INDIVIDUAL_USERS) {
      setUsers([...users, { email: '', permission: 'view' }]);
    }
  };

  const handleRemoveUser = (index) => {
    const newUsers = users.filter((_, i) => i !== index);
    setUsers(newUsers);
  };

  const handleUserChange = (index, field, value) => {
    const newUsers = [...users];
    newUsers[index] = { ...newUsers[index], [field]: value };
    setUsers(newUsers);
    
    if (field === 'email') {
      setActiveSuggestionIndex(index);
      setShowSuggestions(true);
    }
  };

  const getEmailSuggestions = (userEmail) => {
    if (!EmailArray || !Array.isArray(EmailArray)) {
      console.error("EmailArray is not available or not an array:", EmailArray);
      return [];
    }
    
    if (!userEmail) return [];
    
    return EmailArray
      .filter((email) => email.toLowerCase().includes(userEmail.toLowerCase()))
      .slice(0, 3);
  };

  const handleSelectSuggestion = (index, email) => {
    const newUsers = [...users];
    newUsers[index] = { ...newUsers[index], email };
    setUsers(newUsers);
    setShowSuggestions(false);
  };

  const handleClickOutside = (e) => {
    if (suggestionRefs.current) {
      const clickedInside = suggestionRefs.current.some(
        ref => ref && ref.contains(e.target)
      );
      
      if (!clickedInside) {
        setShowSuggestions(false);
      }
    }
  };

  const handleBulkAdd = () => {
    if (!bulkEmails.trim()) return;
    
    // Split by comma, newline, or space and filter out empty strings
    const emailList = bulkEmails
      .split(/[\s,;]+/)
      .map(email => email.trim())
      .filter(email => email !== '');
    
    // Create new user objects for each valid email with the selected bulk permission
    const newBulkUsers = emailList.map(email => ({ 
      email, 
      permission: bulkPermission 
    }));
    
    // Add to existing bulk users
    setBulkUsers([...bulkUsers, ...newBulkUsers]);
    setBulkEmails('');
    setShowBulkAdd(false);
  };
  
  const handleRemoveBulkUser = (index) => {
    const globalIndex = (currentPage - 1) * USERS_PER_PAGE + index;
    const newBulkUsers = bulkUsers.filter((_, i) => i !== globalIndex);
    setBulkUsers(newBulkUsers);
    
    // If we remove the last item on a page, go to the previous page (unless we're on page 1)
    if (getCurrentPageUsers().length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleBulkUserPermissionChange = (index, permission) => {
    const globalIndex = (currentPage - 1) * USERS_PER_PAGE + index;
    const newBulkUsers = [...bulkUsers];
    newBulkUsers[globalIndex] = { ...newBulkUsers[globalIndex], permission };
    setBulkUsers(newBulkUsers);
  };

  // Function to update all bulk users' permissions at once
  const handleBulkPermissionChange = (permission) => {
    setBulkPermission(permission);
    
    // If there are already bulk users, update their permissions
    if (bulkUsers.length > 0) {
      const updatedBulkUsers = bulkUsers.map(user => ({
        ...user,
        permission
      }));
      setBulkUsers(updatedBulkUsers);
    }
  };

  // Function to generate a random cool name
  const generateRandomName = async () => {
    try {
      setIsGeneratingName(true);
      
      // Call the random name generator API
      const response = await fetch('https://api.namefake.com/english-united-states/random');
      
      if (!response.ok) {
        throw new Error('Failed to generate name');
      }
      
      const data = await response.json();
      
      // Create a cool file name - you can customize this format
      const adjectives = [
        "Awesome", "Brilliant", "Creative", "Dynamic", "Epic", "Fantastic", "Genius", "Heroic", "Innovative", "Legendary",
        "Majestic", "Next-Level", "Outstanding", "Powerful", "Quirky", "Remarkable", "Spectacular", "Thrilling", "Unique",
        "Vibrant", "Witty", "Xtraordinary", "Youthful", "Zesty", "Adventurous", "Bold", "Clever", "Daring", "Energetic",
        "Fierce", "Graceful", "Hilarious", "Impressive", "Jazzy", "Keen", "Lively", "Mysterious", "Noble", "Optimistic",
        "Phenomenal", "Quizzical", "Radiant", "Savage", "Tremendous", "Uplifting", "Versatile", "Whimsical", "Xenial",
        "Yummy", "Zealous", "Ambitious", "Bizarre", "Colossal", "Dazzling", "Enigmatic", "Fearless", "Glamorous", "Hyper",
        "Ingenious", "Jubilant", "Kinetic", "Limitless", "Magnetic", "Noteworthy", "Omniscient", "Passionate", "Quick",
        "Resilient", "Suave", "Trailblazing", "Unstoppable", "Vivid", "Wondrous", "Xceptional", "Youthful", "Zany",
        "Astonishing", "Breathtaking", "Charismatic", "Delightful", "Electrifying", "Flamboyant", "Gracious", "Harmonious",
        "Illustrious", "Jolly", "Kindhearted", "Luxurious", "Mind-Blowing", "Neon", "Optimized", "Prodigious", "Quirky",
        "Resplendent", "Scintillating", "Transcendent", "Urbane", "Vivacious", "Wild", "Xciting", "Yearning", "Zen",
        "Astounding", "Booming", "Crucial", "Defiant", "Euphoric", "Fearless", "Gargantuan", "High-Octane", "Immaculate",
        "Jazzy", "Kooky", "Lush", "Mighty", "Nonchalant", "Omnipotent", "Phenomenal", "Quakeproof", "Ravishing", "Swanky",
        "Thrilling", "Unorthodox", "Vortex", "Warp-Speed", "Xpert-Level", "Yellowish", "Zodiacal",
        // Add more as needed...
      ];
      
      const fileTypes = [
        "Document", "Spreadsheet", "Project", "Report", "Analysis", "Plan", "Proposal", "Blueprint", "Diagram", "Design",
        "Presentation", "Whitepaper", "Strategy", "Dashboard", "Workflow", "DataSet", "Infographic", "Guide", "Handbook",
        "Manifesto", "Memo", "Thesis", "Summary", "Codebase", "Dataset", "Workflow", "Ledger", "Evaluation", "Sketch",
        "Storyboard", "Prototype", "Flowchart", "Mockup", "Portfolio", "Checklist", "Manifest", "CaseStudy", "Audit",
        "Overview", "Worksheet", "Research", "Contract", "Invoice", "Budget", "PitchDeck", "Estimate", "Forecast",
        "Reference", "Assessment", "Forecast", "Diagram", "Form", "Tutorial", "Training", "Agenda", "Minutes", "Journal",
        "Narrative", "Equation", "SOP", "Policy", "Comparative", "Tracker", "Planner", "Prospectus", "Briefing",
        "Consultation", "Dashboard", "Ledger", "Index", "Registry", "Formula", "Roadmap", "Inventory", "Compilation",
        "Scorecard", "Methodology", "Infograph", "Postmortem", "Study", "Synopsis", "Blueprint", "Artifact", "Playbook",
        "Milestone", "StrategyDoc", "Specification", "Handbook", "Guidebook", "Rulebook", "Observations", "Checklist",
        "Flowchart", "Mindmap", "Storyboard", "Annotation", "Transcript", "Biography", "Chronology", "Dataset", "BalanceSheet",
        "Guidelines", "Framework", "Schedule", "Instructions", "Timetable", "Statement", "FactSheet", "ResearchPaper",
        "ExamSheet", "SummarySheet", "FormulaSheet", "Notes", "Compilation", "LectureNotes", "MinutesOfMeeting", "Contract",
        "Outline", "Procedural", "Schematic", "PresentationDeck", "ReferenceManual", "Workbook", "Worksheet", "Journal",
        "Thesis", "WhitePaper", "Proposal", "Diagnostic", "Checkup", "Mapping", "Experiment", "Observations", "Factbook",
        "Diagnostics", "Survey", "LedgerEntry", "ProjectCharter", "GovernanceDoc", "Playbook", "Hypothesis", "StudyNotes",
        "Transcript", "UserManual", "Instructions", "Guideline", "Planning", "Workbook", "Scorecard", "Synopsis",
        "Equations", "FieldNotes", "Postmortem", "Narrative", "Assessment", "EmpiricalStudy", "Dissertation", "PolicyBrief",
        "BriefingNote", "ReportCard", "OutcomeAnalysis", "SummaryReport", "InvestigativeReport",
        // Add more as needed...
      ];
      
      
      const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      const randomFileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
      
      // Extract just the first name from the API response and create a cool file name
      const firstName = data.name.split(' ')[0];
      const coolName = `${randomAdjective} ${firstName}'s ${randomFileType}`;
      
      setFileName(coolName);
    } catch (error) {
      console.error('Error generating random name:', error);
      // Fallback to a default cool name if the API fails
      const fallbackNames = [
        // 🚀 Futuristic & Tech-Themed
        '🚀 NeoGrid 9000', '🧠 Quantum Matrix', '💻 CyberSheet X', '🌐 DataVerse', '🤖 AI-Powered Ledger',
        '⚡ HyperSync Spreadsheet', '✨ Stellar Data Vault', '🔗 Fusion Grid', '🕸️ Neural Cells', '🛰️ AstroSync',
      
        // 📊 Business & Finance-Oriented
        '📈 Profit Tracker Pro', '📊 Revenue Radar', '💰 Market Metrics', '📉 Growth Grid', '💵 Sales Pulse',
        '💳 Expense Insights', '🏦 Capital Compass', '📂 Financial Navigator', '💼 Budget Master', '🔢 Cash Flow Dynamics',
      
        // 🌌 Space & Science Inspired
        '🌠 Cosmic Ledger', '🌌 Galactic Dashboard', '☄️ Nebula Records', '🔭 Astro Metrics', '🌟 StarCluster Data',
        '🔮 Orion Grid', '✨ Pulsar Profits', '🖤 Dark Matter Sheet', '🌎 Gravity Sync', '⚛️ Quantum Calc',
      
        // 🏆 Epic & Power-Oriented
        '🦾 Titan Ledger', '🔺 Apex Grid', '🔒 The Vault', '🏆 Victory Sheets', '♾️ Infinity Matrix',
        '🏛️ Olympus Records', '🔥 Phoenix Data', '💪 PowerSheet Elite', '🥇 Champion’s Ledger', '👑 Empire Dashboard',
      
        // 🔥 Creative & Fun
        '🦖 Spreadsheetzilla', '🎖️ Grid of Legends', '⚡ Turbo Table', '🏅 The Ultimate Ledger', '🎭 The Organized Chaos',
        '😂 Sheet Happens', '🥋 DataDojo', '🧙‍♂️ The Wise Cells', '🧘 Spreadsheet Nirvana', '🛡️ The Almighty Grid',
      
        // 🛠 Productivity & Project Management
        '📝 Task Tracker Pro', '⏳ Deadline Dashboard', '🔄 Agile Grid', '⚙️ SmartSheet Pro', '📌 WorkFlow Sync',
        '📋 TaskMaster Ledger', '🚀 Productivity PowerSheet', '📅 Priority Grid', '🎯 Milestone Tracker', '📊 KPI Commander',
      
        // 💡 AI & Automation Focused
        '🤖 AutoGrid AI', '🧠 Smart Cells', '📡 Predictive Ledger', '🕹️ Machine Learning Matrix', '🛠️ AI Data Core',
        '🕵️‍♂️ Neural Grid', '🤯 Sentient Spreadsheet', '⚡ Automated Workflow Sheet', '📡 DataBot Records', '🤖 AI-Powered Dashboard',
      
        // 🎨 Minimalist & Professional
        '✨ Clarity Grid', '📂 DataWorks', '📑 Structured Insights', '📋 GridSense', '🛠 Prime Sheet',
        '🎩 Elegant Ledger', '📜 Sleek Spreadsheet', '📏 Precision Matrix', '📄 Minimalist Metrics', '📁 Organized Sheets',
      
        // 🚀 More Random Cool Names
        '🌪 SheetStorm', '⚡ Turbo Table Pro', '📊 Mega Metrics', '🔍 Data Pulse', '🧠 Brainy Grid',
        '🔬 Insight Ledger', '🧠 MasterMind Sheets', '🧩 GridX', '🖥 SheetMaster 5000', '🌟 The Ultimate Table',
      
        // 🔄 Your Original Names
        '🌟 Stellar Project X', '🧑‍🔬 Quantum Worksheet', '🚀 Awesome Document 3000', '🏅 Epic Spreadsheet', '🪐 Cosmic Data File'
      ];
      
      
      setFileName(fallbackNames[Math.floor(Math.random() * fallbackNames.length)]);
    } finally {
      setIsGeneratingName(false);
    }
  };

  useEffect(() => {
    // Add event listener when the component mounts
    document.addEventListener('mousedown', handleClickOutside);
    
    // Remove event listener when the component unmounts
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError('');
  
      if (!fileName.trim()) {
        throw new Error('File name is required');
      }
      
      // Filter out empty email entries from individual users
      const validIndividualUsers = users.filter(user => user.email.trim() !== '');
      
      // Combine individual and bulk users
      const allUsers = [...validIndividualUsers, ...bulkUsers];
  
      const result = await createFile(fileName, allUsers);
  
      if (result.success === false) {
        console.log("my error =>", result);
        throw new Error(result.error);
      }
  
      setIsOpen(false);
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to create file');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFileName('');
    setUsers([{ email: '', permission: 'view' }]);
    setShowSuggestions(false);
    setBulkEmails('');
    setBulkUsers([]);
    setShowBulkAdd(false);
    setBulkPermission('view');
    setCurrentPage(1);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-[6px] bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
      >
        <Plus size={20} />
        <FileText size={20} />
        <span>New File</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800">Create New File</h2>
              <p className="text-gray-600 mt-1">Enter file details and optionally set user permissions</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
                <div className="flex gap-2">

                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Enter file name"
                    className="flex-1 px-3 py-2 border-2 border-black rounded-md focus:ring-2 focus:ring-green-500 focus:border-2 border-black-green-500 text-black"
                  />
                {showEmojiPicker && (
              <div className="absolute bottom mt-10 z-50">
                <EmojiPicker onEmojiClick={addEmoji} />
              </div>
            )}
            <Button type="button" variant="ghost" size="sm" className="p-2 h-10 w-10 bg-yellow-500" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              <Smile className="text-white bg-yellow-500"/>
            </Button>
                  <button
                    onClick={generateRandomName}
                    disabled={isGeneratingName}
                    className={`px-3 py-1 rounded-md flex items-center justify-center ${
                      isGeneratingName
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                    }`}
                    title="Generate cool name"
                  >
                    {isGeneratingName ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      <Wand size={18} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">User Permissions (Optional)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkAdd(!showBulkAdd)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      <Upload size={16} />
                      Bulk Add
                    </button>
                    {users.length < MAX_INDIVIDUAL_USERS && (
                      <button
                        type="button"
                        onClick={handleAddUser}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-md"
                      >
                        <Plus size={16} />
                        Add User
                      </button>
                    )}
                  </div>
                </div>

                {/* Bulk Add Section */}
                {showBulkAdd && (
                  <div className="p-3 border-2 border-blue-200 rounded-md bg-blue-50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Multiple Emails
                      <span className="text-xs ml-2 text-gray-500">
                        (Separate by commas, spaces, or new lines)
                      </span>
                    </label>
                    <textarea
                      value={bulkEmails}
                      onChange={(e) => setBulkEmails(e.target.value)}
                      placeholder="user1@example.com, user2@example.com"
                      className="w-full px-3 py-2 border-2 border-black rounded-md focus:ring-2 focus:ring-blue-500 text-black mb-2"
                      rows={3}
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Default permission:</label>
                        <select
                          value={bulkPermission}
                          onChange={(e) => handleBulkPermissionChange(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-xs text-black"
                        >
                          <option value="view">View</option>
                          <option value="edit">Edit</option>
                        </select>
                      </div>
                      <button 
                        onClick={handleBulkAdd}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm"
                      >
                        Add Emails
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Display bulk added users with pagination */}
                {bulkUsers.length > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Bulk Added Users ({bulkUsers.length})</h3>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">Set all permissions:</label>
                        <select
                          value={bulkPermission}
                          onChange={(e) => handleBulkPermissionChange(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-xs text-black"
                        >
                          <option value="view">View</option>
                          <option value="edit">Edit</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* User list with fixed height */}
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                      {getCurrentPageUsers().map((user, index) => (
                        <div key={`bulk-${index}`} className="flex gap-2 items-center p-2 bg-blue-50 rounded-md">
                          <div className="flex-1 truncate">
                            <span className="text-sm">{user.email}</span>
                          </div>
                          <select
                            value={user.permission}
                            onChange={(e) => handleBulkUserPermissionChange(index, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 w-24 text-xs text-black"
                          >
                            <option value="view">View</option>
                            <option value="edit">Edit</option>
                          </select>
                          <button
                            onClick={() => handleRemoveBulkUser(index)}
                            className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      
                      {/* Show message if no users on current page */}
                      {getCurrentPageUsers().length === 0 && (
                        <div className="text-center py-2 text-gray-500 text-sm">
                          No users on this page
                        </div>
                      )}
                    </div>
                    
                    {/* Pagination controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-gray-500">
                          Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={goToPrevPage}
                            disabled={currentPage === 1}
                            className={`p-1 rounded ${
                              currentPage === 1 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className={`p-1 rounded ${
                              currentPage === totalPages 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Individual User Entries */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Individual Users ({users.length}/{MAX_INDIVIDUAL_USERS})</h3>
                  <div className="space-y-2">
                    {users.map((user, index) => {
                      // Get suggestions for this user's email
                      const suggestions = getEmailSuggestions(user.email);
                      const hasSuggestions = suggestions.length > 0;
                      
                      return (
                        <div key={index} className="relative">
                          <div className="flex gap-2 items-center">
                            <div className="flex-1 relative">
                              <input
                                type="email"
                                placeholder="User email (optional)"
                                value={user.email}
                                onChange={(e) => handleUserChange(index, 'email', e.target.value)}
                                onFocus={() => {
                                  setActiveSuggestionIndex(index);
                                  setShowSuggestions(true);
                                }}
                                className="w-full px-3 py-2 border-2 border-black rounded-md focus:ring-2 focus:ring-green-500 text-black"
                              />
                              
                              {/* Email suggestions dropdown */}
                              {showSuggestions && 
                               activeSuggestionIndex === index && 
                               hasSuggestions && (
                                <div 
                                  ref={el => suggestionRefs.current[index] = el}
                                  className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                                >
                                  {suggestions.map((email, i) => (
                                    <div
                                      key={i}
                                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                      onClick={() => handleSelectSuggestion(index, email)}
                                    >
                                      <User size={16} className="mr-2 text-gray-500" />
                                      {email}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <select
                              value={user.permission}
                              onChange={(e) => handleUserChange(index, 'permission', e.target.value)}
                              className="px-3 py-2 border-2 border-black rounded-md focus:ring-2 focus:ring-green-500 w-28 text-black"
                            >
                              <option value="view">View</option>
                              <option value="edit">Edit</option>
                            </select>
                            
                            <button
                              onClick={() => handleRemoveUser(index)}
                              className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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