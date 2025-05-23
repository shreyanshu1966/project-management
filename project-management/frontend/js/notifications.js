// Notifications System
let notifications = [];
let unreadCount = 0;

// Initialize notifications on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize notification elements and UI
    setupNotificationUI();
    
    // Load existing notifications
    loadNotifications();
    
    // Setup periodic check for new notifications (simulating server polling)
    // In a real implementation, this would be replaced with WebSockets or Server-Sent Events
    setInterval(checkForNewNotifications, 30000); // Check every 30 seconds
});

// Setup notification UI elements
function setupNotificationUI() {
    // Create notification bell icon if it doesn't exist
    if (!document.getElementById('notification-bell')) {
        const navbarRight = document.querySelector('.navbar-nav');
        
        if (navbarRight) {
            // Create notification bell container
            const notificationContainer = document.createElement('li');
            notificationContainer.className = 'nav-item dropdown notification-dropdown';
            
            // Create notification bell
            notificationContainer.innerHTML = `
                <a class="nav-link dropdown-toggle" href="#" id="notification-bell" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <i class="fas fa-bell"></i>
                    <span class="badge badge-danger notification-badge" id="notification-count" style="display: none;">0</span>
                </a>
                <div class="dropdown-menu dropdown-menu-right notification-dropdown-menu" aria-labelledby="notification-bell">
                    <div class="notification-header">
                        <span>Notifications</span>
                        <a href="#" id="mark-all-read">Mark all as read</a>
                    </div>
                    <div class="notification-list" id="notification-list">
                        <div class="empty-notification">No notifications</div>
                    </div>
                    <div class="notification-footer">
                        <a href="#" id="view-all-notifications">View all</a>
                    </div>
                </div>
            `;
            
            // Add to navbar
            navbarRight.appendChild(notificationContainer);
            
            // Setup event listeners
            document.getElementById('notification-bell').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                document.querySelector('.notification-dropdown-menu').classList.toggle('show');
            });
            
            document.getElementById('mark-all-read').addEventListener('click', (e) => {
                e.preventDefault();
                markAllNotificationsAsRead();
            });
            
            document.getElementById('view-all-notifications').addEventListener('click', (e) => {
                e.preventDefault();
                // TODO: Implement view all notifications page
                alert('View all notifications page is coming soon!');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.notification-dropdown')) {
                    document.querySelector('.notification-dropdown-menu').classList.remove('show');
                }
            });
        }
    }
}

// Load notifications from API
async function loadNotifications() {
    try {
        const response = await fetch(`${API_URL}/notifications`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch notifications');
        }
        
        // Store notifications
        notifications = await response.json();
        
        // Update UI
        updateNotificationUI();
        
    } catch (error) {
        console.error('Error loading notifications:', error);
        
        // For demo purposes, load mock notifications
        notifications = getMockNotifications();
        updateNotificationUI();
    }
}

// Get mock notifications for demo
function getMockNotifications() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return [
        {
            id: 1,
            message: "Task 'Implement User Authentication' has been assigned to you",
            type: "TASK_ASSIGNED",
            read: false,
            createdAt: oneHourAgo.toISOString(),
            metadata: {
                taskId: 2,
                taskTitle: "Implement User Authentication"
            }
        },
        {
            id: 2,
            message: "Your task 'Create Login UI' has been marked as completed",
            type: "TASK_COMPLETED",
            read: true,
            createdAt: twoHoursAgo.toISOString(),
            metadata: {
                taskId: 1,
                taskTitle: "Create Login UI",
                creditPoints: 25
            }
        },
        {
            id: 3,
            message: "New project 'Mobile App Development' has been created",
            type: "PROJECT_CREATED",
            read: false,
            createdAt: yesterday.toISOString(),
            metadata: {
                projectId: 2,
                projectName: "Mobile App Development"
            }
        },
        {
            id: 4,
            message: "You've earned 25 credit points for completing 'Create Login UI'",
            type: "POINTS_EARNED",
            read: false,
            createdAt: twoHoursAgo.toISOString(),
            metadata: {
                taskId: 1,
                taskTitle: "Create Login UI",
                creditPoints: 25
            }
        }
    ];
}

