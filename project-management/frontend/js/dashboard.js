// Dashboard functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Skip if not on dashboard page
    if (!window.location.pathname.includes('dashboard.html')) return;
    
    // Check user role and configure UI accordingly
    checkUserRoleAndConfigureUI();
    
    // Load projects
    await loadProjects();
    
    // Set up create project form
    setupCreateProjectForm();
    
    // Add event listeners for the create project buttons
    setupCreateProjectButtons();
});

// Load all projects for the current user
async function loadProjects() {
    try {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch projects');
        }
        
        const projects = await response.json();
        displayProjects(projects);
        updateInsights(projects);
        
    } catch (error) {
        console.error('Error loading projects:', error);
        document.getElementById('projects-container').innerHTML = `
            <div class="card project-card" style="text-align: center; padding: 40px;">
                <p>Error loading projects. Please try again later.</p>
            </div>
        `;
    }
}

// Display projects in the grid
function displayProjects(projects) {
    const projectsContainer = document.getElementById('projects-container');
    
    if (!projects || projects.length === 0) {
        projectsContainer.innerHTML = `
            <div class="card project-card" style="text-align: center; padding: 40px;">
                <p>You don't have any projects yet.</p>
                <p>Create a new project to get started!</p>
            </div>
        `;
        return;
    }
    
    const currentUser = getCurrentUser();
    const projectsHtml = projects.map(project => {
        // Determine if current user is the leader
        const isLeader = project.leader.id === currentUser.id;
        
        // Format dates
        const createdDate = new Date(project.createdAt).toLocaleDateString();
        const updatedDate = new Date(project.updatedAt).toLocaleDateString();
        
        // Problem statement status badge
        const psStatusBadge = project.problemStatementApproved 
            ? '<span class="badge badge-success">Approved</span>' 
            : '<span class="badge badge-warning">Pending</span>';
        
        return `
            <div class="card project-card" data-id="${project.id}">
                <h3>${project.name}</h3>
                <p>${project.description || 'No description provided.'}</p>
                
                <div class="project-status mt-3">
                    <div><strong>Problem Statement:</strong> ${psStatusBadge}</div>
                    <div><strong>Members:</strong> ${project.members.length}</div>
                </div>
                
                <div class="project-meta">
                    <div>Created: ${createdDate}</div>
                    <div>${isLeader ? 'You are the leader' : 'Member'}</div>
                </div>
            </div>
        `;
    }).join('');
    
    projectsContainer.innerHTML = projectsHtml;
    
    // Add click event listeners
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => {
            const projectId = card.dataset.id;
            window.location.href = `project-details.html?id=${projectId}`;
        });
    });
}

// Update dashboard insights
function updateInsights(projects) {
    document.getElementById('total-projects').textContent = projects.length;
    
    // We need to fetch tasks data for the remaining insights
    fetchTaskInsights();
}

// Fetch task insights for the dashboard
async function fetchTaskInsights() {
    try {
        // Fetch user's tasks
        const response = await fetch(`${API_URL}/tasks/my-tasks`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch tasks');
        }
        
        const tasks = await response.json();
        
        // Count active tasks (PENDING, IN_PROGRESS, UNDER_REVIEW, REJECTED)
        const activeTasks = tasks.filter(task => 
            task.status === 'PENDING' || 
            task.status === 'IN_PROGRESS' || 
            task.status === 'UNDER_REVIEW' ||
            task.status === 'REJECTED'
        ).length;
        
        // Count completed tasks
        const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
        
        // Count tasks under review (for pending approvals)
        const pendingApprovals = tasks.filter(task => task.status === 'UNDER_REVIEW').length;
        
        // Update the insights
        document.getElementById('active-tasks').textContent = activeTasks;
        document.getElementById('completed-tasks').textContent = completedTasks;
        document.getElementById('pending-approvals').textContent = pendingApprovals;
        
    } catch (error) {
        console.error('Error fetching task insights:', error);
    }
}

// Set up create project form
function setupCreateProjectForm() {
    const createProjectForm = document.getElementById('create-project-form');
    
    if (createProjectForm) {
        createProjectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const projectData = {
                name: document.getElementById('project-name').value,
                description: document.getElementById('project-description').value,
                problemStatement: document.getElementById('project-problem-statement').value
            };
            
            try {
                const response = await fetch(`${API_URL}/projects`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(projectData)
                });
                
                if (!response.ok) {
                    throw new Error('Failed to create project');
                }
                
                // Reload projects
                await loadProjects();
                
                // Close modal
                document.getElementById('create-project-modal').classList.remove('show');
                document.getElementById('modal-backdrop').classList.remove('show');
                
                // Reset form
                createProjectForm.reset();
                
            } catch (error) {
                console.error('Error creating project:', error);
                alert('Failed to create project. Please try again.');
            }
        });
    }
}

// Add this new function to set up the create project buttons
function setupCreateProjectButtons() {
    const createProjectBtn = document.getElementById('create-project-btn');
    const newProjectBtn = document.getElementById('new-project-btn');
    const closeModalBtn = document.getElementById('close-create-project-modal');
    const cancelBtn = document.getElementById('cancel-create-project');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const createProjectModal = document.getElementById('create-project-modal');
    
    // Function to open the modal
    const openModal = () => {
        createProjectModal.classList.add('show');
        modalBackdrop.classList.add('show');
    };
    
    // Function to close the modal
    const closeModal = () => {
        createProjectModal.classList.remove('show');
        modalBackdrop.classList.remove('show');
        document.getElementById('create-project-form').reset();
    };
    
    // Add click event listeners to open modal
    if (createProjectBtn) {
        createProjectBtn.addEventListener('click', openModal);
    }
    
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', openModal);
    }
    
    // Add click event listeners to close modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeModal);
    }
}

// Check user role and configure UI accordingly
function checkUserRoleAndConfigureUI() {
    const currentUser = getCurrentUser();
    const isLeader = currentUser.roles && currentUser.roles.includes('ROLE_LEADER');
    
    // Show/hide create project buttons based on user role
    const createProjectBtn = document.getElementById('create-project-btn');
    const newProjectBtn = document.getElementById('new-project-btn');
    const leaderMenuItems = document.getElementById('leader-menu-items');
    
    if (createProjectBtn) {
        createProjectBtn.style.display = isLeader ? 'block' : 'none';
    }
    
    if (newProjectBtn) {
        newProjectBtn.style.display = isLeader ? 'block' : 'none';
    }
    
    if (leaderMenuItems) {
        leaderMenuItems.classList.toggle('hidden', !isLeader);
    }
}

