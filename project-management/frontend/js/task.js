// Task management functionality
let currentTasks = [];
let taskFilters = {
    status: 'all',
    priority: 'all'
};

// Initialize task management on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check authentication first
        if (!checkTokenValidity()) {
            return; // This will redirect to login page
        }
        
        // Initialize the page UI
        setupTasksPage();
        
        // Load data
        await loadTasks();
    } catch (error) {
        console.error("Error initializing page:", error);
        showAlert('alert-danger', 'Failed to initialize page. Please refresh or try again later.');
    }
});

// Update the setupFilterButtons function to handle all task statuses correctly
function setupFilterButtons() {
    const statusFilterButtons = document.querySelectorAll('.filter-btn');
    const priorityFilterButtons = document.querySelectorAll('.priority-filter');
    
    // Status filters
    if (statusFilterButtons) {
        statusFilterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                statusFilterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Update filter - convert filter value to backend enum value
                const filterValue = button.dataset.filter;
                taskFilters.status = filterValue;
                
                // Apply filters
                filterTasks();
                
                // Debug info
                console.log(`Filter changed to: ${filterValue}`);
            });
        });
    }
    
    // Rest of your existing priority filter code
}

// Update the loadTasks function in task.js
async function loadTasks() {
    // Check if container exists before proceeding
    const tasksContainer = document.getElementById('my-tasks-container');
    if (!tasksContainer) {
        console.error('Tasks container not found');
        // Create the container if missing
        const mainContent = document.querySelector('.main-content') || document.body;
        const newContainer = document.createElement('ul');
        newContainer.id = 'my-tasks-container';
        newContainer.className = 'task-list';
        mainContent.appendChild(newContainer);
    }
    
    try {
        // Find the tasks container
        const tasksContainer = document.getElementById('my-tasks-container');
        if (!tasksContainer) {
            console.error("Tasks container not found");
            return;
        }
        
        // Show loading indicator with proper class
        tasksContainer.innerHTML = '<li class="task-item loading-tasks"><span>Loading tasks...</span></li>';
        
        // Check token validity before making the request
        if (!checkTokenValidity()) {
            return; // This will redirect to login page
        }
        
        // Attempt to fetch tasks from API
        let tasks = [];
        try {
            const response = await fetch(`${API_URL}/tasks/my-tasks`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                if (response.status === 403) {
                    // Authentication failed - redirect to login
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem(USER_KEY);
                    window.location.href = 'login.html?redirect=task-management.html&error=session_expired';
                    return;
                }
                throw new Error(`Error: ${response.status}`);
            }
            
            // Process successful response
            tasks = await response.json();
        } catch (error) {
            console.error("Error fetching tasks:", error);
            // Fall back to mock data in development/demo mode
            tasks = getMockTasks();
        }
        
        // Store tasks in global variable
        currentTasks = tasks;
        
        // Reset filters to ensure all tasks display
        taskFilters.status = 'all';
        taskFilters.priority = 'all';
        
        // Display tasks in the UI
        displayTasks();
        
        // Update statistics
        updateTaskStatistics();
        
    } catch (error) {
        console.error("Error loading tasks:", error);
        
        // Check if container exists before updating
        const tasksContainer = document.getElementById('my-tasks-container');
        if (tasksContainer) {
            tasksContainer.innerHTML = `
                <li class="task-item">
                    <div class="alert alert-danger">
                        ${error.message || 'Failed to load tasks. Please try again.'}
                    </div>
                </li>
            `;
        } else {
            // Create an alert if the container doesn't exist
            showAlert('Failed to load tasks. Please try again.', 'danger');
        }
    }
}

