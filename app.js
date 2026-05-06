// Initialize libraries
dayjs.extend(dayjs_plugin_relativeTime);
marked.setOptions({ breaks: true });

document.addEventListener('DOMContentLoaded', () => {
  // Authentication check
  const currentUser = DataStorage.getCurrentUser();
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }

  // DOM Elements
  const serversList = document.getElementById('serversList');
  const channelsList = document.getElementById('channelsList');
  const messagesList = document.getElementById('messagesList');
  const currentServerName = document.getElementById('currentServerName');
  const currentChannelName = document.getElementById('currentChannelName');
  const chatInputWrapper = document.getElementById('chatInputWrapper');
  const messageInput = document.getElementById('messageInput');
  const sendMessageBtn = document.getElementById('sendMessageBtn');
  const attachBtn = document.getElementById('attachBtn');
  const imageUploadInput = document.getElementById('imageUploadInput');
  const searchInput = document.getElementById('searchInput');
  const emptyState = document.getElementById('emptyState');
  const notificationBtn = document.getElementById('notificationBtn');
  const notificationBadge = document.getElementById('notificationBadge');
  const notificationDropdown = document.getElementById('notificationDropdown');
  const notificationList = document.getElementById('notificationList');
  const markAllReadBtn = document.getElementById('markAllReadBtn');
  const editModal = document.getElementById('editModal');
  const editContent = document.getElementById('editContent');

  // State
  let currentServerId = null;
  let currentChannelId = null;
  let editingMessageId = null;

  // Initialize UI
  document.getElementById('currentUserAvatar').textContent = currentUser.avatar;
  document.getElementById('currentUserName').textContent = currentUser.name;
  document.getElementById('currentUserRole').textContent = currentUser.role === 'admin' ? 'Administrator' : 'Student';

  if (currentUser.role === 'admin') {
    chatInputWrapper.classList.remove('hidden');
  }

  // Load Servers
  function renderServers() {
    const servers = DataStorage.getServers();
    serversList.innerHTML = '';

    // Add Home/Direct Messages icon (dummy)
    const homeIcon = document.createElement('div');
    homeIcon.className = 'server-icon home-icon active';
    homeIcon.innerHTML = `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
        <path d="M 15 65 L 85 65 A 4 4 0 0 1 85 73 L 15 73 A 4 4 0 0 1 15 65 Z" fill="currentColor" />
        <rect x="30" y="48" width="40" height="17" fill="currentColor" />
        <path d="M 35 65 L 35 56 A 4 4 0 0 1 43 56 L 43 65 Z" fill="#313338" />
        <path d="M 46 65 L 46 56 A 4 4 0 0 1 54 56 L 54 65 Z" fill="#313338" />
        <path d="M 57 65 L 57 56 A 4 4 0 0 1 65 56 L 65 65 Z" fill="#313338" />
        <polygon points="25,48 50,30 75,48" fill="currentColor" />
        <rect x="48" y="10" width="4" height="20" fill="currentColor" />
        <path d="M 52 10 L 80 10 L 72 17 L 80 24 L 52 24 Z" fill="#ed4245" />
      </svg>
    `;
    homeIcon.title = 'CampusDrive Home';
    serversList.appendChild(homeIcon);

    const separator = document.createElement('div');
    separator.className = 'server-separator';
    serversList.appendChild(separator);

    servers.forEach(server => {
      const el = document.createElement('div');
      el.className = `server-icon ${server.id === currentServerId ? 'active' : ''}`;
      el.textContent = server.icon;
      el.title = server.name;
      el.dataset.id = server.id;

      el.addEventListener('click', () => {
        selectServer(server.id);
      });

      serversList.appendChild(el);
    });
  }

  function selectServer(serverId) {
    currentServerId = serverId;
    renderServers(); // update active state

    const server = DataStorage.getServers().find(s => s.id === serverId);
    if (server) {
      currentServerName.textContent = server.name;
    }

    renderChannels(serverId);

    // Select first channel by default
    const channels = DataStorage.getChannels(serverId);
    if (channels.length > 0) {
      selectChannel(channels[0].id);
    } else {
      currentChannelId = null;
      currentChannelName.textContent = '';
      renderMessages();
    }
  }

  function renderChannels(serverId) {
    const channels = DataStorage.getChannels(serverId);
    channelsList.innerHTML = '';

    const category = document.createElement('div');
    category.className = 'channel-category';
    category.innerHTML = '<i class="fa-solid fa-chevron-down"></i> TEXT CHANNELS';
    channelsList.appendChild(category);

    channels.forEach(channel => {
      const el = document.createElement('div');
      el.className = `channel-item ${channel.id === currentChannelId ? 'active' : ''}`;

      const icon = channel.type === 'calendar' ? 'fa-calendar-days' : 'fa-hashtag';
      el.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${channel.name}</span>`;
      el.dataset.id = channel.id;

      el.addEventListener('click', () => {
        selectChannel(channel.id);
      });

      channelsList.appendChild(el);
    });
  }

  function selectChannel(channelId) {
    currentChannelId = channelId;

    // Update active state
    document.querySelectorAll('.channel-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === channelId);
    });

    const serverChannels = DataStorage.getChannels(currentServerId);
    const channel = serverChannels.find(c => c.id === channelId);

    if (channel) {
      currentChannelName.textContent = channel.name;

      if (channel.type === 'gallery') {
        messageInput.placeholder = `Enter image URL for #${channel.name}...`;
        if (attachBtn) attachBtn.style.display = 'block';
      } else {
        messageInput.placeholder = `Message #${channel.name}...`;
        if (attachBtn) attachBtn.style.display = 'none';
      }

      if (currentUser.role === 'admin') {
        chatInputWrapper.classList.remove('hidden');
      } else {
        chatInputWrapper.classList.add('hidden');
      }
    }

    renderMessages();
  }

  function renderMessages(searchTerm = '') {
    if (!currentChannelId) {
      messagesList.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    let messages = DataStorage.getMessages(currentChannelId);

    if (searchTerm) {
      messages = messages.filter(m =>
        m.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Clear list but keep empty state hidden element
    messagesList.innerHTML = '';
    messagesList.appendChild(emptyState);

    if (messages.length === 0) {
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');

      messages.forEach(msg => {
        const author = DataStorage.getUser(msg.authorId) || { name: 'Unknown User', avatar: '?' };

        const msgEl = document.createElement('div');
        msgEl.className = 'message';

        let actionsHtml = '';
        if (currentUser.role === 'admin' || currentUser.id === msg.authorId) {
          actionsHtml = `
            <div class="message-actions">
              <div class="msg-action-btn edit-msg-btn" data-id="${msg.id}" title="Edit"><i class="fa-solid fa-pen"></i></div>
              <div class="msg-action-btn delete-msg-btn" data-id="${msg.id}" title="Delete"><i class="fa-solid fa-trash"></i></div>
            </div>
          `;
        }

        let embedHtml = '';
        if (msg.embed) {
          if (msg.embed.type === 'image') {
            embedHtml = `
              <div class="message-embed image-embed" style="background: transparent; border: none; padding: 0;">
                <img src="${msg.embed.url}" alt="Gallery Image" style="max-width: 100%; border-radius: 4px; max-height: 300px; cursor: pointer;">
              </div>
            `;
          } else {
            embedHtml = `
              <div class="message-embed">
                <div class="message-embed-title">${msg.embed.title}</div>
                <div class="message-embed-description">${msg.embed.description}</div>
              </div>
            `;
          }
        }

        const formattedTime = dayjs(msg.timestamp).format('MM/DD/YYYY h:mm A');
        const parsedContent = marked.parse(msg.content);

        msgEl.innerHTML = `
          <div class="message-avatar">${author.avatar}</div>
          <div class="message-header">
            <span class="message-author">${author.name}</span>
            <span class="message-timestamp">${formattedTime}</span>
          </div>
          <div class="message-content markdown-body">${parsedContent}</div>
          ${embedHtml}
          ${actionsHtml}
        `;

        messagesList.appendChild(msgEl);
      });

      // Auto-scroll to bottom
      messagesList.scrollTop = messagesList.scrollHeight;

      // Attach event listeners to new buttons
      document.querySelectorAll('.edit-msg-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          openEditModal(id);
        });
      });

      document.querySelectorAll('.delete-msg-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          if (confirm('Are you sure you want to delete this message?')) {
            DataStorage.deleteMessage(id);
            renderMessages(searchInput.value);
          }
        });
      });
    }
  }

  // Image Upload Logic
  if (attachBtn && imageUploadInput) {
    attachBtn.addEventListener('click', () => {
      imageUploadInput.click();
    });

    imageUploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file || !currentChannelId) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        const content = messageInput.value.trim();

        const serverChannels = DataStorage.getChannels(currentServerId);
        const channel = serverChannels.find(c => c.id === currentChannelId);

        const newMessage = {
          id: 'm' + Date.now(),
          channelId: currentChannelId,
          authorId: currentUser.id,
          content: channel && channel.type === 'gallery' ? '' : content,
          timestamp: new Date().toISOString(),
          embed: {
            type: 'image',
            url: imageUrl
          }
        };

        DataStorage.addMessage(newMessage);
        messageInput.value = '';
        messageInput.style.height = 'auto'; // Reset textarea height

        // Reset file input
        imageUploadInput.value = '';

        renderMessages();
      };
      reader.readAsDataURL(file);
    });
  }

  // Send Message Logic
  function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || !currentChannelId) return;

    const serverChannels = DataStorage.getChannels(currentServerId);
    const channel = serverChannels.find(c => c.id === currentChannelId);

    const newMessage = {
      id: 'm' + Date.now(),
      channelId: currentChannelId,
      authorId: currentUser.id,
      content: channel && channel.type === 'gallery' ? '' : content,
      timestamp: new Date().toISOString(),
      embed: null
    };

    if (channel && channel.type === 'gallery') {
      newMessage.embed = {
        type: 'image',
        url: content // user enters the image URL
      };
    }

    DataStorage.addMessage(newMessage);
    messageInput.value = '';
    messageInput.style.height = 'auto'; // Reset textarea height
    renderMessages();
  }

  sendMessageBtn.addEventListener('click', sendMessage);

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  messageInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });

  // Search Logic
  searchInput.addEventListener('input', (e) => {
    renderMessages(e.target.value);
  });

  // Modal Logic
  function openEditModal(messageId) {
    editingMessageId = messageId;
    const msgs = DataStorage.getMessages(currentChannelId);
    const msg = msgs.find(m => m.id === messageId);

    if (msg) {
      editContent.value = msg.content;
      editModal.classList.add('active');
    }
  }

  function closeEditModal() {
    editModal.classList.remove('active');
    editingMessageId = null;
    editContent.value = '';
  }

  document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
  document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);

  document.getElementById('saveEditBtn').addEventListener('click', () => {
    const newContent = editContent.value.trim();
    if (newContent && editingMessageId) {
      DataStorage.updateMessage(editingMessageId, newContent);
      closeEditModal();
      renderMessages(searchInput.value);
    }
  });

  // Logout Logic
  document.getElementById('logoutBtn').addEventListener('click', () => {
    DataStorage.logout();
    window.location.href = 'index.html';
  });

  // Notifications Logic
  let notifications = [
    { id: 1, type: 'mention', text: '<strong>Raj Shah</strong> mentioned you in <strong>#announcements</strong>', time: '10m ago', unread: true },
    { id: 2, type: 'event', text: 'New event added: <strong>Tech Symposium 2026</strong>', time: '1h ago', unread: true },
    { id: 3, type: 'reply', text: '<strong>Sarah Connor</strong> replied to your message', time: '2h ago', unread: false }
  ];

  function renderNotifications() {
    if (!notificationList) return;

    notificationList.innerHTML = '';
    const unreadCount = notifications.filter(n => n.unread).length;

    if (unreadCount > 0) {
      notificationBadge.textContent = unreadCount;
      notificationBadge.classList.remove('hidden');
    } else {
      notificationBadge.classList.add('hidden');
    }

    if (notifications.length === 0) {
      notificationList.innerHTML = `
        <div class="no-notifications">
          You're all caught up!
        </div>
      `;
      return;
    }

    notifications.forEach(notif => {
      const el = document.createElement('div');
      el.className = `notification-item ${notif.unread ? 'unread' : ''}`;

      let iconClass = 'fa-bell';
      if (notif.type === 'mention' || notif.type === 'reply') iconClass = 'fa-at';
      if (notif.type === 'event') iconClass = 'fa-calendar';

      el.innerHTML = `
        <div class="notification-item-icon">
          <i class="fa-solid ${iconClass}"></i>
        </div>
        <div class="notification-item-content">
          <div class="notification-item-text">${notif.text}</div>
          <div class="notification-item-time">${notif.time}</div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        notif.unread = false;
        renderNotifications();
      });

      notificationList.appendChild(el);
    });
  }

  if (notificationBtn) {
    notificationBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notificationDropdown.classList.toggle('hidden');
      renderNotifications();
    });
  }

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifications = notifications.map(n => ({ ...n, unread: false }));
      renderNotifications();
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (notificationDropdown && !notificationDropdown.contains(e.target) && e.target !== notificationBtn) {
      notificationDropdown.classList.add('hidden');
    }
  });

  renderNotifications();

  // Init
  renderServers();
  const servers = DataStorage.getServers();
  if (servers.length > 0) {
    selectServer(servers[0].id);
  }
});
