import React, { useState } from 'react';
import { Send, MessageSquare, Clock, Mail, Phone, MapPin, CheckCircle } from 'lucide-react';

const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'normal'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('contact');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          priority: 'normal'
        });
      }, 3000);
    }, 1500);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-lime-600 to-lime-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">Get in Touch</h1>
            <p className="mt-4 text-xl">We'd love to hear from you. Let us know how we can help.</p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'contact'
                  ? 'border-b-2 border-lime-500 text-lime-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="inline-block mr-2 h-4 w-4" />
              Contact Form
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'support'
                  ? 'border-b-2 border-lime-500 text-lime-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="inline-block mr-2 h-4 w-4" />
              Support Hours
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'contact' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Contact Information */}
                <div className="lg:col-span-1 bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Contact Information</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <Mail className="h-6 w-6 text-lime-500 mt-1 mr-4" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-600 mt-1">support@sheetwise.app</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Phone className="h-6 w-6 text-lime-500 mt-1 mr-4" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phone</p>
                        <p className="text-sm text-gray-600 mt-1">+1 (800) 123-4567</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <MapPin className="h-6 w-6 text-lime-500 mt-1 mr-4" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Office</p>
                        <p className="text-sm text-gray-600 mt-1">
                          123 Spreadsheet Ave.<br />
                          San Francisco, CA 94107<br />
                          United States
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Follow Us</h4>
                    <div className="flex space-x-4">
                      <a href="#" className="text-gray-400 hover:text-lime-500">
                        <span className="sr-only">Twitter</span>
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                        </svg>
                      </a>
                      <a href="#" className="text-gray-400 hover:text-lime-500">
                        <span className="sr-only">LinkedIn</span>
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0H5a5 5 0 00-5 5v14a5 5 0 005 5h14a5 5 0 005-5V5a5 5 0 00-5-5zM8 19H5V8h3v11zM6.5 6.732c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zM20 19h-3v-5.604c0-3.368-4-3.113-4 0V19h-3V8h3v1.765c1.396-2.586 7-2.777 7 2.476V19z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
                
                {/* Contact Form */}
                <div className="lg:col-span-2">
                  {isSubmitted ? (
                    <div className="flex flex-col items-center justify-center h-full py-12">
                      <div className="bg-green-50 rounded-full p-3 mb-4">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2">Message Sent!</h3>
                      <p className="text-gray-600 text-center max-w-md">
                        Thank you for reaching out. We'll get back to you as soon as possible.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <h3 className="text-lg font-medium text-gray-900 mb-6">Send a Message</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                          Subject
                        </label>
                        <input
                          type="text"
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500"
                        />
                      </div>
                      
                      <div className="mb-6">
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                          Priority
                        </label>
                        <select
                          id="priority"
                          name="priority"
                          value={formData.priority}
                          onChange={handleChange}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500"
                        >
                          <option value="low">Low - General Inquiry</option>
                          <option value="normal">Normal - Support Question</option>
                          <option value="high">High - Technical Issue</option>
                          <option value="urgent">Urgent - System Down</option>
                        </select>
                      </div>
                      
                      <div className="mb-6">
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                          Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows="6"
                          className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500"
                        ></textarea>
                      </div>
                      
                      <div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-lime-500 hover:bg-lime-600 text-white font-medium py-3 px-6 rounded-md transition-colors flex justify-center items-center"
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-5 w-5 mr-2" />
                              Send Message
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'support' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Support Hours</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="font-medium">Monday - Friday</span>
                        <span>9:00 AM - 8:00 PM EST</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Saturday</span>
                        <span>10:00 AM - 6:00 PM EST</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Sunday</span>
                        <span>Closed</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Response Times</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <div className="flex items-center mb-3">
                        <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
                        <h4 className="font-medium">Standard Support</h4>
                      </div>
                      <p className="text-sm text-gray-600">Response within 24 hours on business days</p>
                    </div>
                    
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <div className="flex items-center mb-3">
                        <div className="h-4 w-4 rounded-full bg-yellow-500 mr-2"></div>
                        <h4 className="font-medium">Priority Support</h4>
                      </div>
                      <p className="text-sm text-gray-600">Response within 12 hours for Pro subscribers</p>
                    </div>
                    
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <div className="flex items-center mb-3">
                        <div className="h-4 w-4 rounded-full bg-red-500 mr-2"></div>
                        <h4 className="font-medium">Emergency Support</h4>
                      </div>
                      <p className="text-sm text-gray-600">Response within 4 hours for Enterprise customers</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Frequently Asked Questions</h3>
                  <div className="space-y-4">
                    <details className="bg-gray-50 p-4 rounded-lg">
                      <summary className="font-medium text-gray-900 cursor-pointer">How do I upgrade my storage plan?</summary>
                      <div className="mt-3 text-gray-600">
                        <p>You can upgrade your storage plan from your account settings. Navigate to Settings  Storage  Upgrade to choose from our available plans.</p>
                      </div>
                    </details>
                    
                    <details className="bg-gray-50 p-4 rounded-lg">
                      <summary className="font-medium text-gray-900 cursor-pointer">Can I request a feature?</summary>
                      <div className="mt-3 text-gray-600">
                        <p>Yes! We love hearing from our users. Please use this contact form with "Feature Request" as the subject to send us your ideas.</p>
                      </div>
                    </details>
                    
                    <details className="bg-gray-50 p-4 rounded-lg">
                      <summary className="font-medium text-gray-900 cursor-pointer">How do I restore a deleted spreadsheet?</summary>
                      <div className="mt-3 text-gray-600">
                        <p>Deleted spreadsheets are stored in your Trash for 30 days. Go to Trash in the sidebar to restore them. For older deletions, Pro and Enterprise users can contact support.</p>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Map Section */}
        <div className="mt-12 bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8">
              <h3 className="text-2xl font-medium text-gray-900 mb-4">Visit Our Office</h3>
              <p className="text-gray-600 mb-6">
                We're located in the heart of San Francisco's tech district. Stop by to meet our team and see where the magic happens.
              </p>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-lime-500 mr-2" />
                <span className="text-gray-700">123 Spreadsheet Ave. San Francisco, CA 94107</span>
              </div>
            </div>
            <div className="bg-gray-300 h-64 md:h-auto">
              {/* Placeholder for map - In a real app, you'd use Google Maps or similar */}
              <div className="w-full h-full flex items-center justify-center">
                <img src="/api/placeholder/800/600" alt="Office location map" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;