// Get mock tasks for demo
function getMockTasks() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return [
        {
            id: 1,
            title: "Create Login UI",
            description: "Design and implement the login screen with username and password fields.",
            status: "COMPLETED",
            priority: "HIGH",
            assignee: {
                id: 1,
                username: "jsmith",
                fullName: "John Smith"
            },
            project: {
                id: 1,
                name: "Web Development Project"
            },
            dueDate: today.toISOString(),
            createdAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            completedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            creditPoints: 25
        },
        {
            id: 2,
            title: "Implement User Authentication",
            description: "Implement the backend authentication logic for user login and registration.",
            status: "IN_PROGRESS",
            priority: "HIGH",
            assignee: {
                id: 1,
                username: "jsmith",
                fullName: "John Smith"
            },
            project: {
                id: 1,
                name: "Web Development Project"
            },
            dueDate: tomorrow.toISOString(),
            createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            creditPoints: 40
        },
        {
            id: 3,
            title: "Design Database Schema",
            description: "Create the database schema for the application, including tables for users, projects, and tasks.",
            status: "TO_DO",
            priority: "MEDIUM",
            assignee: {
                id: 1,
                username: "jsmith",
                fullName: "John Smith"
            },
            project: {
                id: 1,
                name: "Web Development Project"
            },
            dueDate: nextWeek.toISOString(),
            createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            creditPoints: 30
        },
        {
            id: 4,
            title: "Implement API Integration",
            description: "Integrate the frontend with the backend API endpoints for user management.",
            status: "TO_DO",
            priority: "LOW",
            assignee: {
                id: 1,
                username: "jsmith",
                fullName: "John Smith"
            },
            project: {
                id: 2,
                name: "Mobile App Development"
            },
            dueDate: nextWeek.toISOString(),
            createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            creditPoints: 35
        },
        {
            id: 5,
            title: "Write User Documentation",
            description: "Create comprehensive user documentation explaining how to use the application.",
            status: "IN_REVIEW",
            priority: "MEDIUM",
            assignee: {
                id: 1,
                username: "jsmith",
                fullName: "John Smith"
            },
            project: {
                id: 1,
                name: "Web Development Project"
            },
            dueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            creditPoints: 20
        }
    ];
}

