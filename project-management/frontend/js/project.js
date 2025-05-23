// Global variables
let currentProject = null;
let currentTab = 'overview';
let currentTaskFilter = 'all';

// Initialize project details page
document.addEventListener('DOMContentLoaded', async () => {
    // Skip if not on project details page
    if (!window.location.pathname.includes('project-details.html')) return;
    
    // Get project ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    if (!projectId) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Load project details
    await loadProjectDetails(projectId);
    
    // Setup tabs
    setupTabs();
    
    // Setup task filters
    setupTaskFilters();
    
    // Setup edit project functionality
    setupEditProject();
    
    // Setup problem statement approval
    setupProblemStatementApproval();
    
    // Setup member management
    setupMemberManagement();
    
    // Setup task management
    setupTaskManagement();
});

// Load project details
async function loadProjectDetails(projectId) {
    try {
        const response = await fetch(`${API_URL}/projects/${projectId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch project details');
        }
        
        const project = await response.json();
        currentProject = project;
        
        // Display project details
        displayProjectDetails(project);
        
        // Load project tasks
        await loadProjectTasks(projectId);
        
        // Update insights
        updateProjectInsights(project);
        
    } catch (error) {
        console.error('Error loading project details:', error);
        alert('Failed to load project details. Redirecting to dashboard.');
        window.location.href = 'dashboard.html';
    }
}

// Display project details
function displayProjectDetails(project) {
    // Set project title
    document.getElementById('project-title').textContent = project.name;
    
    // Set project description
    document.getElementById('project-description').textContent = project.description || 'No description provided.';
    
    // Set problem statement
    document.getElementById('project-problem-statement').textContent = project.problemStatement || 'No problem statement provided.';
    
    // Set problem statement status
    const problemStatementStatus = document.getElementById('problem-statement-status');
    // Check for both property names (with and without 'is' prefix) for compatibility
    const isProblemStatementApproved = project.problemStatementApproved || project.isProblemStatementApproved;
    
    if (isProblemStatementApproved) {
        problemStatementStatus.innerHTML = '<span class="badge badge-success">Approved</span>';
    } else {
        problemStatementStatus.innerHTML = '<span class="badge badge-warning">Pending Approval</span>';
    }
    
    // Show approve button if current user is the leader and problem statement is not approved
    const currentUser = getCurrentUser();
    const isLeader = project.leader.id === currentUser.id;
    const approveContainer = document.getElementById('approve-problem-statement-container');
    
    if (isLeader && !isProblemStatementApproved) {
        approveContainer.classList.remove('hidden');
    } else {
        approveContainer.classList.add('hidden');
    }
    
    // Set timestamps
    document.getElementById('project-created-at').textContent = formatDateTime(project.createdAt);
    document.getElementById('project-updated-at').textContent = formatDateTime(project.updatedAt);
    
    // Set leader info
    document.getElementById('leader-name').textContent = project.leader.username;
    document.getElementById('leader-avatar').textContent = project.leader.username.charAt(0).toUpperCase();
    
    // Show edit buttons for leader
    if (isLeader) {
        document.getElementById('leader-actions').classList.remove('hidden');
        document.getElementById('task-leader-actions').classList.remove('hidden');
        document.getElementById('members-leader-actions').classList.remove('hidden');
    }
    
    // Display members
    displayMembers(project);
}

// Display project members
function displayMembers(project) {
    const membersList = document.getElementById('members-list');
    const currentUser = getCurrentUser();
    const isLeader = project.leader.id === currentUser.id;
    
    if (!project.members || project.members.length === 0) {
        membersList.innerHTML = '<li class="member-item"><div class="member-info">No members yet</div></li>';
        return;
    }
    
    const membersHtml = project.members.map(member => {
        const isCurrentUser = member.id === currentUser.id;
        const canRemove = isLeader && !isCurrentUser;
        
        return `
            <li class="member-item">
                <div class="member-avatar">${member.username.charAt(0).toUpperCase()}</div>
                <div class="member-info">
                    <div class="member-name">${member.username} ${isCurrentUser ? '(You)' : ''}</div>
                    <div class="member-role">${member.id === project.leader.id ? 'Project Leader' : 'Member'}</div>
                </div>
                ${canRemove ? `<button class="btn btn-danger btn-sm remove-member" data-id="${member.id}">Remove</button>` : ''}
            </li>
        `;
    }).join('');
    
    membersList.innerHTML = membersHtml;
    
    // Add event listeners for remove buttons
    document.querySelectorAll('.remove-member').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const memberId = button.dataset.id;
            if (confirm('Are you sure you want to remove this member from the project?')) {
                await removeMember(memberId);
            }
        });
    });
}

// Load project tasks
async function loadProjectTasks(projectId) {
    try {
        const response = await fetch(`${API_URL}/tasks/project/${projectId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch project tasks');
        }
        
        const tasks = await response.json();
        
        // Store tasks in the project object
        currentProject.tasks = tasks;
        
        // Display tasks
        displayTasks(tasks, currentTaskFilter);
        
    } catch (error) {
        console.error('Error loading project tasks:', error);
        document.getElementById('project-tasks').innerHTML = '<li class="task-item"><span>Error loading tasks</span></li>';
    }
}

// Display project tasks
function displayTasks(tasks, filter = 'all') {
    const tasksList = document.getElementById('project-tasks');
    
    if (!tasks || tasks.length === 0) {
        tasksList.innerHTML = '<li class="task-item"><span>No tasks yet</span></li>';
        return;
    }
    
    // Filter tasks based on the selected filter
    const filteredTasks = filter === 'all' 
        ? tasks 
        : tasks.filter(task => task.status === filter);
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<li class="task-item"><span>No tasks match the selected filter</span></li>';
        return;
    }
    
    const tasksHtml = filteredTasks.map(task => {
        // Get status badge class
        let statusBadgeClass = 'badge-primary';
        switch (task.status) {
            case 'PENDING':
                statusBadgeClass = 'badge-warning';
                break;
            case 'IN_PROGRESS':
                statusBadgeClass = 'badge-primary';
                break;
            case 'UNDER_REVIEW':
                statusBadgeClass = 'badge-info';
                break;
            case 'COMPLETED':
                statusBadgeClass = 'badge-success';
                break;
            case 'REJECTED':
                statusBadgeClass = 'badge-danger';
                break;
        }
        
        return `
            <li class="task-item" data-id="${task.id}">
                <div>
                    <div class="task-title">${task.title}</div>
                    <div class="mt-1">
                        <span class="badge ${statusBadgeClass}">${formatTaskStatus(task.status)}</span>
                        <span>Assigned to: ${task.assignedTo ? task.assignedTo.username : 'Unassigned'}</span>
                    </div>
                </div>
                <div class="task-meta">
                    <div class="progress" style="width: 100px; margin-right: 15px;">
                        <div class="progress-bar" style="width: ${task.progressPercentage}%;"></div>
                    </div>
                    <span>${task.progressPercentage}%</span>
                </div>
            </li>
        `;
    }).join('');
    
    tasksList.innerHTML = tasksHtml;
    
    // Add click event listeners to tasks
    document.querySelectorAll('.task-item').forEach(item => {
        item.addEventListener('click', () => {
            const taskId = item.dataset.id;
            const task = currentProject.tasks.find(t => t.id == taskId);
            if (task) {
                showTaskDetails(task);
            }
        });
    });
}

