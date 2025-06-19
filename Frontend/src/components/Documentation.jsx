import React, { useState } from 'react';
import { BookOpen, Calculator, ChartBar, Table, FileSpreadsheet, Keyboard, Search, Settings, MessageCircle, Video, PaintBucket, Type } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Documentation = () => {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: BookOpen },
    { id: 'formulas', title: 'Formulas & Functions', icon: Calculator },
    { id: 'charts', title: 'Charts & Visualization', icon: ChartBar },
    { id: 'data-management', title: 'Data Management', icon: Table },
    { id: 'import-export', title: 'Import & Export', icon: FileSpreadsheet },
    { id: 'shortcuts', title: 'Keyboard Shortcuts', icon: Keyboard },
    { id: 'collaboration', title: 'Collaboration Tools', icon: MessageCircle },
    { id: 'formatting', title: 'Formatting Options', icon: PaintBucket }
  ];

  const content = {
    'getting-started': {
      title: 'Getting Started with Sheetwise',
      description: 'Learn the basics of using our application',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-100">User Interface</h3>
          <p className="text-gray-300">Sheetwise features a modern interface with a dual-header layout:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>The top header contains the logo, theme selector, and collaboration tools</li>
            <li>The second header has file management, admin controls, and search functions</li>
            <li>The main grid area is where you'll work with your spreadsheet data</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 text-gray-100">Themes</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Light Blue - Default light theme</li>
            <li>Dark Blue - Dark variation with blue accents</li>
            <li>Horizon Light Green - Light theme with green accents</li>
            <li>Horizon Dark Yellow - Dark theme with yellow highlights</li>
            <li>No theme - Minimal styling</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 text-gray-100">Getting Help</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Use the Spreadsheet Assistant for AI-powered help</li>
            <li>Check the Documentation section through the "More" dropdown</li>
            <li>Contact support via the Contact Us page</li>
          </ul>
        </div>
      )
    },
    'formulas': {
      title: 'Formulas & Functions',
      description: 'Use calculations and data analysis tools',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-100">Column Types</h3>
          <p className="text-gray-300">Sheetwise supports different column types via the Column Type Selector:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Set appropriate data types for your columns</li>
            <li>Apply validation rules based on the selected type</li>
            <li>Ensure consistent data formatting</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 text-gray-100">Formula Support</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Basic arithmetic operations: +, -, *, /</li>
            <li>Standard spreadsheet functions like SUM, AVERAGE, etc.</li>
            <li>Cell references using column letter and row number (e.g., A1)</li>
          </ul>
        </div>
      )
    },
    'charts': {
      title: 'Charts & Visualization',
      description: 'Transform your data into insightful visualizations',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-100">Visualization Panel</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Access through the Visualization Panel button</li>
            <li>Select data ranges to visualize</li>
            <li>Create various chart types based on your selected data</li>
            <li>Customize chart appearance and settings</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 text-gray-100">Whiteboard Integration</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Switch to the Whiteboard mode using the Whiteboard button</li>
            <li>Create diagrams and visual representations</li>
            <li>Collaborate with team members on visual data explanations</li>
            <li>Integrates with your spreadsheet data</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 text-gray-100">Excalidraw Integration</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Advanced drawing capabilities through the ExcalidrawWrapper component</li>
            <li>Create custom diagrams to visualize complex data relationships</li>
            <li>Share drawings with collaborators</li>
          </ul>
        </div>
      )
    },
    'data-management': {
      title: 'Data Management',
      description: 'Organize and manipulate your data effectively',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-100">Admin Panel</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Access administrative functions through the Admin Panel button</li>
            <li>Manage user permissions and access controls</li>
            <li>Configure application settings</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 text-gray-100">Search Functionality</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Use the search box to find content within your spreadsheet</li>
            <li>Real-time search results as you type</li>
            <li>Navigate through search results easily</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 text-gray-100">Cloud Storage</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>View your storage usage with the Storage indicator</li>
            <li>Monitor quotas and available space</li>
            <li>Available for authenticated users only</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 text-gray-100">User Authentication</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Access user profile and account settings</li>
            <li>Log in to enable cloud storage and collaboration features</li>
            <li>Protect your data with authentication</li>
          </ul>
        </div>
      )
    },
    'import-export': {
      title: 'Import & Export',
      description: 'Work with external data files',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-100">Importing Data</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Import CSV files directly through the File menu</li>
            <li>For unauthenticated users: Import directly to the spreadsheet</li>
            <li>For authenticated users: Upload to cloud storage</li>
            <li>Progress indicator shows upload status</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 text-gray-100">Exporting Data</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Export to CSV format through the File menu</li>
            <li>Download with all data and formatting preserved</li>
            <li>Automatic naming with date stamp</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 text-gray-100">Creating New Files</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Create new spreadsheets with the New File button</li>
            <li>Start fresh with an empty grid</li>
            <li>Navigate between different files</li>
          </ul>
        </div>
      )
    },
    'shortcuts': {
      title: 'Keyboard Shortcuts',
      description: 'Boost your productivity with keyboard shortcuts',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-100">Navigation</h3>
              <ul className="space-y-2 text-gray-300">
                <li><kbd className="px-2 py-1 bg-gray-700 text-gray-200 rounded">Tab</kbd> Move to next cell</li>
                <li><kbd className="px-2 py-1 bg-gray-700 text-gray-200 rounded">Enter</kbd> Complete edit</li>
                <li><kbd className="px-2 py-1 bg-gray-700 text-gray-200 rounded">Arrow keys</kbd> Move selection</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-100">Editing</h3>
              <ul className="space-y-2 text-gray-300">
                <li><kbd className="px-2 py-1 bg-gray-700 text-gray-200 rounded">Ctrl/⌘</kbd> + <kbd className="px-2 py-1 bg-gray-700 text-gray-200 rounded">Z</kbd> Undo</li>
                <li><kbd className="px-2 py-1 bg-gray-700 text-gray-200 rounded">Ctrl/⌘</kbd> + <kbd className="px-2 py-1 bg-gray-700 text-gray-200 rounded">Y</kbd> Redo</li>
                <li><kbd className="px-2 py-1 bg-gray-700 text-gray-200 rounded">Delete</kbd> Clear cell</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    'collaboration': {
      title: 'Collaboration Tools',
      description: 'Work together with others in real-time',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-100">Chat Feature</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Communicate with collaborators through the built-in chat</li>
            <li>Access the chat feature from the spreadsheet header</li>
            <li>Share ideas and discuss data in real-time</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 text-gray-100">Video Calls</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Initiate video calls with the VideoCall component</li>
            <li>Collaborate face-to-face while working on spreadsheets</li>
            <li>Share your screen to demonstrate data insights</li>
            <li>WebSocket integration for reliable connections</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 text-gray-100">Spreadsheet Assistant</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>AI-powered assistant to help with spreadsheet tasks</li>
            <li>Get recommendations and help with formulas</li>
            <li>Analyze data patterns and suggest insights</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 text-gray-100">Real-time Collaboration</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Multiple users can work on the same document simultaneously</li>
            <li>See changes from other users in real-time</li>
            <li>Uses WebSocket technology for instant updates</li>
          </ul>
        </div>
      )
    },
    'formatting': {
      title: 'Formatting Options',
      description: 'Make your spreadsheet visually appealing and readable',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-100">Text Formatting</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Change font size using the size controls (+ and - buttons)</li>
            <li>Customize text color with the color picker</li>
            <li>Apply formatting to selected cells</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 text-gray-100">Cell Formatting</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Set background colors using the color picker</li>
            <li>Select cells to apply formatting to specific ranges</li>
            <li>Apply dynamic classes for consistent styling</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 text-gray-100">Selection Tools</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Select cell ranges by clicking and dragging</li>
            <li>Apply formatting to the selected range</li>
            <li>Automatic cell selection tracking for easy formatting</li>
          </ul>
        </div>
      )
    },
    'data-management': {
    title: 'Data Management',
    description: 'Organize and manipulate your data effectively',
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-100">Admin Panel Features</h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-300">
          <li>
            <strong>User & Permission Management:</strong>
            <ul className="list-[circle] pl-6 mt-2">
              <li>Add/remove users via email with typeahead suggestions</li>
              <li>Set granular permissions (Read/Read+Write)</li>
              <li>Bulk permission updates with dropdown selectors</li>
              <li>Real-time permission synchronization</li>
            </ul>
          </li>

          <li>
            <strong>File Operations:</strong>
            <ul className="list-[circle] pl-6 mt-2">
              <li>Inline file renaming with character counter</li>
              <li>Secure file deletion with confirmation dialogs</li>
              <li>New file creation with instant access</li>
              <li>Last modified timestamp tracking</li>
            </ul>
          </li>

          <li>
            <strong>Sharing & Security:</strong>
            <ul className="list-[circle] pl-6 mt-2">
              <li>Generate time-limited access tokens (10m/1h/1d)</li>
              <li>Direct email sharing with permission levels</li>
              <li>Encrypted URL tokens with copy functionality</li>
              <li>Role-Based Access Control (RBAC) integration</li>
            </ul>
          </li>

          <li>
            <strong>Advanced Controls:</strong>
            <ul className="list-[circle] pl-6 mt-2">
              <li>Pagination with 10-50 items per page</li>
              <li>Global search across all file metadata</li>
              <li>Sortable columns for easy organization</li>
              <li>Responsive design with horizontal scrolling</li>
            </ul>
          </li>
        </ul>

        {/* Keep existing sections */}
        <h3 className="text-lg font-semibold mt-6 text-gray-100">Search Functionality</h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-300">
          <li>Use the search box to find content within your spreadsheet</li>
          <li>Real-time search results as you type</li>
          <li>Navigate through search results easily</li>
        </ul>

        <h3 className="text-lg font-semibold mt-6 text-gray-100">Cloud Storage</h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-300">
          <li>View your storage usage with the Storage indicator</li>
          <li>Monitor quotas and available space</li>
          <li>Available for authenticated users only</li>
        </ul>

        <h3 className="text-lg font-semibold mt-6 text-gray-100">User Authentication</h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-300">
          <li>Access user profile and account settings</li>
          <li>Log in to enable cloud storage and collaboration features</li>
          <li>Protect your data with authentication</li>
        </ul>
      </div>
    )
  },
  };

  return (
    <div className="p-6 bg-gray-600 max-h-fit">

      <Card className="bg-gray-800 border-gray-700">
        
        <CardHeader>
                
         <div className='flex'> <CardTitle className="text-gray-100 text-2xl font-bold">Sheetwise Documentation</CardTitle>
          <h1 className='ml-[230px] justify-center text-5xl font-bold text-white flex'>Made in Indore,India <img className='h-14 w-18 ml-3' src="../public/india-flag-icon-3047035.webp" alt="" /></h1>
          
         </div>
          <CardDescription className="text-gray-400">
            Complete guide to using the Sheetwise application
          </CardDescription>
        
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-64 space-y-2">
              {sections.map(({ id, title, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    activeSection === id
                      ? 'bg-blue-900 text-blue-200'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon size={20} />
                  <span>{title}</span>
                </button>
              ))}
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-gray-100">
                {content[activeSection].title}
              </h2>
              <p className="text-gray-400 mb-6">
                {content[activeSection].description}
              </p>
              {content[activeSection].content}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Documentation;