// Update the displayTasks function to show all status types correctly
function displayTasks() {
    // First, clear the loading message from the container
    const container = document.getElementById('my-tasks-container');
    if (container) {
        // Check if task-list exists as a child or if my-tasks-container itself is the task list
        let taskList = document.getElementById('task-list');
        if (!taskList && container.id !== 'task-list') {
            // If the HTML structure expects my-tasks-container to be the task list
            taskList = container;
        } else if (!taskList) {
            // If we need to create a new task list element
            taskList = document.createElement('div');
            taskList.id = 'task-list';
            container.innerHTML = ''; // Clear the container
            container.appendChild(taskList);
        }
        
        // Apply filters to tasks
        const filteredTasks = filterTasksArray(currentTasks);
        
        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<div class="no-tasks">No tasks found matching the current filters.</div>';
            return;
        }
        
        // Generate HTML
        const tasksHtml = filteredTasks.map(task => {
            // Format status
            let statusClass = 'badge-secondary';
            let statusText = 'Unknown';
            
            switch (task.status) {
                case 'TO_DO':
                case 'PENDING':
                    statusClass = 'badge-secondary';
                    statusText = task.status === 'TO_DO' ? 'To Do' : 'Pending';
                    break;
                case 'IN_PROGRESS':
                    statusClass = 'badge-primary';
                    statusText = 'In Progress';
                    break;
                case 'UNDER_REVIEW':
                    statusClass = 'badge-info';
                    statusText = 'Under Review';
                    break;
                case 'COMPLETED':
                    statusClass = 'badge-success';
                    statusText = 'Completed';
                    break;
                case 'REJECTED':
                    statusClass = 'badge-danger';
                    statusText = 'Rejected';
                    break;
                default:
                    statusClass = 'badge-secondary';
                    statusText = task.status || 'Unknown';
            }
            
            // Format priority
            let priorityClass = 'badge-secondary';
            let priorityText = 'Unknown';
            
            switch (task.priority) {
                case 'LOW':
                    priorityClass = 'badge-success';
                    priorityText = 'Low';
                    break;
                case 'MEDIUM':
                    priorityClass = 'badge-warning';
                    priorityText = 'Medium';
                    break;
                case 'HIGH':
                    priorityClass = 'badge-danger';
                    priorityText = 'High';
                    break;
            }
            
            // Format due date
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            const isOverdue = dueDate < today && task.status !== 'COMPLETED';
            
            // Check if task is due today
            const isDueToday = dueDate.getDate() === today.getDate() &&
                              dueDate.getMonth() === today.getMonth() &&
                              dueDate.getFullYear() === today.getFullYear();
            
            let dueDateClass = '';
            if (isOverdue) {
                dueDateClass = 'text-danger';
            } else if (isDueToday) {
                dueDateClass = 'text-warning';
            }
            
            return `
                <div class="task-item" data-task-id="${task.id}">
                    <div class="task-header">
                        <div class="task-title">${task.title}</div>
                        <div class="task-badges">
                            <span class="badge ${statusClass} task-status">${statusText}</span>
                            <span class="badge ${priorityClass} task-priority">${priorityText}</span>
                        </div>
                    </div>
                    <div class="task-body">
                        <div class="task-description">${task.description.substring(0, 150)}${task.description.length > 150 ? '...' : ''}</div>
                        <div class="task-meta">
                            <div class="task-project">
                                <i class="fas fa-folder"></i> ${task.project.name}
                            </div>
                            <div class="task-due-date ${dueDateClass}">
                                <i class="fas fa-calendar-alt"></i> ${formatDate(task.dueDate)}
                                ${isOverdue ? '<span class="overdue-label">Overdue</span>' : ''}
                                ${isDueToday ? '<span class="due-today-label">Due Today</span>' : ''}
                            </div>
                            <div class="task-credit-points">
                                <i class="fas fa-star"></i> ${task.creditPoints} points
                            </div>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-sm btn-info view-task-btn" data-task-id="${task.id}">View</button>
                        ${task.status === 'TO_DO' || task.status === 'IN_PROGRESS' ? 
                            `<button class="btn btn-sm btn-success complete-task-btn" data-task-id="${task.id}">Complete</button>` : ''}
                        ${task.status === 'TO_DO' ? 
                            `<button class="btn btn-sm btn-primary start-task-btn" data-task-id="${task.id}">Start</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        taskList.innerHTML = tasksHtml;
        
        // Before ending the function, add this to remove loading message
        const loadingElement = document.querySelector('.loading-tasks');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Debug info
        console.log(`Displaying ${filteredTasks.length} tasks from ${currentTasks.length} total tasks`);
    }
}

// Update the filterTasksArray function to handle all statuses properly
function filterTasksArray(tasks) {
    return tasks.filter(task => {
        // Status filter
        if (taskFilters.status !== 'all') {
            if (taskFilters.status === 'PENDING' && task.status !== 'PENDING' && task.status !== 'TO_DO') {
                return false;
            } else if (taskFilters.status !== 'PENDING' && task.status !== taskFilters.status) {
                return false;
            }
        }
        
        // Priority filter - keep your existing code
        if (taskFilters.priority !== 'all' && task.priority !== taskFilters.priority) {
            return false;
        }
        
        // Always return true if all filters pass
        return true;
    });
}

// Apply filters to displayed tasks
function filterTasks() {
    displayTasks();
}

// Setup create task form
function setupCreateTaskForm() {
    const createTaskBtn = document.getElementById('create-task-btn');
    const createTaskForm = document.getElementById('create-task-form');
    
    if (createTaskBtn && createTaskForm) {
        // Open modal
        createTaskBtn.addEventListener('click', async () => {
            // Show modal
            document.getElementById('create-task-modal').classList.add('show');
            document.getElementById('modal-backdrop').classList.add('show');
            
            // Load projects for dropdown
            await loadProjectsForDropdown();
        });
        
        // Close modal
        document.getElementById('close-create-task-modal').addEventListener('click', () => {
            document.getElementById('create-task-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        });
        
        document.getElementById('cancel-create-task').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('create-task-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        });
        
        // Handle form submission
        createTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const taskData = {
                title: document.getElementById('task-title').value,
                description: document.getElementById('task-description').value,
                projectId: parseInt(document.getElementById('task-project').value),
                priority: document.getElementById('task-priority').value,
                dueDate: document.getElementById('task-due-date').value
            };
            
            try {
                const response = await fetch(`${API_URL}/tasks`, {
                    method: 'POST',
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(taskData)
                });
                
                if (!response.ok) {
                    throw new Error('Failed to create task');
                }
                
                // Add new task to the list
                const newTask = await response.json();
                currentTasks.unshift(newTask);
                
                // Refresh the display
                displayTasks();
                
                // Close modal
                document.getElementById('create-task-modal').classList.remove('show');
                document.getElementById('modal-backdrop').classList.remove('show');
                
                // Show success message
                showAlert('Task created successfully', 'success');
                
            } catch (error) {
                console.error('Error creating task:', error);
                
                // For demo purposes, create a mock task
                const newTask = {
                    id: currentTasks.length + 1,
                    title: taskData.title,
                    description: taskData.description,
                    status: 'TO_DO',
                    priority: taskData.priority,
                    assignee: {
                        id: 1,
                        username: getCurrentUser().username,
                        fullName: getCurrentUser().username
                    },
                    project: {
                        id: taskData.projectId,
                        name: document.getElementById('task-project').options[document.getElementById('task-project').selectedIndex].text
                    },
                    dueDate: new Date(taskData.dueDate).toISOString(),
                    createdAt: new Date().toISOString(),
                    creditPoints: Math.floor(Math.random() * 30) + 10 // Random points between 10-40
                };
                
                currentTasks.unshift(newTask);
                displayTasks();
                
                // Close modal
                document.getElementById('create-task-modal').classList.remove('show');
                document.getElementById('modal-backdrop').classList.remove('show');
                
                // Show success message
                showAlert('Task created successfully (Demo Mode)', 'success');
            }
        });
    }
}

// Load projects for dropdown
async function loadProjectsForDropdown() {
    const projectDropdown = document.getElementById('task-project');
    if (!projectDropdown) return;
    
    try {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch projects');
        }
        
        const projects = await response.json();
        
        // Clear existing options
        projectDropdown.innerHTML = '<option value="">Select Project</option>';
        
        // Add project options
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectDropdown.appendChild(option);
        });
        
        // Add change event listener to load members when project is selected
        projectDropdown.addEventListener('change', function() {
            const selectedProjectId = this.value;
            if (selectedProjectId) {
                loadProjectMembers(selectedProjectId);
            } else {
                // Clear assignee dropdown if no project selected
                const assigneeDropdown = document.getElementById('task-assignee');
                if (assigneeDropdown) {
                    assigneeDropdown.innerHTML = '<option value="">Select Assignee</option>';
                    assigneeDropdown.disabled = true;
                }
            }
        });
        
    } catch (error) {
        console.error('Error loading projects for dropdown:', error);
        
        // Mock data for demo
        projectDropdown.innerHTML = `
            <option value="">Select Project</option>
            <option value="1">Web Development Project</option>
            <option value="2">Mobile App Development</option>
            <option value="3">Database Redesign</option>
        `;
        
        // Add the same change event listener for the mock data
        projectDropdown.addEventListener('change', function() {
            const selectedProjectId = this.value;
            if (selectedProjectId) {
                loadProjectMembers(selectedProjectId);
            } else {
                // Clear assignee dropdown if no project selected
                const assigneeDropdown = document.getElementById('task-assignee');
                if (assigneeDropdown) {
                    assigneeDropdown.innerHTML = '<option value="">Select Assignee</option>';
                    assigneeDropdown.disabled = true;
                }
            }
        });
    }
}