// Setup tab switching
function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
            
            // Show the selected tab content
            const tabName = tab.dataset.tab;
            document.getElementById(`${tabName}-tab`).classList.remove('hidden');
            
            // Update current tab
            currentTab = tabName;
        });
    });
}

// Setup task filters
function setupTaskFilters() {
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all filters
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked filter
            button.classList.add('active');
            
            // Update current filter
            currentTaskFilter = button.dataset.filter;
            
            // Refresh task display
            if (currentProject && currentProject.tasks) {
                displayTasks(currentProject.tasks, currentTaskFilter);
            }
        });
    });
}

// Setup edit project functionality
function setupEditProject() {
    const editProjectBtn = document.getElementById('edit-project-btn');
    const editForm = document.getElementById('edit-project-form');
    
    if (editProjectBtn && editForm) {
        // Open edit modal
        editProjectBtn.addEventListener('click', () => {
            // Populate form with current project data
            document.getElementById('edit-project-name').value = currentProject.name;
            document.getElementById('edit-project-description').value = currentProject.description || '';
            document.getElementById('edit-project-problem-statement').value = currentProject.problemStatement || '';
            
            // Show modal
            document.getElementById('edit-project-modal').classList.add('show');
            document.getElementById('modal-backdrop').classList.add('show');
        });
        
        // Close modal
        document.getElementById('close-edit-project-modal').addEventListener('click', () => {
            document.getElementById('edit-project-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        });
        
        document.getElementById('cancel-edit-project').addEventListener('click', () => {
            document.getElementById('edit-project-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        });
        
        // Handle form submission
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updateData = {
                name: document.getElementById('edit-project-name').value,
                description: document.getElementById('edit-project-description').value,
                problemStatement: document.getElementById('edit-project-problem-statement').value
            };
            
            try {
                const response = await fetch(`${API_URL}/projects/${currentProject.id}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(updateData)
                });
                
                if (!response.ok) {
                    throw new Error('Failed to update project');
                }
                
                const updatedProject = await response.json();
                
                // Update current project
                currentProject = updatedProject;
                
                // Update UI
                displayProjectDetails(updatedProject);
                
                // Close modal
                document.getElementById('edit-project-modal').classList.remove('show');
                document.getElementById('modal-backdrop').classList.remove('show');
                
            } catch (error) {
                console.error('Error updating project:', error);
                alert('Failed to update project. Please try again.');
            }
        });
    }
}

// Setup problem statement approval
function setupProblemStatementApproval() {
    const approveBtn = document.getElementById('approve-problem-statement-btn');
    
    if (approveBtn) {
        approveBtn.addEventListener('click', async () => {
            if (!currentProject) return;
            
            try {
                const response = await fetch(`${API_URL}/projects/${currentProject.id}/approve-problem-statement`, {
                    method: 'PUT',
                    headers: getAuthHeaders()
                });
                
                if (!response.ok) {
                    throw new Error('Failed to approve problem statement');
                }
                
                // Update UI
                document.getElementById('problem-statement-status').innerHTML = '<span class="badge badge-success">Approved</span>';
                document.getElementById('approve-problem-statement-container').classList.add('hidden');
                
                // Update both possible property names in the current project object
                currentProject.isProblemStatementApproved = true;
                currentProject.problemStatementApproved = true;
                
                // Show success message
                alert('Problem statement approved successfully!');
                
            } catch (error) {
                console.error('Error approving problem statement:', error);
                alert('Failed to approve problem statement. Please try again.');
            }
        });
    }
}

// Setup member management
function setupMemberManagement() {
    const addMemberBtn = document.getElementById('add-member-btn');
    
    if (addMemberBtn) {
        // Open add member modal
        addMemberBtn.addEventListener('click', () => {
            document.getElementById('add-member-modal').classList.add('show');
            document.getElementById('modal-backdrop').classList.add('show');
        });
        
        // Close modal
        document.getElementById('close-add-member-modal').addEventListener('click', () => {
            document.getElementById('add-member-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        });
        
        // Setup member search
        setupMemberSearch();
    }
}

// Setup member search functionality
function setupMemberSearch() {
    const searchInput = document.getElementById('member-search');
    const searchResults = document.getElementById('search-results');
    
    if (searchInput && searchResults) {
        let searchTimeout;
        
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            
            // Wait for user to stop typing
            searchTimeout = setTimeout(async () => {
                const query = searchInput.value.trim();
                
                if (query.length < 2) {
                    searchResults.innerHTML = '<p>Enter at least 2 characters to search</p>';
                    return;
                }
                
                searchResults.innerHTML = '<p>Searching...</p>';
                
                try {
                    // Fetch all users from the server
                    const response = await fetch(`${API_URL}/users`, {
                        method: 'GET',
                        headers: getAuthHeaders()
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch users');
                    }
                    
                    const users = await response.json();
                    
                    // Filter users based on search query and exclude those already in the project
                    const filteredUsers = users.filter(user => {
                        // Check if user is already in the project
                        const isAlreadyMember = currentProject.members.some(member => member.id === user.id);
                        
                        // Match by username, email or full name
                        const matchesQuery = 
                            user.username.toLowerCase().includes(query.toLowerCase()) ||
                            user.email.toLowerCase().includes(query.toLowerCase()) ||
                            (user.fullName && user.fullName.toLowerCase().includes(query.toLowerCase()));
                        
                        return matchesQuery && !isAlreadyMember;
                    });
                    
                    if (filteredUsers.length === 0) {
                        searchResults.innerHTML = '<p>No matching users found or all matches are already project members</p>';
                        return;
                    }
                    
                    // Display search results
                    const resultsHTML = filteredUsers.map(user => `
                        <div class="card mt-2">
                            <div class="member-item">
                                <div class="member-avatar">${user.username.charAt(0).toUpperCase()}</div>
                                <div class="member-info">
                                    <div class="member-name">${user.username}</div>
                                    <div class="member-role">${user.fullName || user.email}</div>
                                </div>
                                <button class="btn btn-primary btn-sm add-member-btn" data-id="${user.id}">Add</button>
                            </div>
                        </div>
                    `).join('');
                    
                    searchResults.innerHTML = resultsHTML;
                    
                    // Add event listeners to the add buttons
                    document.querySelectorAll('.add-member-btn').forEach(button => {
                        button.addEventListener('click', async () => {
                            const userId = button.dataset.id;
                            await addMember(userId);
                            
                            // Close modal
                            document.getElementById('add-member-modal').classList.remove('show');
                            document.getElementById('modal-backdrop').classList.remove('show');
                            
                            // Clear search input
                            searchInput.value = '';
                            searchResults.innerHTML = '';
                        });
                    });
                    
                } catch (error) {
                    console.error('Error searching for users:', error);
                    searchResults.innerHTML = '<p>Error searching for users. Please try again.</p>';
                }
            }, 500);
        });
    }
}

// Add member to project
async function addMember(userId) {
    if (!currentProject) return;
    
    try {
        const response = await fetch(`${API_URL}/projects/${currentProject.id}/members/${userId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to add member to project');
        }
        
        // Reload project details
        await loadProjectDetails(currentProject.id);
        
    } catch (error) {
        console.error('Error adding member to project:', error);
        alert('Failed to add member to project. Please try again.');
    }
}

// Remove member from project
async function removeMember(userId) {
    if (!currentProject) return;
    
    try {
        const response = await fetch(`${API_URL}/projects/${currentProject.id}/members/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to remove member from project');
        }
        
        // Reload project details
        await loadProjectDetails(currentProject.id);
        
    } catch (error) {
        console.error('Error removing member from project:', error);
        alert('Failed to remove member from project. Please try again.');
    }
}

// Setup task management
function setupTaskManagement() {
    const createTaskBtn = document.getElementById('create-task-btn');
    
    if (createTaskBtn) {
        // Open create task modal
        createTaskBtn.addEventListener('click', () => {
            // Populate assignee dropdown with project members
            populateAssigneeDropdown();
            
            // Show modal
            document.getElementById('create-task-modal').classList.add('show');
            document.getElementById('modal-backdrop').classList.add('show');
        });
        
        // Close modal
        document.getElementById('close-create-task-modal').addEventListener('click', () => {
            document.getElementById('create-task-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        });
        
        document.getElementById('cancel-create-task').addEventListener('click', () => {
            document.getElementById('create-task-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        });
        
        // Setup form submission
        setupCreateTaskForm();
    }
    
    // Setup task detail modal close
    document.getElementById('close-task-detail-modal').addEventListener('click', () => {
        document.getElementById('task-detail-modal').classList.remove('show');
        document.getElementById('modal-backdrop').classList.remove('show');
    });
}

// Populate assignee dropdown
function populateAssigneeDropdown() {
    const assigneeDropdown = document.getElementById('task-assignee');
    
    if (!currentProject || !currentProject.members) return;
    
    // Clear existing options
    assigneeDropdown.innerHTML = '<option value="">Select team member</option>';
    
    // Add members to dropdown
    currentProject.members.forEach(member => {
        assigneeDropdown.innerHTML += `<option value="${member.id}">${member.username}</option>`;
    });
}

// Setup create task form
function setupCreateTaskForm() {
    const createTaskForm = document.getElementById('create-task-form');
    
    if (createTaskForm) {
        createTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const taskData = {
                title: document.getElementById('task-title').value,
                description: document.getElementById('task-description').value,
                project: { id: currentProject.id },
                assignedTo: { id: document.getElementById('task-assignee').value },
                startDate: document.getElementById('task-start-date').value,
                dueDate: document.getElementById('task-due-date').value
            };
            
            try {
                const response = await fetch(`${API_URL}/tasks`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(taskData)
                });
                
                if (!response.ok) {
                    throw new Error('Failed to create task');
                }
                
                // Reload project tasks
                await loadProjectTasks(currentProject.id);
                
                // Close modal
                document.getElementById('create-task-modal').classList.remove('show');
                document.getElementById('modal-backdrop').classList.remove('show');
                
                // Reset form
                createTaskForm.reset();
                
            } catch (error) {
                console.error('Error creating task:', error);
                alert('Failed to create task. Please try again.');
            }
        });
    }
}

// Show task details
function showTaskDetails(task) {
    // Set task details
    document.getElementById('task-detail-title').textContent = task.title;
    document.getElementById('task-detail-description').textContent = task.description || 'No description provided.';
    document.getElementById('task-detail-status').textContent = formatTaskStatus(task.status);
    document.getElementById('task-detail-assignee').textContent = task.assignedTo ? task.assignedTo.username : 'Unassigned';
    document.getElementById('task-detail-start-date').textContent = formatDateTime(task.startDate);
    document.getElementById('task-detail-due-date').textContent = formatDateTime(task.dueDate);
    
    // Set progress bar
    document.getElementById('task-detail-progress').style.width = `${task.progressPercentage}%`;
    document.getElementById('task-detail-progress-text').textContent = `${task.progressPercentage}%`;
    
    // Determine what actions to show based on user role and task status
    const currentUser = getCurrentUser();
    const isLeader = currentProject.leader.id === currentUser.id;
    const isAssignee = task.assignedTo && task.assignedTo.id === currentUser.id;
    
    // Hide all action containers initially
    document.getElementById('task-update-container').classList.add('hidden');
    document.getElementById('task-leader-review-container').classList.add('hidden');
    document.getElementById('task-submit-container').classList.add('hidden');
    document.getElementById('task-reassign-container').classList.add('hidden');
    
    // Show update progress form if user is assignee and task is pending or in progress or rejected
    if (isAssignee && (task.status === 'PENDING' || task.status === 'IN_PROGRESS' || task.status === 'REJECTED')) {
        const updateContainer = document.getElementById('task-update-container');
        updateContainer.classList.remove('hidden');
        
        // Set initial progress value
        const progressSlider = document.getElementById('task-progress');
        const progressValue = document.getElementById('progress-value');
        progressSlider.value = task.progressPercentage;
        progressValue.textContent = `${task.progressPercentage}%`;
        
        // Update progress value as slider changes
        progressSlider.addEventListener('input', () => {
            progressValue.textContent = `${progressSlider.value}%`;
        });
        
        // Setup update form submission
        const updateTaskForm = document.getElementById('update-task-form');
        updateTaskForm.onsubmit = async (e) => {
            e.preventDefault();
            
            await updateTaskProgress(task.id, parseInt(progressSlider.value));
            
            // Close modal
            document.getElementById('task-detail-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        };
    }
    
    // Show submit button if user is assignee and task is in progress and progress is 100%
    if (isAssignee && task.status === 'IN_PROGRESS' && task.progressPercentage === 100) {
        const submitContainer = document.getElementById('task-submit-container');
        submitContainer.classList.remove('hidden');
        
        // Setup submit button
        const submitBtn = document.getElementById('submit-task-btn');
        submitBtn.onclick = async () => {
            await submitTaskForReview(task.id);
            
            // Close modal
            document.getElementById('task-detail-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        };
    }
    
    // Show review options if user is leader and task is under review
    if (isLeader && task.status === 'UNDER_REVIEW') {
        const reviewContainer = document.getElementById('task-leader-review-container');
        reviewContainer.classList.remove('hidden');
        
        // Setup approve button
        const approveBtn = document.getElementById('approve-task-btn');
        approveBtn.onclick = async () => {
            await reviewTask(task.id, true);
            
            // Close modal
            document.getElementById('task-detail-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        };
        
        // Setup reject button
        const rejectBtn = document.getElementById('reject-task-btn');
        rejectBtn.onclick = async () => {
            await reviewTask(task.id, false);
            
            // Close modal
            document.getElementById('task-detail-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        };
    }
    
    // Show reassign option if user is leader
    if (isLeader) {
        const reassignContainer = document.getElementById('task-reassign-container');
        reassignContainer.classList.remove('hidden');
        
        // Populate reassign dropdown with project members
        const reassignDropdown = document.getElementById('reassign-to');
        reassignDropdown.innerHTML = '<option value="">Select team member</option>';
        
        currentProject.members.forEach(member => {
            // Don't include current assignee
            if (!task.assignedTo || member.id !== task.assignedTo.id) {
                reassignDropdown.innerHTML += `<option value="${member.id}">${member.username}</option>`;
            }
        });
        
        // Setup reassign form submission
        const reassignForm = document.getElementById('reassign-task-form');
        reassignForm.onsubmit = async (e) => {
            e.preventDefault();
            
            const userId = reassignDropdown.value;
            if (!userId) {
                alert('Please select a team member to reassign the task to.');
                return;
            }
            
            await reassignTask(task.id, userId);
            
            // Close modal
            document.getElementById('task-detail-modal').classList.remove('show');
            document.getElementById('modal-backdrop').classList.remove('show');
        };
    }
    
    // Show modal
    document.getElementById('task-detail-modal').classList.add('show');
    document.getElementById('modal-backdrop').classList.add('show');
}

// Update task progress
async function updateTaskProgress(taskId, progressPercentage) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}/update-progress`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ progressPercentage })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update task progress');
        }
        
        // Reload project tasks
        await loadProjectTasks(currentProject.id);
        
    } catch (error) {
        console.error('Error updating task progress:', error);
        alert('Failed to update task progress. Please try again.');
    }
}

// Submit task for review
async function submitTaskForReview(taskId) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}/submit`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit task for review');
        }
        
        // Reload project tasks
        await loadProjectTasks(currentProject.id);
        
    } catch (error) {
        console.error('Error submitting task for review:', error);
        alert('Failed to submit task for review. Please try again.');
    }
}

// Review task (approve or reject)
async function reviewTask(taskId, approved) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}/review?approved=${approved}`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to review task');
        }
        
        // Reload project tasks
        await loadProjectTasks(currentProject.id);
        
    } catch (error) {
        console.error('Error reviewing task:', error);
        alert('Failed to review task. Please try again.');
    }
}

// Reassign task
async function reassignTask(taskId, userId) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}/reassign/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to reassign task');
        }
        
        // Reload project tasks
        await loadProjectTasks(currentProject.id);
        
    } catch (error) {
        console.error('Error reassigning task:', error);
        alert('Failed to reassign task. Please try again.');
    }
}

