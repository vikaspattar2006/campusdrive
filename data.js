// Initial Data Model (Discord-style servers/groups and channels)

const USERS = [
  { id: '1', username: 'student_john', name: 'John Doe', role: 'student', avatar: 'J' },
  { id: '2', username: 'admin_raj', name: 'Raj Shah', role: 'admin', avatar: 'R' }
];

const SERVERS = [
  { id: 's1', name: 'Academics', icon: '📚' },
  { id: 's2', name: 'General', icon: '📢' },
  { id: 's3', name: 'Exam Cell', icon: '🎓' },
  { id: 's4', name: 'Student Council', icon: '🏛️' },
  { id: 's5', name: 'Calendar', icon: '📅' },
  { id: 's6', name: 'Gallery', icon: '🖼️' }
];

const CHANNELS = [
  // Academics
  { id: 'c1', serverId: 's1', name: 'announcements', type: 'text' },
  { id: 'c2', serverId: 's1', name: 'exam-updates', type: 'text' },
  { id: 'c3', serverId: 's1', name: 'resources', type: 'text' },
  
  // General
  { id: 'c4', serverId: 's2', name: 'campus-news', type: 'text' },
  { id: 'c5', serverId: 's2', name: 'discussions', type: 'text' },
  { id: 'c6', serverId: 's2', name: 'help-desk', type: 'text' },
  
  // Exam Cell
  { id: 'c7', serverId: 's3', name: 'schedules', type: 'text' },
  { id: 'c8', serverId: 's3', name: 'results', type: 'text' },
  { id: 'c9', serverId: 's3', name: 'queries', type: 'text' },
  
  // Student Council
  { id: 'c10', serverId: 's4', name: 'notices', type: 'text' },
  { id: 'c11', serverId: 's4', name: 'suggestions', type: 'text' },
  { id: 'c12', serverId: 's4', name: 'feedback', type: 'text' },
  
  // Calendar
  { id: 'c13', serverId: 's5', name: 'events-calendar', type: 'calendar' },
  
  // Gallery
  { id: 'c14', serverId: 's6', name: 'event-photos', type: 'gallery' }
];

const INITIAL_MESSAGES = [
  {
    id: 'm1',
    channelId: 'c1',
    authorId: '2',
    content: '**Welcome to the new academic year!**\n\nPlease check your respective course channels for syllabus updates.',
    timestamp: '2026-04-20T10:00:00Z',
    embed: null
  },
  {
    id: 'm2',
    channelId: 'c2',
    authorId: '2',
    content: 'Mid-term dates have been finalized. Please check the Exam Cell server for the detailed schedule.',
    timestamp: '2026-04-25T14:30:00Z',
    embed: null
  },
  {
    id: 'm3',
    channelId: 'c4',
    authorId: '2',
    content: 'The campus cafeteria will be closed for renovation this weekend.',
    timestamp: '2026-04-27T09:15:00Z',
    embed: null
  },
  {
    id: 'm4',
    channelId: 'c7',
    authorId: '2',
    content: 'Please find attached the schedule for the upcoming mid-term examinations.',
    timestamp: '2026-04-26T11:00:00Z',
    embed: {
      type: 'file',
      title: 'Mid-Term Schedule V2.pdf',
      description: 'PDF Document - 1.2 MB'
    }
  },
  {
    id: 'm5',
    channelId: 'c14',
    authorId: '2',
    content: '',
    timestamp: '2026-04-28T12:00:00Z',
    embed: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
    }
  }
];

const DataStorage = {
  init() {
    // Check if new data exists, if not, clear and reset
    const currentUsers = JSON.parse(localStorage.getItem('campusdrive_users') || '[]');
    const hasRaj = currentUsers.some(u => u.username === 'admin_raj');
    
    if (!hasRaj) {
      localStorage.removeItem('campusdrive_users');
      localStorage.removeItem('campusdrive_servers');
      localStorage.removeItem('campusdrive_channels');
      localStorage.removeItem('campusdrive_messages');
    }

    if (!localStorage.getItem('campusdrive_users')) {
      localStorage.setItem('campusdrive_users', JSON.stringify(USERS));
    }
    if (!localStorage.getItem('campusdrive_servers')) {
      localStorage.setItem('campusdrive_servers', JSON.stringify(SERVERS));
    }
    if (!localStorage.getItem('campusdrive_channels')) {
      localStorage.setItem('campusdrive_channels', JSON.stringify(CHANNELS));
    }
    if (!localStorage.getItem('campusdrive_messages')) {
      localStorage.setItem('campusdrive_messages', JSON.stringify(INITIAL_MESSAGES));
    }
  },

  getMessages(channelId) {
    const msgs = JSON.parse(localStorage.getItem('campusdrive_messages') || '[]');
    return msgs.filter(m => m.channelId === channelId);
  },

  getAllMessages() {
    return JSON.parse(localStorage.getItem('campusdrive_messages') || '[]');
  },

  addMessage(message) {
    const msgs = JSON.parse(localStorage.getItem('campusdrive_messages') || '[]');
    msgs.push(message);
    localStorage.setItem('campusdrive_messages', JSON.stringify(msgs));
  },

  deleteMessage(messageId) {
    let msgs = JSON.parse(localStorage.getItem('campusdrive_messages') || '[]');
    msgs = msgs.filter(m => m.id !== messageId);
    localStorage.setItem('campusdrive_messages', JSON.stringify(msgs));
  },

  updateMessage(messageId, newContent) {
    const msgs = JSON.parse(localStorage.getItem('campusdrive_messages') || '[]');
    const msg = msgs.find(m => m.id === messageId);
    if (msg) {
      msg.content = newContent;
      // Note: editing could update an editedAt timestamp in a real app
      localStorage.setItem('campusdrive_messages', JSON.stringify(msgs));
    }
  },

  getServers() {
    return JSON.parse(localStorage.getItem('campusdrive_servers') || '[]');
  },

  getChannels(serverId) {
    const channels = JSON.parse(localStorage.getItem('campusdrive_channels') || '[]');
    return channels.filter(c => c.serverId === serverId);
  },

  getUser(userId) {
    const users = JSON.parse(localStorage.getItem('campusdrive_users') || '[]');
    return users.find(u => u.id === userId);
  },
  
  getCurrentUser() {
    const userId = localStorage.getItem('campusdrive_current_user');
    if (!userId) return null;
    return this.getUser(userId);
  },
  
  setCurrentUser(userId) {
    localStorage.setItem('campusdrive_current_user', userId);
  },
  
  logout() {
    localStorage.removeItem('campusdrive_current_user');
  }
};

// Initialize data on load
DataStorage.init();