// Update notification UI elements
function updateNotificationUI() {
    const notificationList = document.getElementById('notification-list');
    const notificationCount = document.getElementById('notification-count');
    
    if (!notificationList || !notificationCount) return;
    
    // Count unread notifications
    unreadCount = notifications.filter(notification => !notification.read).length;
    
    // Update badge count
    if (unreadCount > 0) {
        notificationCount.textContent = unreadCount > 9 ? '9+' : unreadCount;
        notificationCount.style.display = 'inline-block';
    } else {
        notificationCount.style.display = 'none';
    }
    
    // Generate notification items HTML
    if (notifications.length === 0) {
        notificationList.innerHTML = '<div class="empty-notification">No notifications</div>';
        return;
    }
    
    const notificationsHtml = notifications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by date, newest first
        .slice(0, 5) // Show only the most recent 5 notifications
        .map(notification => {
            // Get icon based on notification type
            let icon = 'bell';
            let link = '#';
            
            switch (notification.type) {
                case 'TASK_ASSIGNED':
                    icon = 'tasks';
                    link = `task-management.html?taskId=${notification.metadata.taskId}`;
                    break;
                case 'TASK_COMPLETED':
                    icon = 'check-circle';
                    link = `task-management.html?taskId=${notification.metadata.taskId}`;
                    break;
                case 'PROJECT_CREATED':
                    icon = 'project-diagram';
                    link = `project-details.html?projectId=${notification.metadata.projectId}`;
                    break;
                case 'POINTS_EARNED':
                    icon = 'star';
                    link = 'profile.html';
                    break;
                case 'DEADLINE_APPROACHING':
                    icon = 'clock';
                    link = `task-management.html?taskId=${notification.metadata.taskId}`;
                    break;
            }
            
            // Format date
            const date = new Date(notification.createdAt);
            const now = new Date();
            const diffMs = now - date;
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHour = Math.floor(diffMin / 60);
            const diffDay = Math.floor(diffHour / 24);
            
            let timeAgo;
            if (diffSec < 60) {
                timeAgo = `${diffSec} sec ago`;
            } else if (diffMin < 60) {
                timeAgo = `${diffMin} min ago`;
            } else if (diffHour < 24) {
                timeAgo = `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
            } else {
                timeAgo = `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
            }
            
            return `
                <a href="${link}" class="notification-item ${notification.read ? 'read' : 'unread'}" data-notification-id="${notification.id}">
                    <div class="notification-icon">
                        <i class="fas fa-${icon}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-message">${notification.message}</div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                    ${!notification.read ? '<div class="unread-indicator"></div>' : ''}
                </a>
            `;
        }).join('');
    
    notificationList.innerHTML = notificationsHtml;
    
    // Setup click handlers for notification items
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            const notificationId = item.dataset.notificationId;
            await markNotificationAsRead(notificationId);
        });
    });
}

// Mark a notification as read
async function markNotificationAsRead(notificationId) {
    try {
        const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to mark notification as read');
        }
        
        // Update local notification
        const notificationIndex = notifications.findIndex(n => n.id == notificationId);
        if (notificationIndex !== -1) {
            notifications[notificationIndex].read = true;
        }
        
        // Update UI
        updateNotificationUI();
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
        
        // For demo purposes, update locally
        const notificationIndex = notifications.findIndex(n => n.id == notificationId);
        if (notificationIndex !== -1) {
            notifications[notificationIndex].read = true;
        }
        
        // Update UI
        updateNotificationUI();
    }
}

// Mark all notifications as read
async function markAllNotificationsAsRead() {
    try {
        const response = await fetch(`${API_URL}/notifications/read-all`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to mark all notifications as read');
        }
        
        // Update all local notifications
        notifications.forEach(notification => {
            notification.read = true;
        });
        
        // Update UI
        updateNotificationUI();
        
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        
        // For demo purposes, update locally
        notifications.forEach(notification => {
            notification.read = true;
        });
        
        // Update UI
        updateNotificationUI();
    }
}