// Load project members for assignee dropdown
async function loadProjectMembers(projectId) {
    const assigneeDropdown = document.getElementById('task-assignee');
    if (!assigneeDropdown) return;
    
    try {
        // Show loading state
        assigneeDropdown.innerHTML = '<option value="">Loading members...</option>';
        assigneeDropdown.disabled = true;
        
        // Fetch project members from the server using the improved API
        const response = await fetch(`${API_URL}/users/project/${projectId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch project members');
        }
        
        const members = await response.json();
        
        // Clear existing options
        assigneeDropdown.innerHTML = '<option value="">Select Assignee</option>';
        
        // Add member options
        members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.fullName || member.username;
            assigneeDropdown.appendChild(option);
        });
        
        // Enable dropdown
        assigneeDropdown.disabled = false;
        
    } catch (error) {
        console.error('Error loading project members:', error);
        
        // Set error state
        assigneeDropdown.innerHTML = '<option value="">Error loading members</option>';
        
        // Try again after a delay
        setTimeout(() => {
            // Mock data for demo
            assigneeDropdown.innerHTML = '<option value="">Select Assignee</option>';
            assigneeDropdown.disabled = false;
            
            const currentUser = getCurrentUser();
            if (currentUser) {
                const option = document.createElement('option');
                option.value = currentUser.id;
                option.textContent = currentUser.username;
                assigneeDropdown.appendChild(option);
            }
            
            // Add some mock members
            const mockMembers = [
                { id: '2', username: 'jsmith' },
                { id: '3', username: 'sarah85' },
                { id: '4', username: 'developer42' }
            ];
            
            mockMembers.forEach(member => {
                if (member.id !== currentUser?.id) {
                    const option = document.createElement('option');
                    option.value = member.id;
                    option.textContent = member.username;
                    assigneeDropdown.appendChild(option);
                }
            });
        }, 1000);
    }
}

// Setup task actions
function setupTaskActions() {
    // Updated to use my-tasks-container instead of task-list, since that's the actual container ID in the HTML
    const taskContainer = document.getElementById('my-tasks-container');
    if (!taskContainer) return;
    
    // Use event delegation for task actions
    taskContainer.addEventListener('click', async (e) => {
        // Check if clicked element or any of its parents has the class 'task-item'
        const taskItem = e.target.closest('.task-item');
        if (taskItem) {
            const taskId = taskItem.dataset.taskId;
            
            // If the view button is clicked
            if (e.target.classList.contains('view-task-btn')) {
                openTaskDetails(taskId);
            }
            
            // If the start button is clicked
            else if (e.target.classList.contains('start-task-btn')) {
                await startTask(taskId);
            }
            
            // If the complete button is clicked
            else if (e.target.classList.contains('complete-task-btn')) {
                await completeTask(taskId);
            }
            
            // If the task item itself is clicked (and not a button)
            else if (e.target === taskItem || !e.target.closest('button')) {
                openTaskDetails(taskId);
            }
        }
    });
}

// Open task details
function openTaskDetails(taskId) {
    // Find the task
    const task = currentTasks.find(t => t.id == taskId);
    if (!task) return;
    
    // Populate the task details modal
    document.getElementById('task-detail-title').textContent = task.title;
    document.getElementById('task-detail-description').textContent = task.description || 'No description provided';
    document.getElementById('task-detail-status').textContent = formatStatus(task.status);
    
    // Check if task has priority before trying to format it
    if (document.getElementById('task-detail-priority')) {
        document.getElementById('task-detail-priority').textContent = task.priority ? formatPriority(task.priority) : 'Not set';
    }
    
    document.getElementById('task-detail-project').textContent = task.project ? task.project.name : 'Unknown Project';
    
    // Safely handle assignee which may be undefined
    if (document.getElementById('task-detail-assignee')) {
        document.getElementById('task-detail-assignee').textContent = task.assignee ? 
            (task.assignee.fullName || task.assignee.username || 'Unassigned') : 'Unassigned';
    }
    
    document.getElementById('task-detail-due-date').textContent = formatDate(task.dueDate) || 'Not set';
    document.getElementById('task-detail-created-date').textContent = formatDate(task.createdAt) || 'Unknown';
    
    // Set credit points if the element exists
    if (document.getElementById('task-detail-credit-points')) {
        document.getElementById('task-detail-credit-points').textContent = `${task.creditPoints || 0} points`;
    }
    
    // Set progress bar if elements exist
    const progressBar = document.getElementById('task-detail-progress');
    const progressText = document.getElementById('task-detail-progress-text');
    if (progressBar && progressText) {
        const progress = task.progressPercentage || 0;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;
    }
    
    // Get current user and role information
    const currentUser = getCurrentUser();
    const isLeader = currentUser.roles && currentUser.roles.includes('ROLE_LEADER');
    const isAssignee = task.assignee && task.assignee.id === currentUser.id;
    const isProjectLeader = task.project && task.project.leader && task.project.leader.id === currentUser.id;
    
    // Display elements based on user role and task status
    const taskDetailActionBtn = document.getElementById('task-detail-action-btn');
    const taskUpdateContainer = document.getElementById('task-update-container');
    const taskSubmitContainer = document.getElementById('task-submit-container');
    const taskReviewContainer = document.getElementById('task-review-container');
    
    // Hide all action containers by default
    if (taskDetailActionBtn) taskDetailActionBtn.style.display = 'none';
    if (taskUpdateContainer) taskUpdateContainer.classList.add('hidden');
    if (taskSubmitContainer) taskSubmitContainer.classList.add('hidden');
    if (taskReviewContainer) taskReviewContainer.classList.add('hidden');
    
    // Handle member actions
    if (isAssignee) {
        if (task.status === 'TO_DO' || task.status === 'PENDING') {
            if (taskDetailActionBtn) {
                taskDetailActionBtn.textContent = 'Start Task';
                taskDetailActionBtn.className = 'btn btn-primary';
                taskDetailActionBtn.style.display = 'block';
                taskDetailActionBtn.onclick = () => startTask(task.id);
            }
        } else if (task.status === 'IN_PROGRESS') {
            // Show update progress and submit for review options
            if (taskUpdateContainer) taskUpdateContainer.classList.remove('hidden');
            if (taskSubmitContainer) taskSubmitContainer.classList.remove('hidden');
            
            // Add event listener to update task progress
            const updateTaskForm = document.getElementById('update-task-form');
            if (updateTaskForm) {
                updateTaskForm.onsubmit = (e) => {
                    e.preventDefault();
                    const progressValue = document.getElementById('task-progress').value;
                    updateTaskProgress(task.id, progressValue);
                };
            }
            
            // Add event listener to submit for review
            const submitTaskBtn = document.getElementById('submit-task-btn');
            if (submitTaskBtn) {
                submitTaskBtn.onclick = () => submitTaskForReview(task.id);
            }
        } else if (task.status === 'REJECTED') {
            // Allow members to restart rejected tasks
            if (taskDetailActionBtn) {
                taskDetailActionBtn.textContent = 'Resume Task';
                taskDetailActionBtn.className = 'btn btn-warning';
                taskDetailActionBtn.style.display = 'block';
                taskDetailActionBtn.onclick = () => restartRejectedTask(task.id);
            }
        }
    }
    
    // Handle leader actions
    if (isProjectLeader && task.status === 'UNDER_REVIEW') {
        if (taskReviewContainer) {
            taskReviewContainer.classList.remove('hidden');
            
            // Add event listeners for approve/reject buttons
            const approveTaskBtn = document.getElementById('approve-task-btn');
            const rejectTaskBtn = document.getElementById('reject-task-btn');
            
            if (approveTaskBtn) {
                approveTaskBtn.onclick = () => reviewTask(task.id, true);
            }
            
            if (rejectTaskBtn) {
                rejectTaskBtn.onclick = () => reviewTask(task.id, false);
            }
        }
    }
    
    // Show completed date if task is completed
    const completedDateContainer = document.getElementById('task-detail-completed-container');
    if (completedDateContainer) {
        if (task.status === 'COMPLETED' && task.completedAt) {
            completedDateContainer.style.display = 'block';
            document.getElementById('task-detail-completed-date').textContent = formatDate(task.completedAt);
        } else {
            completedDateContainer.style.display = 'none';
        }
    }
    
    // Show task details modal
    document.getElementById('task-detail-modal').classList.add('show');
    document.getElementById('modal-backdrop').classList.add('show');
    
    // Close modal button - remove prior event listeners to prevent duplicates
    const closeButton = document.getElementById('close-task-detail-modal');
    const cloneCloseBtn = closeButton.cloneNode(true);
    closeButton.parentNode.replaceChild(cloneCloseBtn, closeButton);
    
    cloneCloseBtn.addEventListener('click', () => {
        document.getElementById('task-detail-modal').classList.remove('show');
        document.getElementById('modal-backdrop').classList.remove('show');
    });
}

// Start a task
async function startTask(taskId) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}/start`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to start task');
        }
        
        // Update the task in the current tasks array
        const updatedTask = await response.json();
        const taskIndex = currentTasks.findIndex(t => t.id == taskId);
        
        if (taskIndex !== -1) {
            currentTasks[taskIndex] = updatedTask;
        }
        
        // Refresh the display
        displayTasks();
        
        // Close the task detail modal if open
        if (document.getElementById('task-detail-modal').classList.contains('show')) {
            document.getElementById('task-detail-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        }
        
        // Show success message
        showAlert('Task started successfully', 'success');
        
    } catch (error) {
        console.error('Error starting task:', error);
        
        // For demo purposes, update the task locally
        const taskIndex = currentTasks.findIndex(t => t.id == taskId);
        
        if (taskIndex !== -1) {
            currentTasks[taskIndex].status = 'IN_PROGRESS';
        }
        
        // Refresh the display
        displayTasks();
        
        // Close the task detail modal if open
        if (document.getElementById('task-detail-modal').classList.contains('show')) {
            document.getElementById('task-detail-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        }
        
        // Show success message
        showAlert('Task started successfully (Demo Mode)', 'success');
    }
}

// Complete a task
async function completeTask(taskId) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}/complete`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to complete task');
        }
        
        // Update the task in the current tasks array
        const updatedTask = await response.json();
        const taskIndex = currentTasks.findIndex(t => t.id == taskId);
        
        if (taskIndex !== -1) {
            currentTasks[taskIndex] = updatedTask;
        }
        
        // Refresh the display
        displayTasks();
        
        // Close the task detail modal if open
        if (document.getElementById('task-detail-modal').classList.contains('show')) {
            document.getElementById('task-detail-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        }
        
        // Show success message
        showAlert('Task completed successfully! You earned ' + updatedTask.creditPoints + ' credit points.', 'success');
        
    } catch (error) {
        console.error('Error completing task:', error);
        
        // For demo purposes, update the task locally
        const taskIndex = currentTasks.findIndex(t => t.id == taskId);
        
        if (taskIndex !== -1) {
            currentTasks[taskIndex].status = 'COMPLETED';
            currentTasks[taskIndex].completedAt = new Date().toISOString();
            
            // Show the task's credit points
            const creditPoints = currentTasks[taskIndex].creditPoints;
            
            // Refresh the display
            displayTasks();
            
            // Close the task detail modal if open
            if (document.getElementById('task-detail-modal').classList.contains('show')) {
                document.getElementById('task-detail-modal').classList.remove('show');
                document.getElementById('modal-backdrop').classList.remove('show');
            }
            
            // Show success message
            showAlert(`Task completed successfully! You earned ${creditPoints} credit points. (Demo Mode)`, 'success');
        }
    }
}

// Also update your formatStatus helper to match
function formatStatus(status) {
    switch (status) {
        case 'TO_DO':
        case 'PENDING':
            return status === 'TO_DO' ? 'To Do' : 'Pending';
        case 'IN_PROGRESS':
            return 'In Progress';
        case 'UNDER_REVIEW':
            return 'Under Review';
        case 'COMPLETED':
            return 'Completed';
        case 'REJECTED':
            return 'Rejected';
        default:
            return status || 'Unknown';
    }
}

// Helper: Format priority
function formatPriority(priority) {
    switch (priority) {
        case 'LOW':
            return 'Low';
        case 'MEDIUM':
            return 'Medium';
        case 'HIGH':
            return 'High';
        default:
            return priority;
    }
}

// Helper: Format date
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Helper: Show alert
function showAlert(message, type = 'info') {
    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.style.position = 'fixed';
    alertElement.style.top = '20px';
    alertElement.style.right = '20px';
    alertElement.style.zIndex = '9999';
    alertElement.style.minWidth = '300px';
    
    // Add message
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    
    // Add to document
    document.body.appendChild(alertElement);
    
    // Add click event to close button
    alertElement.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(alertElement);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(alertElement)) {
            document.body.removeChild(alertElement);
        }
    }, 5000);
}

/**
 * Initialize the task management page UI elements
 */
function setupTasksPage() {
    // Initialize task filter buttons
    setupFilterButtons();
    
    // Initialize task action buttons and event listeners
    setupTaskActions();
    
    // Initialize create task form if exists
    setupCreateTaskForm();
    
    // Set up the task progress slider event (if it exists)
    const taskProgressSlider = document.getElementById('task-progress');
    if (taskProgressSlider) {
        taskProgressSlider.addEventListener('input', function() {
            const value = this.value;
            document.getElementById('progress-value').textContent = `${value}%`;
            
            // Update progress bar visually
            const progressBar = document.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.width = `${value}%`;
            }
        });
    }
    
    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // Initialize task statistics
    updateTaskStatistics();
}

/**
 * Update the task statistics displayed in the dashboard
 */
function updateTaskStatistics() {
    // Count tasks by status
    if (currentTasks.length > 0) {
        const totalTasks = currentTasks.length;
        const pendingTasks = currentTasks.filter(task => task.status === 'PENDING' || task.status === 'TO_DO').length;
        const inProgressTasks = currentTasks.filter(task => task.status === 'IN_PROGRESS').length;
        const underReviewTasks = currentTasks.filter(task => task.status === 'UNDER_REVIEW').length;
        const completedTasks = currentTasks.filter(task => task.status === 'COMPLETED').length;
        const rejectedTasks = currentTasks.filter(task => task.status === 'REJECTED').length;
        
        // Update the counts in the UI
        const totalElement = document.getElementById('total-my-tasks');
        const pendingElement = document.getElementById('pending-tasks');
        const inProgressElement = document.getElementById('in-progress-tasks');
        const reviewElement = document.getElementById('under-review-tasks');
        const completedElement = document.getElementById('completed-my-tasks');
        const rejectedElement = document.getElementById('rejected-tasks');
        
        if (totalElement) totalElement.textContent = totalTasks;
        if (pendingElement) pendingElement.textContent = pendingTasks;
        if (inProgressElement) inProgressElement.textContent = inProgressTasks;
        if (reviewElement) reviewElement.textContent = underReviewTasks;
        if (completedElement) completedElement.textContent = completedTasks;
        if (rejectedElement) rejectedElement.textContent = rejectedTasks;
    }
}

// Update task progress (for members)
async function updateTaskProgress(taskId, progressPercentage) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}/update-progress`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ progressPercentage: parseInt(progressPercentage) })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update task progress');
        }
        
        // Update the task in the current tasks array
        const updatedTask = await response.json();
        const taskIndex = currentTasks.findIndex(t => t.id == taskId);
        
        if (taskIndex !== -1) {
            currentTasks[taskIndex] = updatedTask;
        }
        
        // Update the task detail view
        const progressBar = document.getElementById('task-detail-progress');
        const progressText = document.getElementById('task-detail-progress-text');
        
        if (progressBar && progressText) {
            progressBar.style.width = `${progressPercentage}%`;
            progressText.textContent = `${progressPercentage}%`;
        }
        
        // Show success message
        showAlert('Task progress updated successfully', 'success');
        
    } catch (error) {
        console.error('Error updating task progress:', error);
        
        // For demo purposes, update the task progress locally
        const taskIndex = currentTasks.findIndex(t => t.id == taskId);
        
        if (taskIndex !== -1) {
            currentTasks[taskIndex].progressPercentage = parseInt(progressPercentage);
            
            // Update status based on progress
            if (progressPercentage < 100) {
                currentTasks[taskIndex].status = 'IN_PROGRESS';
            }
            
            // Update the progress bar
            const progressBar = document.getElementById('task-detail-progress');
            const progressText = document.getElementById('task-detail-progress-text');
            
            if (progressBar && progressText) {
                progressBar.style.width = `${progressPercentage}%`;
                progressText.textContent = `${progressPercentage}%`;
            }
            
            // Show success message
            showAlert('Task progress updated successfully (Demo Mode)', 'success');
        }
    }
}

