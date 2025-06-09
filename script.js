document.addEventListener('DOMContentLoaded', () => {
    // Éléments DOM
    const addTaskForm = document.getElementById('addTaskForm');
    const taskInput = document.getElementById('taskInput');
    const reminderInput = document.getElementById('reminderInput');
    const prioritySelect = document.getElementById('prioritySelect');
    const tasksContainer = document.getElementById('tasksContainer');
    const taskCount = document.getElementById('taskCount');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // État de l'application
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    
    // Initialisation
    renderTasks();
    updateTaskCount();
    
    // Gestion du formulaire
    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = taskInput.value.trim();
        if (!title) return;
        
        const newTask = {
            id: Date.now().toString(),
            title,
            completed: false,
            priority: prioritySelect.value,
            reminder: reminderInput.value ? new Date(reminderInput.value).getTime() : null
        };
        
        tasks.unshift(newTask);
        saveTasks();
        renderTasks();
        updateTaskCount();
        
        taskInput.value = '';
        reminderInput.value = '';
        prioritySelect.value = 'medium';
    });
    
    // Filtrage des tâches
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            renderTasks();
        });
    });
    
    // Fonctions de gestion des tâches
    function toggleTaskCompletion(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
            updateTaskCount();
        }
    }
    
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateTaskCount();
    }
    
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function updateTaskCount() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        taskCount.textContent = `${activeTasks} tâche${activeTasks !== 1 ? 's' : ''} active${activeTasks !== 1 ? 's' : ''}`;
    }
    
    // Fonction de rendu des tâches
    function renderTasks() {
        tasksContainer.innerHTML = '';
        
        let filteredTasks = tasks;
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }
        
        if (filteredTasks.length === 0) {
            tasksContainer.innerHTML = '<div class="empty-state">Aucune tâche à afficher</div>';
            return;
        }
        
        filteredTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-item';
            taskElement.dataset.id = task.id;
            taskElement.draggable = true;
            
            // Calcul du statut du rappel
            let reminderStatus = '';
            let reminderText = '';
            if (task.reminder) {
                const now = new Date();
                const reminderDate = new Date(task.reminder);
                const diffTime = reminderDate - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays < 0) {
                    reminderStatus = 'overdue';
                    reminderText = 'Échu';
                } else if (diffDays === 0) {
                    reminderStatus = 'today';
                    reminderText = 'Aujourd\'hui';
                } else if (diffDays === 1) {
                    reminderStatus = 'today';
                    reminderText = 'Demain';
                } else {
                    reminderStatus = 'future';
                    reminderText = reminderDate.toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                    });
                }
            }
            
            taskElement.innerHTML = `
                <div>
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                </div>
                <div class="task-content">
                    <div class="task-title ${task.completed ? 'completed' : ''}">
                        <span class="task-priority priority-${task.priority}"></span>
                        ${task.title}
                    </div>
                    ${task.reminder ? `
                    <div class="task-reminder reminder-${reminderStatus}">
                        <span class="reminder-icon">⏰</span>
                        ${reminderText}
                    </div>
                    ` : ''}
                </div>
                <div class="task-actions">
                    <button class="action-btn delete-btn">🗑️</button>
                </div>
            `;
            
            // Événements
            const checkbox = taskElement.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
            
            const deleteBtn = taskElement.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
            
            // Drag & Drop
            taskElement.addEventListener('dragstart', handleDragStart);
            taskElement.addEventListener('dragover', handleDragOver);
            taskElement.addEventListener('drop', handleDrop);
            taskElement.addEventListener('dragend', handleDragEnd);
            
            tasksContainer.appendChild(taskElement);
        });
    }
    
    // Drag & Drop
    let draggedItem = null;
    
    function handleDragStart(e) {
        draggedItem = this;
        setTimeout(() => this.classList.add('dragging'), 0);
    }
    
    function handleDragOver(e) {
        e.preventDefault();
    }
    
    function handleDrop(e) {
        e.preventDefault();
        if (draggedItem !== this) {
            const draggedId = draggedItem.dataset.id;
            const targetId = this.dataset.id;
            
            const draggedIndex = tasks.findIndex(t => t.id === draggedId);
            const targetIndex = tasks.findIndex(t => t.id === targetId);
            
            // Réorganiser le tableau
            const [movedTask] = tasks.splice(draggedIndex, 1);
            tasks.splice(targetIndex, 0, movedTask);
            
            saveTasks();
            renderTasks();
        }
    }
    
    function handleDragEnd() {
        this.classList.remove('dragging');
    }
});