// Check for new notifications from the server
async function checkForNewNotifications() {
    try {
        const response = await fetch(`${API_URL}/notifications?since=${getLatestNotificationTimestamp()}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to check for new notifications');
        }
        
        const newNotifications = await response.json();
        
        // If new notifications, add them to the list and update UI
        if (newNotifications.length > 0) {
            notifications = [...newNotifications, ...notifications];
            updateNotificationUI();
            
            // Show a notification alert for each new notification
            newNotifications.forEach(notification => {
                showNotificationAlert(notification);
            });
        }
        
    } catch (error) {
        console.error('Error checking for new notifications:', error);
        
        // For demo purposes, occasionally add a new mock notification
        if (Math.random() < 0.3) { // 30% chance of a new notification
            const newNotification = {
                id: notifications.length + 1,
                message: "New deadline approaching for task 'Design Database Schema'",
                type: "DEADLINE_APPROACHING",
                read: false,
                createdAt: new Date().toISOString(),
                metadata: {
                    taskId: 3,
                    taskTitle: "Design Database Schema"
                }
            };
            
            notifications.unshift(newNotification);
            updateNotificationUI();
            showNotificationAlert(newNotification);
        }
    }
}

// Get timestamp of the most recent notification
function getLatestNotificationTimestamp() {
    if (notifications.length === 0) {
        return new Date(0).toISOString(); // Return epoch if no notifications
    }
    
    // Sort by date, newest first
    const sortedNotifications = [...notifications].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    return sortedNotifications[0].createdAt;
}

// Show a notification alert for a new notification
function showNotificationAlert(notification) {
    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.className = 'notification-alert';
    
    // Get icon based on notification type
    let icon = 'bell';
    
    switch (notification.type) {
        case 'TASK_ASSIGNED':
            icon = 'tasks';
            break;
        case 'TASK_COMPLETED':
            icon = 'check-circle';
            break;
        case 'PROJECT_CREATED':
            icon = 'project-diagram';
            break;
        case 'POINTS_EARNED':
            icon = 'star';
            break;
        case 'DEADLINE_APPROACHING':
            icon = 'clock';
            break;
    }
    
    // Add message
    alertElement.innerHTML = `
        <div class="notification-alert-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="notification-alert-content">
            <div class="notification-alert-title">New Notification</div>
            <div class="notification-alert-message">${notification.message}</div>
        </div>
        <button type="button" class="notification-alert-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to document
    document.body.appendChild(alertElement);
    
    // Show animation
    setTimeout(() => {
        alertElement.classList.add('show');
    }, 10);
    
    // Add click event to close button
    alertElement.querySelector('.notification-alert-close').addEventListener('click', () => {
        alertElement.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(alertElement);
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(alertElement)) {
            alertElement.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(alertElement)) {
                    document.body.removeChild(alertElement);
                }
            }, 300);
        }
    }, 5000);
}

// Add notification styles to document
function addNotificationStyles() {
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification-dropdown {
                position: relative;
            }
            
            .notification-badge {
                position: absolute;
                top: 0;
                right: 0;
                font-size: 0.6em;
                padding: 0.3em 0.5em;
            }
            
            .notification-dropdown-menu {
                width: 320px;
                padding: 0;
                max-height: 500px;
                overflow-y: auto;
            }
            
            .notification-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                border-bottom: 1px solid #e0e0e0;
                font-weight: bold;
            }
            
            .notification-list {
                max-height: 350px;
                overflow-y: auto;
            }
            
            .notification-item {
                display: flex;
                padding: 10px 15px;
                border-bottom: 1px solid #f0f0f0;
                text-decoration: none;
                color: #333;
                position: relative;
            }
            
            .notification-item:hover {
                background-color: #f8f9fa;
            }
            
            .notification-item.unread {
                background-color: #f0f7ff;
            }
            
            .notification-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: #e9ecef;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 10px;
            }
            
            .notification-content {
                flex: 1;
            }
            
            .notification-message {
                margin-bottom: 5px;
                font-size: 0.9em;
            }
            
            .notification-time {
                font-size: 0.8em;
                color: #6c757d;
            }
            
            .notification-footer {
                padding: 10px 15px;
                text-align: center;
                border-top: 1px solid #e0e0e0;
            }
            
            .empty-notification {
                padding: 20px;
                text-align: center;
                color: #6c757d;
            }
            
            .unread-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: #007bff;
                position: absolute;
                top: 15px;
                right: 15px;
            }
            
            .notification-alert {
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: white;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                display: flex;
                width: 300px;
                padding: 15px;
                z-index: 9999;
                transform: translateX(calc(100% + 20px));
                transition: transform 0.3s ease-out;
            }
            
            .notification-alert.show {
                transform: translateX(0);
            }
            
            .notification-alert-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: #e9ecef;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 10px;
            }
            
            .notification-alert-content {
                flex: 1;
            }
            
            .notification-alert-title {
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .notification-alert-message {
                font-size: 0.9em;
            }
            
            .notification-alert-close {
                background: none;
                border: none;
                color: #6c757d;
                cursor: pointer;
                padding: 0;
                font-size: 0.9em;
                align-self: flex-start;
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Initialize notification styles
document.addEventListener('DOMContentLoaded', () => {
    addNotificationStyles();
});

