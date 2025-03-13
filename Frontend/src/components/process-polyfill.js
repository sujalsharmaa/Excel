// Create this as process-polyfill.js in your project
window.process = window.process || {
    env: {
      NODE_ENV: 'production',
    },
  };
  
  // Export it to be imported where needed
  export default window.process;