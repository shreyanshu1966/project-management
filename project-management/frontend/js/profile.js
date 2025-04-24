// Profile page functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Skip if not on profile page
    if (!window.location.pathname.includes('profile.html')) return;
    
    // Load user profile data
    await loadUserProfile();
    
    // Load activity history
    await loadActivityHistory();
    
    // Load achievements
    await loadAchievements();
    
    // Setup edit profile functionality
    setupEditProfile();
});

// Load user profile data
async function loadUserProfile() {
    try {
        const currentUser = getCurrentUser();
        
        if (!currentUser) {
            throw new Error('User not authenticated');
        }
        
        // Try to get extended profile data from API
        try {
            const response = await fetch(`${API_URL}/users/profile`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch profile data');
            }
            
            const profileData = await response.json();
            displayProfileData(profileData);
            
        } catch (error) {
            console.error('Error fetching extended profile, using basic data:', error);
            
            // Fallback to basic user data from local storage
            displayBasicProfileData(currentUser);
        }
        
    } catch (error) {
        console.error('Error loading user profile:', error);
        alert('Failed to load profile data. Please try again later.');
    }
}

// Display profile data from API
function displayProfileData(profileData) {
    // Set user info
    document.getElementById('profile-name').textContent = profileData.fullName || profileData.username;
    document.getElementById('profile-role').textContent = formatRoles(profileData.roles);
    document.getElementById('profile-email').textContent = profileData.email;
    
    // Set avatar
    const avatar = document.getElementById('profile-avatar');
    if (profileData.fullName) {
        const nameParts = profileData.fullName.split(' ');
        if (nameParts.length > 1) {
            avatar.textContent = `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
        } else {
            avatar.textContent = profileData.fullName[0].toUpperCase();
        }
    } else {
        avatar.textContent = profileData.username[0].toUpperCase();
    }
    
    // Set credit points
    updateCreditPoints(profileData.creditPoints || 0);
    
    // Set performance statistics
    updatePerformanceStats(profileData.statistics || {
        completedTasks: 0,
        onTimePercentage: 0,
        avgQualityRating: 0,
        contributionScore: 0
    });
}

// Display basic profile data from localStorage
function displayBasicProfileData(userData) {
    // Set user info
    document.getElementById('profile-name').textContent = userData.username;
    document.getElementById('profile-role').textContent = formatRoles(userData.roles);
    document.getElementById('profile-email').textContent = userData.email || 'Email not available';
    
    // Set avatar
    const avatar = document.getElementById('profile-avatar');
    avatar.textContent = userData.username[0].toUpperCase();
    
    // Set mock credit points (for demo)
    updateCreditPoints(75);
    
    // Set mock performance statistics (for demo)
    updatePerformanceStats({
        completedTasks: 8,
        onTimePercentage: 85,
        avgQualityRating: 4.2,
        contributionScore: 68
    });
}

// Format roles for display
function formatRoles(roles) {
    if (!roles || roles.length === 0) return 'No role assigned';
    
    // Map roles to display names
    const displayRoles = roles.map(role => {
        if (typeof role === 'string') {
            // Handle string roles (from localStorage)
            if (role === 'ROLE_LEADER') return 'Project Leader';
            if (role === 'ROLE_MEMBER') return 'Team Member';
            return role.replace('ROLE_', '');
        } else if (role.name) {
            // Handle role objects (from API)
            if (role.name === 'ROLE_LEADER') return 'Project Leader';
            if (role.name === 'ROLE_MEMBER') return 'Team Member';
            return role.name.replace('ROLE_', '');
        }
        return 'Unknown Role';
    });
    
    return displayRoles.join(', ');
}

// Update credit points display
function updateCreditPoints(points) {
    // Get current level based on points
    const level = Math.floor(points / 100) + 1;
    const nextLevelPoints = level * 100;
    const progressPercentage = (points % 100);
    
    // Update UI
    document.getElementById('credit-points').textContent = points;
    document.getElementById('credit-level').textContent = `Level ${level}`;
    document.getElementById('credit-progress').style.width = `${progressPercentage}%`;
    
    // Points needed for next level
    const pointsToNextLevel = nextLevelPoints - points;
    document.getElementById('credit-to-next-level').textContent = `${pointsToNextLevel} points to next level`;
}

// Update performance statistics
function updatePerformanceStats(stats) {
    document.getElementById('completed-task-count').textContent = stats.completedTasks || 0;
    document.getElementById('on-time-percentage').textContent = `${stats.onTimePercentage || 0}%`;
    document.getElementById('avg-task-quality').textContent = stats.avgQualityRating?.toFixed(1) || '0.0';
    document.getElementById('contribution-score').textContent = stats.contributionScore || 0;
}

// Load user activity history
async function loadActivityHistory() {
    try {
        const response = await fetch(`${API_URL}/users/activity`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch activity history');
        }
        
        const activities = await response.json();
        displayActivityHistory(activities);
        
    } catch (error) {
        console.error('Error loading activity history:', error);
        
        // Show mock data for demo
        const mockActivities = [
            {
                id: 1,
                type: 'TASK_COMPLETED',
                message: 'Completed task "Create Login UI"',
                timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                projectId: 1,
                projectName: 'Web Development Project'
            },
            {
                id: 2,
                type: 'PROJECT_JOINED',
                message: 'Joined project "Mobile App Development"',
                timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                projectId: 2,
                projectName: 'Mobile App Development'
            },
            {
                id: 3,
                type: 'TASK_ASSIGNED',
                message: 'Assigned to task "Implement API Integration"',
                timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
                projectId: 1,
                projectName: 'Web Development Project'
            },
            {
                id: 4,
                type: 'COMMENT_ADDED',
                message: 'Commented on task "Database Design"',
                timestamp: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
                projectId: 1,
                projectName: 'Web Development Project'
            },
            {
                id: 5,
                type: 'ACHIEVEMENT_UNLOCKED',
                message: 'Unlocked achievement "First Task Completed"',
                timestamp: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
            }
        ];
        
        displayActivityHistory(mockActivities);
    }
}

// Display activity history
function displayActivityHistory(activities) {
    const activityList = document.getElementById('activity-list');
    
    if (!activities || activities.length === 0) {
        activityList.innerHTML = '<li class="activity-item">No recent activity</li>';
        return;
    }
    
    const activitiesHtml = activities.map(activity => {
        // Format time ago
        const timeAgo = formatTimeAgo(activity.timestamp);
        
        // Get icon based on activity type
        let icon = '🔔';
        switch (activity.type) {
            case 'TASK_COMPLETED':
                icon = '✅';
                break;
            case 'TASK_ASSIGNED':
                icon = '📋';
                break;
            case 'PROJECT_JOINED':
                icon = '🚀';
                break;
            case 'PROJECT_CREATED':
                icon = '🏗️';
                break;
            case 'COMMENT_ADDED':
                icon = '💬';
                break;
            case 'ACHIEVEMENT_UNLOCKED':
                icon = '🏆';
                break;
        }
        
        // Create link if applicable
        let link = '';
        if (activity.projectId) {
            link = `project-details.html?id=${activity.projectId}`;
        } else if (activity.type === 'TASK_ASSIGNED' || activity.type === 'TASK_COMPLETED') {
            link = 'task-management.html';
        }
        
        const activityContent = link 
            ? `<a href="${link}">${activity.message}</a>` 
            : activity.message;
        
        return `
            <li class="activity-item">
                <div class="activity-icon">${icon}</div>
                <div class="activity-content">
                    <div>${activityContent}</div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
            </li>
        `;
    }).join('');
    
    activityList.innerHTML = activitiesHtml;
}

// Load user achievements
async function loadAchievements() {
    try {
        const response = await fetch(`${API_URL}/users/achievements`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch achievements');
        }
        
        const achievements = await response.json();
        displayAchievements(achievements);
        
    } catch (error) {
        console.error('Error loading achievements:', error);
        
        // Show mock data for demo
        const mockAchievements = [
            {
                id: 1,
                name: 'First Task Completed',
                description: 'Complete your first task',
                unlocked: true,
                unlockedAt: new Date(Date.now() - 432000000).toISOString() // 5 days ago
            },
            {
                id: 2,
                name: 'Problem Solver',
                description: 'Approve a problem statement',
                unlocked: false
            },
            {
                id: 3,
                name: 'Team Player',
                description: 'Join 3 different projects',
                unlocked: true,
                unlockedAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
            },
            {
                id: 4,
                name: 'Quality Focused',
                description: 'Get 5 tasks approved without rejections',
                unlocked: false
            }
        ];
        
        displayAchievements(mockAchievements);
    }
}

// Display achievements
function displayAchievements(achievements) {
    const achievementsContainer = document.getElementById('achievements-container');
    
    if (!achievements || achievements.length === 0) {
        achievementsContainer.innerHTML = '<div style="text-align: center; padding: 20px;">No achievements available</div>';
        return;
    }
    
    const achievementsHtml = achievements.map(achievement => {
        const iconClass = achievement.unlocked ? 'unlocked' : 'locked';
        const icon = achievement.unlocked ? getAchievementIcon(achievement.name) : '🔒';
        
        return `
            <div class="achievement">
                <div class="achievement-icon ${iconClass}">${icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    ${achievement.unlocked ? `<div class="achievement-date">Unlocked: ${formatDate(achievement.unlockedAt)}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    achievementsContainer.innerHTML = achievementsHtml;
}

// Get icon for achievement
function getAchievementIcon(achievementName) {
    switch (achievementName) {
        case 'First Task Completed':
            return '✅';
        case 'Problem Solver':
            return '🧩';
        case 'Team Player':
            return '👥';
        case 'Quality Focused':
            return '🌟';
        default:
            return '🏆';
    }
}

// Setup edit profile functionality
function setupEditProfile() {
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const editProfileForm = document.getElementById('edit-profile-form');
    
    if (editProfileBtn && editProfileForm) {
        // Open edit modal
        editProfileBtn.addEventListener('click', () => {
            // Populate form with current user data
            const currentUser = getCurrentUser();
            
            if (currentUser) {
                document.getElementById('edit-username').value = currentUser.username;
                document.getElementById('edit-email').value = currentUser.email || '';
                
                // Try to get full name and bio from profile elements
                const fullName = document.getElementById('profile-name').textContent;
                document.getElementById('edit-fullname').value = fullName !== currentUser.username ? fullName : '';
                
                // There's no bio in the current UI, but we'll add the field for future use
                document.getElementById('edit-bio').value = '';
            }
            
            // Show modal
            document.getElementById('edit-profile-modal').classList.add('show');
            document.getElementById('modal-backdrop').classList.add('show');
        });
        
        // Close modal
        document.getElementById('close-edit-profile-modal').addEventListener('click', () => {
            document.getElementById('edit-profile-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        });
        
        document.getElementById('cancel-edit-profile').addEventListener('click', () => {
            document.getElementById('edit-profile-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        });
        
        // Handle form submission
        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updateData = {
                fullName: document.getElementById('edit-fullname').value,
                email: document.getElementById('edit-email').value,
                bio: document.getElementById('edit-bio').value
            };
            
            try {
                const response = await fetch(`${API_URL}/users/profile`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(updateData)
                });
                
                if (!response.ok) {
                    throw new Error('Failed to update profile');
                }
                
                // Update current user in local storage
                const currentUser = getCurrentUser();
                if (currentUser) {
                    currentUser.email = updateData.email;
                    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
                }
                
                // Reload profile data
                await loadUserProfile();
                
                // Close modal
                document.getElementById('edit-profile-modal').classList.remove('show');
                document.getElementById('modal-backdrop').classList.remove('show');
                
                // Show success message
                alert('Profile updated successfully');
                
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Failed to update profile. Please try again.');
            }
        });
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Format time ago (already defined in notifications.js, but duplicated here for independence)
function formatTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return `${diffInSeconds} seconds ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}