// Update project insights
function updateProjectInsights(project) {
    const tasks = project.tasks || [];
    
    // Total tasks
    document.getElementById('total-tasks').textContent = tasks.length;
    
    // Members count
    document.getElementById('members-count').textContent = project.members ? project.members.length : 0;
    
    // Completion ratio
    const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
    const completionRatio = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    document.getElementById('completed-ratio').textContent = `${completionRatio}%`;
    
    // Active tasks
    const activeTasks = tasks.filter(task => 
        task.status === 'PENDING' || 
        task.status === 'IN_PROGRESS' || 
        task.status === 'UNDER_REVIEW' ||
        task.status === 'REJECTED'
    ).length;
    document.getElementById('active-tasks-project').textContent = activeTasks;
}

// Format task status
function formatTaskStatus(status) {
    switch (status) {
        case 'PENDING':
            return 'Pending';
        case 'IN_PROGRESS':
            return 'In Progress';
        case 'UNDER_REVIEW':
            return 'Under Review';
        case 'COMPLETED':
            return 'Completed';
        case 'REJECTED':
            return 'Rejected';
        default:
            return status;
    }
}

// Format date/time
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return 'N/A';
    
    try {
        const date = new Date(dateTimeStr);
        return date.toLocaleString();
    } catch (error) {
        return dateTimeStr;
    }
}