// Submit task for review (for members)
async function submitTaskForReview(taskId) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}/submit`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit task for review');
        }
        
        // Get the updated task
        const taskIndex = currentTasks.findIndex(t => t.id == taskId);
        if (taskIndex !== -1) {
            currentTasks[taskIndex].status = 'UNDER_REVIEW';
            currentTasks[taskIndex].progressPercentage = 100;
        }
        
        // Refresh the display
        displayTasks();
        
        // Close the task detail modal
        document.getElementById('task-detail-modal').classList.remove('show');
        document.getElementById('modal-backdrop').classList.remove('show');
        
        // Show success message
        showAlert('Task submitted for review successfully', 'success');
        
    } catch (error) {
        console.error('Error submitting task for review:', error);
        
        // For demo purposes, update the task locally
        const taskIndex = currentTasks.findIndex(t => t.id == taskId);
        if (taskIndex !== -1) {
            currentTasks[taskIndex].status = 'UNDER_REVIEW';
            currentTasks[taskIndex].progressPercentage = 100;
            
            // Refresh the display
            displayTasks();
            
            // Close the task detail modal
            document.getElementById('task-detail-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
            
            // Show success message
            showAlert('Task submitted for review successfully (Demo Mode)', 'success');
        }
    }
}

// Review task (for leaders)
async function reviewTask(taskId, approved) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}/review?approved=${approved}`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Failed to ${approved ? 'approve' : 'reject'} task`);
        }
        
        // Update the task in our array
        const taskIndex = currentTasks.findIndex(t => t.id == taskId);
        if (taskIndex !== -1) {
            if (approved) {
                currentTasks[taskIndex].status = 'COMPLETED';
                currentTasks[taskIndex].completedAt = new Date().toISOString();
            } else {
                currentTasks[taskIndex].status = 'REJECTED';
                currentTasks[taskIndex].progressPercentage = 75; // Reset to 75% if rejected
            }
        }
        
        // Refresh the display
        displayTasks();
        
        // Close the task detail modal
        document.getElementById('task-detail-modal').classList.remove('show');
        document.getElementById('modal-backdrop').classList.remove('show');
        
        // Show success message
        showAlert(`Task ${approved ? 'approved' : 'rejected'} successfully`, 'success');
        
    } catch (error) {
        console.error(`Error ${approved ? 'approving' : 'rejecting'} task:`, error);
        
        // For demo purposes, update the task locally
        const taskIndex = currentTasks.findIndex(t => t.id == taskId);
        if (taskIndex !== -1) {
            if (approved) {
                currentTasks[taskIndex].status = 'COMPLETED';
                currentTasks[taskIndex].completedAt = new Date().toISOString();
            } else {
                currentTasks[taskIndex].status = 'REJECTED';
                currentTasks[taskIndex].progressPercentage = 75;
            }
            
            // Refresh the display
            displayTasks();
            
            // Close the task detail modal
            document.getElementById('task-detail-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
            
            // Show success message
            showAlert(`Task ${approved ? 'approved' : 'rejected'} successfully (Demo Mode)`, 'success');
        }
    }
}

// Restart rejected task (for members)
async function restartRejectedTask(taskId) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}/restart`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to restart task');
        }
        
        // Get the updated task
        const updatedTask = await response.json();
        const taskIndex = currentTasks.findIndex(t => t.id == taskId);
        if (taskIndex !== -1) {
            currentTasks[taskIndex] = updatedTask;
        }
        
        // Refresh the display
        displayTasks();
        
        // Close the task detail modal
        document.getElementById('task-detail-modal').classList.remove('show');
        document.getElementById('modal-backdrop').classList.remove('show');
        
        // Show success message
        showAlert('Task restarted successfully', 'success');
        
    } catch (error) {
        console.error('Error restarting task:', error);
        
        // For demo purposes, update the task locally
        const taskIndex = currentTasks.findIndex(t => t.id == taskId);
        if (taskIndex !== -1) {
            currentTasks[taskIndex].status = 'IN_PROGRESS';
            currentTasks[taskIndex].progressPercentage = 75;
            
            // Refresh the display
            displayTasks();
            
            // Close the task detail modal
            document.getElementById('task-detail-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
            
            // Show success message
            showAlert('Task restarted successfully (Demo Mode)', 'success');
        }
    }
}

