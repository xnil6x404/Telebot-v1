function escapeMarkdown(text) {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  }
  
  module.exports = {
    escapeMarkdown
  };
  
  