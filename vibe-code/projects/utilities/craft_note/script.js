class StickyNotesApp {
    constructor() {
        this.notes = [];
        this.boards = {};
        this.currentBoard = 'default';
        this.draggedNote = null;
        this.dragOffset = { x: 0, y: 0 };
        this.colorPickerTarget = null;
        this.noteIdCounter = 0;
        this.defaultColor = '#fff740';
        this.currentTheme = 'default';
        this.gridSize = 20; // Snap grid size
        this.snapMode = false;
        this.gridVisible = true;
        this.selectedNotes = new Set();
        this.isSelecting = false;
        this.selectionStart = { x: 0, y: 0 };
        this.undoStack = [];
        this.maxUndoSteps = 50;
        this.isDraggingMultiple = false;
        this.multiDragOffsets = new Map();
        
        this.initializeApp();
        this.bindEvents();
        this.loadData();
    }

    initializeApp() {
        this.workspace = document.getElementById('workspace');
        this.boardSelect = document.getElementById('boardSelect');
        this.colorPickerModal = document.getElementById('colorPickerModal');
        this.dropZone = document.getElementById('dropZone');
        this.imageModal = document.getElementById('imageModal');
        this.themeSelect = document.getElementById('themeSelect');
        this.gridOverlay = document.getElementById('gridOverlay');
        this.selectionBox = document.getElementById('selectionBox');
        this.snapBtn = document.getElementById('snapBtn');
        this.gridToggleBtn = document.getElementById('gridToggleBtn');
        this.colorPickerBtn = document.getElementById('colorPickerBtn');
        this.colorDropdown = document.getElementById('colorDropdown');
        this.colorPreview = document.getElementById('colorPreview');
        this.undoBtn = document.getElementById('undoBtn');
        this.noteModal = document.getElementById('noteModal');
        this.currentEditingNote = null;
    }

    bindEvents() {
        // Button events
        document.getElementById('newNoteBtn').addEventListener('click', () => this.createNote());
        document.getElementById('dropZoneNewNoteBtn').addEventListener('click', () => this.createNote());
        document.getElementById('newBoardBtn').addEventListener('click', () => this.createBoard());
        document.getElementById('deleteBoardBtn').addEventListener('click', () => this.deleteBoard());
        document.getElementById('autoAlignBtn').addEventListener('click', () => this.autoAlign());
        document.getElementById('snapBtn').addEventListener('click', () => this.toggleSnapMode());
        document.getElementById('gridToggleBtn').addEventListener('click', () => this.toggleGrid());
        document.getElementById('autoGroupBtn').addEventListener('click', () => this.groupByColor());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadNotes());
        this.undoBtn.addEventListener('click', () => this.undo());
        
        // Board selection and theme
        this.boardSelect.addEventListener('change', (e) => this.switchBoard(e.target.value));
        this.themeSelect.addEventListener('change', (e) => this.changeTheme(e.target.value));
        
        // Enhanced color picker events
        this.colorPickerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleColorDropdown();
        });
        
        document.addEventListener('click', (e) => {
            if (!this.colorPickerBtn.contains(e.target) && !this.colorDropdown.contains(e.target)) {
                this.hideColorDropdown();
            }
        });
        
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                this.setDefaultColor(e.target.dataset.color);
                this.hideColorDropdown();
            });
        });
        
        // Color picker events
        this.colorPickerModal.addEventListener('click', (e) => {
            if (e.target === this.colorPickerModal) {
                this.hideColorPicker();
            }
        });
          // Image modal events
        this.imageModal.addEventListener('click', (e) => {
            if (e.target === this.imageModal) {
                this.hideImageModal();
            }
        });

        // Note modal events
        this.noteModal.addEventListener('click', (e) => {
            if (e.target === this.noteModal) {
                this.hideNoteModal();
            }
        });

        document.getElementById('closeNoteModal').addEventListener('click', () => {
            this.hideNoteModal();
        });

        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectColor(e.target.dataset.color));
        });
        
        // Workspace selection events
        this.workspace.addEventListener('mousedown', (e) => this.handleWorkspaceMouseDown(e));
        this.workspace.addEventListener('mousemove', (e) => this.handleWorkspaceMouseMove(e));
        this.workspace.addEventListener('mouseup', (e) => this.handleWorkspaceMouseUp(e));
        
        // Drag and drop for images
        this.workspace.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('active');
        });
        
        this.workspace.addEventListener('dragleave', (e) => {
            if (!this.workspace.contains(e.relatedTarget)) {
                this.dropZone.classList.remove('active');
            }
        });
        
        this.workspace.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('active');
            this.handleImageDrop(e);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.createNote();
            } else if (e.key === 'Delete' && this.selectedNotes.size > 0) {
                this.deleteSelectedNotes();
            } else if (e.key === 'Escape') {
                this.clearSelection();
            } else if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                this.undo();
            }
        });
    }

    createNote(x = null, y = null, content = '', imageUrl = null, color = null) {
        // Save state for undo
        this.saveStateForUndo();
        
        const noteId = `note_${this.noteIdCounter++}`;
        
        // Use default color if none specified
        const noteColor = color || this.defaultColor;
        
        // Calculate position with boundary checking and pagination
        let noteX, noteY;
        if (x !== null && y !== null) {
            noteX = x;
            noteY = y;
        } else {
            const result = this.findValidPosition();
            noteX = result.x;
            noteY = result.y;
        }
        
        const note = {
            id: noteId,
            x: noteX,
            y: noteY,
            content: content,
            imageUrl: imageUrl,
            color: noteColor,
            done: false,
            timestamp: Date.now()
        };
        
        this.notes.push(note);
        this.renderNote(note);
        this.saveData();
        this.updateBoardCount();
        this.updateUndoButton();
        
        return note;
    }

    findValidPosition() {
        const noteWidth = 250;
        const noteHeight = 150;
        const margin = 20;
        const workspaceWidth = this.workspace.clientWidth;
        const workspaceHeight = this.workspace.clientHeight;
        
        // Try to find an empty spot
        for (let row = 0; row < Math.floor(workspaceHeight / (noteHeight + margin)); row++) {
            for (let col = 0; col < Math.floor(workspaceWidth / (noteWidth + margin)); col++) {
                const x = margin + (col * (noteWidth + margin));
                const y = margin + (row * (noteHeight + margin));
                
                // Check if this position is occupied
                const isOccupied = this.notes.some(note => {
                    return Math.abs(note.x - x) < noteWidth && Math.abs(note.y - y) < noteHeight;
                });
                
                if (!isOccupied) {
                    return { x, y };
                }
            }
        }
        
        // If no empty spot, place randomly
        return {
            x: Math.random() * (workspaceWidth - noteWidth),
            y: Math.random() * (workspaceHeight - noteHeight)
        };
    }

    renderNote(note, skipAnimation = false) {
        const noteElement = document.createElement('div');
        noteElement.className = skipAnimation ? 'sticky-note' : 'sticky-note new';
        noteElement.id = note.id;
        noteElement.style.left = `${note.x}px`;
        noteElement.style.top = `${note.y}px`;
        noteElement.style.backgroundColor = note.color;
        
        if (note.done) {
            noteElement.classList.add('done');
        }
        
        noteElement.innerHTML = `
            <div class="note-header">
                <div class="note-controls-left">
                    <button class="note-btn btn-done" data-action="toggle-done">
                        <i class="fas ${note.done ? 'fa-check' : 'fa-circle'}"></i>
                    </button>
                    <button class="note-btn btn-delete" data-action="delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="note-controls-right">
                    <button class="note-btn-fullscreen" data-action="fullscreen" title="Open in fullscreen">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="note-btn btn-color" data-action="change-color">
                        <i class="fas fa-palette"></i>
                    </button>
                </div>
            </div>
            <div class="note-content">
                ${note.imageUrl ? `<img src="${note.imageUrl}" class="note-image" alt="Note image" data-note-id="${note.id}">` : ''}
                <textarea class="note-textarea" placeholder="Type your note here...">${note.content}</textarea>
            </div>
        `;
        
        this.workspace.appendChild(noteElement);
        
        // Remove animation class after animation completes (only if not skipped)
        if (!skipAnimation) {
            setTimeout(() => noteElement.classList.remove('new'), 300);
        }
        
        this.bindNoteEvents(noteElement, note);
        this.hideDropZone();
    }

    bindNoteEvents(noteElement, note) {
        const textarea = noteElement.querySelector('.note-textarea');
        const image = noteElement.querySelector('.note-image');
        
        // Image click event for modal
        if (image) {
            image.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showImageModal(note.imageUrl, note.content);
            });
        }
        
        // Auto-resize textarea
        const autoResize = () => {
            textarea.style.height = 'auto';
            const newHeight = Math.max(100, Math.min(120, textarea.scrollHeight));
            textarea.style.height = newHeight + 'px';
            
            // Note element maintains fixed height
            noteElement.style.height = '180px';
        };
        
        // Content change with enhanced undo state saving
        let lastContent = note.content;
        let hasContentChanged = false;
        
        textarea.addEventListener('input', (e) => {
            note.content = e.target.value;
            hasContentChanged = true;
            autoResize();
            this.saveData();
        });

        // Save state for undo when user types (more sensitive)
        let typingTimer;
        textarea.addEventListener('input', () => {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                // Save if content changed
                if (hasContentChanged && note.content !== lastContent) {
                    this.saveStateForUndo();
                    this.updateUndoButton();
                    lastContent = note.content;
                    hasContentChanged = false;
                }
            }, 300); // Reduced to 300ms for more sensitivity
        });

        // Save state when user finishes typing
        textarea.addEventListener('blur', () => {
            clearTimeout(typingTimer);
            if (hasContentChanged && note.content !== lastContent) {
                this.saveStateForUndo();
                this.updateUndoButton();
                lastContent = note.content;
                hasContentChanged = false;
            }
        });

        // Save state when user presses Enter
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                setTimeout(() => {
                    if (hasContentChanged && note.content !== lastContent) {
                        this.saveStateForUndo();
                        this.updateUndoButton();
                        lastContent = note.content;
                        hasContentChanged = false;
                    }
                }, 100);
            }
        });
        
        // Initial resize
        setTimeout(autoResize, 0);
        
        // Note controls
        noteElement.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (!action) return;
            
            e.stopPropagation();
            
            switch (action) {
                case 'toggle-done':
                    this.saveStateForUndo();
                    this.toggleDone(note.id);
                    this.updateUndoButton();
                    break;
                case 'change-color':
                    this.showColorPicker(note.id);
                    break;
                case 'delete':
                    this.saveStateForUndo();
                    this.deleteNote(note.id);
                    this.updateUndoButton();
                    break;
                case 'fullscreen':
                    this.showNoteModal(note);
                    break;
            }
        });
        
        // Dragging with undo state saving
        noteElement.addEventListener('mousedown', (e) => {
            if (e.target.closest('.note-controls-left') || 
                e.target.closest('.note-controls-right') || 
                e.target.classList.contains('note-textarea') ||
                e.target.classList.contains('note-image')) {
                return;
            }
            
            // Save state before dragging
            this.saveStateForUndo();
            this.startDragging(noteElement, note, e);
        });
    }

    startDragging(noteElement, note, e) {
        // Prevent dragging if clicking on control buttons or textarea
        if (e.target.closest('.note-controls-left') || 
            e.target.closest('.note-controls-right') || 
            e.target.classList.contains('note-textarea') ||
            e.target.classList.contains('note-image')) {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        // Check if this note is part of a selection
        const isPartOfSelection = this.selectedNotes.has(note.id);
        
        if (isPartOfSelection && this.selectedNotes.size > 1) {
            // Multi-note dragging
            this.startMultiDrag(e);
        } else {
            // Single note dragging
            this.clearSelection();
            this.startSingleDrag(noteElement, note, e);
        }
    }

    startSingleDrag(noteElement, note, e) {
        this.draggedNote = { element: noteElement, note: note };
        this.dragOffset.x = e.clientX - note.x;
        this.dragOffset.y = e.clientY - note.y;
        
        noteElement.classList.add('dragging');
        noteElement.style.zIndex = '1000';
        
        // Show grid if snap mode is on
        this.showGrid();
        
        // Disable pointer events on other notes during drag
        this.workspace.querySelectorAll('.sticky-note').forEach(el => {
            if (el !== noteElement) {
                el.style.pointerEvents = 'none';
            }
        });
        
        const handleMouseMove = (e) => {
            if (!this.draggedNote) return;
            
            e.preventDefault();
            
            let newX = e.clientX - this.dragOffset.x;
            let newY = e.clientY - this.dragOffset.y;
            
            // Snap to grid if snap mode is enabled
            if (this.snapMode) {
                newX = Math.round(newX / this.gridSize) * this.gridSize;
                newY = Math.round(newY / this.gridSize) * this.gridSize;
            }
            
            // Boundary checking
            const maxX = this.workspace.clientWidth - noteElement.clientWidth;
            const maxY = this.workspace.clientHeight - noteElement.clientHeight;
            
            note.x = Math.max(0, Math.min(newX, maxX));
            note.y = Math.max(0, Math.min(newY, maxY));
            
            noteElement.style.left = `${note.x}px`;
            noteElement.style.top = `${note.y}px`;
        };
        
        const handleMouseUp = () => {
            if (this.draggedNote) {
                this.draggedNote.element.classList.remove('dragging');
                this.draggedNote.element.style.zIndex = '';
                this.draggedNote = null;
                this.saveData();
            }
            
            // Hide grid
            this.hideGrid();
            
            // Re-enable pointer events on all notes
            this.workspace.querySelectorAll('.sticky-note').forEach(el => {
                el.style.pointerEvents = '';
            });
            
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    startMultiDrag(e) {
        this.isDraggingMultiple = true;
        this.multiDragOffsets.clear();
        
        // Calculate offset for each selected note
        this.selectedNotes.forEach(noteId => {
            const note = this.notes.find(n => n.id === noteId);
            const noteElement = document.getElementById(noteId);
            if (note && noteElement) {
                this.multiDragOffsets.set(noteId, {
                    x: e.clientX - note.x,
                    y: e.clientY - note.y
                });
                noteElement.classList.add('dragging');
                noteElement.style.zIndex = '1000';
            }
        });
        
        // Show grid if snap mode is on
        this.showGrid();
        
        const handleMouseMove = (e) => {
            if (!this.isDraggingMultiple) return;
            
            e.preventDefault();
            
            this.selectedNotes.forEach(noteId => {
                const note = this.notes.find(n => n.id === noteId);
                const noteElement = document.getElementById(noteId);
                const offset = this.multiDragOffsets.get(noteId);
                
                if (note && noteElement && offset) {
                    let newX = e.clientX - offset.x;
                    let newY = e.clientY - offset.y;
                    
                    // Snap to grid if snap mode is enabled
                    if (this.snapMode) {
                        newX = Math.round(newX / this.gridSize) * this.gridSize;
                        newY = Math.round(newY / this.gridSize) * this.gridSize;
                    }
                    
                    // Boundary checking
                    const maxX = this.workspace.clientWidth - noteElement.clientWidth;
                    const maxY = this.workspace.clientHeight - noteElement.clientHeight;
                    
                    note.x = Math.max(0, Math.min(newX, maxX));
                    note.y = Math.max(0, Math.min(newY, maxY));
                    
                    noteElement.style.left = `${note.x}px`;
                    noteElement.style.top = `${note.y}px`;
                }
            });
        };
        
        const handleMouseUp = () => {
            if (this.isDraggingMultiple) {
                this.selectedNotes.forEach(noteId => {
                    const noteElement = document.getElementById(noteId);
                    if (noteElement) {
                        noteElement.classList.remove('dragging');
                        noteElement.style.zIndex = '';
                    }
                });
                
                this.isDraggingMultiple = false;
                this.multiDragOffsets.clear();
                this.saveData();
            }
            
            // Hide grid
            this.hideGrid();
            
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    toggleDone(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        const noteElement = document.getElementById(noteId);
        
        if (note && noteElement) {
            note.done = !note.done;
            noteElement.classList.toggle('done', note.done);
            
            const icon = noteElement.querySelector('.btn-done i');
            icon.className = `fas ${note.done ? 'fa-check' : 'fa-circle'}`;
            
            this.saveData();
        }
    }

    showColorPicker(noteId) {
        this.colorPickerTarget = noteId;
        this.colorPickerModal.classList.add('active');
    }

    hideColorPicker() {
        this.colorPickerModal.classList.remove('active');
        this.colorPickerTarget = null;
    }

    selectColor(color) {
        if (this.colorPickerTarget) {
            const note = this.notes.find(n => n.id === this.colorPickerTarget);
            const noteElement = document.getElementById(this.colorPickerTarget);
            
            if (note && noteElement) {
                note.color = color;
                noteElement.style.backgroundColor = color;
                this.saveData();
            }
        }
        
        this.hideColorPicker();
    }

    deleteNote(noteId) {
        const noteElement = document.getElementById(noteId);
        if (noteElement) {
            noteElement.remove();
        }
        
        this.notes = this.notes.filter(n => n.id !== noteId);
        this.saveData();
        this.updateBoardCount();
        this.checkDropZoneVisibility();
    }

    showImageModal(imageUrl, noteText) {
        const modalImage = document.getElementById('modalImage');
        const modalNoteText = document.getElementById('modalNoteText');
        
        modalImage.src = imageUrl;
        modalNoteText.textContent = noteText || 'No text content';
        
        this.imageModal.classList.add('active');
    }

    showNoteModal(note) {
        this.currentEditingNote = note;
        
        const modalImage = document.getElementById('modalNoteImage');
        const modalTextarea = document.getElementById('modalNoteTextarea');
        
        // Show/hide image
        if (note.imageUrl) {
            modalImage.src = note.imageUrl;
            modalImage.style.display = 'block';
        } else {
            modalImage.style.display = 'none';
        }
        
        // Set content
        modalTextarea.value = note.content;
        
        // Show modal
        this.noteModal.classList.add('active');
        
        // Focus textarea after a short delay
        setTimeout(() => modalTextarea.focus(), 100);
        
        // Bind textarea events
        modalTextarea.addEventListener('input', this.handleModalTextareaInput.bind(this));
    }

    handleModalTextareaInput(e) {
        if (this.currentEditingNote) {
            this.currentEditingNote.content = e.target.value;
            
            // Update the actual note element
            const noteElement = document.getElementById(this.currentEditingNote.id);
            if (noteElement) {
                const noteTextarea = noteElement.querySelector('.note-textarea');
                noteTextarea.value = this.currentEditingNote.content;
                
                // Trigger auto-resize
                const event = new Event('input', { bubbles: true });
                noteTextarea.dispatchEvent(event);
            }
            
            this.saveData();
        }
    }

    hideNoteModal() {
        this.noteModal.classList.remove('active');
        this.currentEditingNote = null;
        
        // Remove event listener
        const modalTextarea = document.getElementById('modalNoteTextarea');
        modalTextarea.removeEventListener('input', this.handleModalTextareaInput.bind(this));
    }

    snapToGrid() {
        this.notes.forEach(note => {
            note.x = Math.round(note.x / this.gridSize) * this.gridSize;
            note.y = Math.round(note.y / this.gridSize) * this.gridSize;
            
            const noteElement = document.getElementById(note.id);
            if (noteElement) {
                noteElement.style.left = `${note.x}px`;
                noteElement.style.top = `${note.y}px`;
            }
        });
        
        this.saveData();
    }

    setDefaultColor(color) {
        this.defaultColor = color;
        this.saveData();
    }

    changeTheme(theme) {
        // Remove all theme classes
        document.body.classList.remove('default', 'gray-office', 'dark-mode', 'deep-blue', 'silent-forest');
        
        // Add new theme class
        if (theme !== 'default') {
            document.body.classList.add(theme);
        }
        
        this.currentTheme = theme;
        
        // Save theme to current board
        if (this.currentBoard !== 'default' && this.boards[this.currentBoard]) {
            this.boards[this.currentBoard].theme = theme;
        }
        
        this.saveData();
    }

    loadBoardTheme() {
        let theme = 'default';
        if (this.currentBoard !== 'default' && this.boards[this.currentBoard]) {
            theme = this.boards[this.currentBoard].theme || 'default';
        }
        
        this.themeSelect.value = theme;
        this.changeTheme(theme);
    }

    createBoard() {
        const boardName = prompt('Enter board name:');
        if (boardName && boardName.trim()) {
            const sanitizedName = boardName.trim().toLowerCase().replace(/\s+/g, '_');
            
            if (this.boards[sanitizedName]) {
                alert('Board already exists!');
                return;
            }
            
            this.boards[sanitizedName] = {
                name: boardName.trim(),
                notes: [],
                theme: 'default'
            };
            
            this.updateBoardSelect();
            this.switchBoard(sanitizedName);
            this.saveData();
        }
    }

    switchBoard(boardId) {
        // Save current board's notes and theme
        this.saveCurrentBoardNotes();
        this.saveCurrentBoardTheme();
        
        this.currentBoard = boardId;
        this.boardSelect.value = boardId;
        
        // Clear workspace and selection
        this.workspace.querySelectorAll('.sticky-note').forEach(note => note.remove());
        this.clearSelection();
        
        // Clear undo stack when switching boards
        this.undoStack = [];
        this.updateUndoButton();
        
        // Load new board's notes and theme
        this.loadCurrentBoardNotes();
        this.loadBoardTheme();
        this.checkDropZoneVisibility();
        this.updateBoardCount();
    }

    saveCurrentBoardTheme() {
        if (this.currentBoard !== 'default' && this.boards[this.currentBoard]) {
            this.boards[this.currentBoard].theme = this.currentTheme;
        }
    }

    loadBoardTheme() {
        let theme = 'default';
        if (this.currentBoard !== 'default' && this.boards[this.currentBoard]) {
            theme = this.boards[this.currentBoard].theme || 'default';
        }
        
        this.themeSelect.value = theme;
        this.changeTheme(theme);
    }

    updateBoardCount() {
        const currentOption = this.boardSelect.querySelector(`option[value="${this.currentBoard}"]`);
        if (currentOption) {
            const baseName = this.currentBoard === 'default' ? 'Default Board' : 
                           this.boards[this.currentBoard]?.name || this.currentBoard;
            currentOption.textContent = `${baseName} (${this.notes.length})`;
        }
    }

    deleteBoard() {
        if (this.currentBoard === 'default') {
            alert('Cannot delete default board!');
            return;
        }
        
        if (confirm('Are you sure you want to delete this board and all its notes?')) {
            delete this.boards[this.currentBoard];
            this.updateBoardSelect();
            this.switchBoard('default');
            this.saveData();
        }
    }

    saveCurrentBoardNotes() {
        // Always save current notes to the current board
        if (this.currentBoard === 'default') {
            // Notes are already in this.notes, will be saved in saveData()
        } else if (this.boards[this.currentBoard]) {
            this.boards[this.currentBoard].notes = [...this.notes];
        }
    }

    loadCurrentBoardNotes() {
        if (this.currentBoard === 'default') {
            // Load from saved default notes or empty array
            const saved = localStorage.getItem('stickyNotesApp');
            if (saved) {
                const data = JSON.parse(saved);
                this.notes = data.defaultNotes || [];
            } else {
                this.notes = [];
            }
        } else if (this.boards[this.currentBoard]) {
            this.notes = [...this.boards[this.currentBoard].notes];
        } else {
            this.notes = [];
        }
        
        // Render all notes for current board without animation
        this.notes.forEach(note => this.renderNote(note, true));
    }

    updateBoardSelect() {
        // Clear current options except default
        while (this.boardSelect.children.length > 1) {
            this.boardSelect.removeChild(this.boardSelect.lastChild);
        }
        
        // Update default board count
        const defaultOption = this.boardSelect.querySelector('option[value="default"]');
        const defaultCount = this.currentBoard === 'default' ? this.notes.length : 
                           JSON.parse(localStorage.getItem('stickyNotesApp'))?.defaultNotes?.length || 0;
        defaultOption.textContent = `Default Board (${defaultCount})`;
        
        // Add board options
        Object.entries(this.boards).forEach(([id, board]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${board.name} (${board.notes?.length || 0})`;
            this.boardSelect.appendChild(option);
        });
    }

    autoAlign() {
        const gridSize = 270; // Note width + margin (250 + 20)
        const startX = this.gridSize;
        const startY = this.gridSize;
        
        this.notes.forEach((note, index) => {
            const col = index % Math.floor(this.workspace.clientWidth / gridSize);
            const row = Math.floor(index / Math.floor(this.workspace.clientWidth / gridSize));
            
            note.x = startX + (col * gridSize);
            note.y = startY + (row * 170); // Note height + margin
            
            const noteElement = document.getElementById(note.id);
            if (noteElement) {
                noteElement.style.left = `${note.x}px`;
                noteElement.style.top = `${note.y}px`;
            }
        });
        
        this.saveData();
    }

    toggleSnapMode() {
        this.snapMode = !this.snapMode;
        this.snapBtn.dataset.snap = this.snapMode;
        this.snapBtn.innerHTML = `<i class="fas fa-grip"></i> Snap: ${this.snapMode ? 'ON' : 'OFF'}`;
        
        if (this.snapMode) {
            this.snapBtn.classList.add('btn-primary');
            this.snapBtn.classList.remove('btn-secondary');
        } else {
            this.snapBtn.classList.add('btn-secondary');
            this.snapBtn.classList.remove('btn-primary');
        }
    }

    showGrid() {
        if (this.snapMode) {
            this.gridOverlay.classList.add('snap-active');
        } else if (this.gridVisible) {
            this.gridOverlay.classList.add('active');
        }
    }

    hideGrid() {
        this.gridOverlay.classList.remove('snap-active');
        if (!this.gridVisible) {
            this.gridOverlay.classList.add('hidden');
        }
    }

    toggleGrid() {
        this.gridVisible = !this.gridVisible;
        
        if (this.gridVisible) {
            this.gridOverlay.classList.remove('hidden');
            this.gridOverlay.classList.add('active');
            this.gridToggleBtn.innerHTML = '<i class="fas fa-border-all"></i> Hide Grid';
        } else {
            this.gridOverlay.classList.add('hidden');
            this.gridOverlay.classList.remove('active');
            this.gridToggleBtn.innerHTML = '<i class="fas fa-border-all"></i> Show Grid';
        }
    }

    snapToGrid() {
        this.notes.forEach(note => {
            note.x = Math.round(note.x / this.gridSize) * this.gridSize;
            note.y = Math.round(note.y / this.gridSize) * this.gridSize;
            
            const noteElement = document.getElementById(note.id);
            if (noteElement) {
                noteElement.style.left = `${note.x}px`;
                noteElement.style.top = `${note.y}px`;
            }
        });
        
        this.saveData();
    }

    groupByColor() {
        // Group notes by color
        const colorGroups = {};
        this.notes.forEach(note => {
            if (!colorGroups[note.color]) {
                colorGroups[note.color] = [];
            }
            colorGroups[note.color].push(note);
        });
        
        // Position notes by color groups
        let currentX = 20;
        const startY = 20;
        const noteSpacing = 270; // Note width + margin (250 + 20)
        const groupSpacing = 50;
        
        Object.values(colorGroups).forEach(group => {
            group.forEach((note, index) => {
                note.x = currentX;
                note.y = startY + (index * 170);
                
                const noteElement = document.getElementById(note.id);
                if (noteElement) {
                    noteElement.style.left = `${note.x}px`;
                    noteElement.style.top = `${note.y}px`;
                }
            });
            
            currentX += noteSpacing + groupSpacing;
        });
        
        this.saveData();
    }

    clearAll() {
        if (confirm('Are you sure you want to delete all notes on this board?')) {
            this.workspace.querySelectorAll('.sticky-note').forEach(note => note.remove());
            this.notes = [];
            this.saveData();
            this.checkDropZoneVisibility();
        }
    }

    handleImageDrop(e) {
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        imageFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const x = Math.random() * (this.workspace.clientWidth - 200);
                const y = Math.random() * (this.workspace.clientHeight - 150) + (index * 20);
                this.createNote(x, y, '', e.target.result);
            };
            reader.readAsDataURL(file);
        });
    }

    checkDropZoneVisibility() {
        if (this.notes.length === 0) {
            this.dropZone.style.display = 'block';
        } else {
            this.hideDropZone();
        }
    }

    hideDropZone() {
        this.dropZone.style.display = 'none';
    }

    saveData() {
        // Save current board theme before saving
        this.saveCurrentBoardTheme();
        
        const data = {
            boards: this.boards,
            currentBoard: this.currentBoard,
            defaultNotes: this.currentBoard === 'default' ? this.notes : JSON.parse(localStorage.getItem('stickyNotesApp'))?.defaultNotes || [],
            defaultTheme: this.currentBoard === 'default' ? this.currentTheme : JSON.parse(localStorage.getItem('stickyNotesApp'))?.defaultTheme || 'default',
            noteIdCounter: this.noteIdCounter,
            defaultColor: this.defaultColor,
            currentTheme: this.currentTheme
        };
        
        // If we're not on default board, save current board notes and theme
        if (this.currentBoard !== 'default' && this.boards[this.currentBoard]) {
            this.boards[this.currentBoard].notes = [...this.notes];
            this.boards[this.currentBoard].theme = this.currentTheme;
            data.boards = this.boards;
        } else if (this.currentBoard === 'default') {
            data.defaultNotes = this.notes;
            data.defaultTheme = this.currentTheme;
        }
        
        localStorage.setItem('stickyNotesApp', JSON.stringify(data));
    }

    loadData() {
        const saved = localStorage.getItem('stickyNotesApp');
        if (saved) {
            const data = JSON.parse(saved);
            
            this.boards = data.boards || {};
            this.noteIdCounter = data.noteIdCounter || 0;
            this.defaultColor = data.defaultColor || '#fff740';
            this.currentTheme = data.currentTheme || 'default';
            
            // Set default color preview
            this.colorPreview.style.background = this.defaultColor;
            
            this.updateBoardSelect();
            
            // Switch to saved current board or default
            const targetBoard = data.currentBoard || 'default';
            this.switchBoard(targetBoard);
        } else {
            // Initialize with default board
            this.notes = [];
            this.colorPreview.style.background = this.defaultColor;
            this.checkDropZoneVisibility();
            this.updateBoardCount();
        }
        
        this.updateUndoButton();
    }

    downloadNotes() {
        if (this.notes.length === 0) {
            alert('No notes to download on this board!');
            return;
        }

        // Sort notes by position (top to bottom, left to right)
        const sortedNotes = [...this.notes].sort((a, b) => {
            if (Math.abs(a.y - b.y) < 50) { // Same row
                return a.x - b.x; // Sort by x position
            }
            return a.y - b.y; // Sort by y position
        });

        // Generate content
        let content = `Craft Notes - ${this.currentBoard === 'default' ? 'Default Board' : this.boards[this.currentBoard]?.name || this.currentBoard}\n`;
        content += `Generated on: ${new Date().toLocaleString()}\n`;
        content += '='.repeat(50) + '\n\n';

        sortedNotes.forEach((note, index) => {
            content += `${index + 1}. ${note.done ? '[COMPLETED] ' : '[PENDING] '}`;
            if (note.content.trim()) {
                content += note.content.trim();
            } else {
                content += '[Empty note]';
            }
            if (note.imageUrl) {
                content += ' [Contains image]';
            }
            content += '\n\n';
        });

        // Create and download file
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `craft-notes-${this.currentBoard}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Selection functionality
    handleWorkspaceMouseDown(e) {
        // Check if clicking on empty space (not on a note)
        if (e.target === this.workspace || e.target === this.gridOverlay) {
            this.startSelection(e);
        }
    }

    handleWorkspaceMouseMove(e) {
        if (this.isSelecting) {
            this.updateSelection(e);
        }
    }

    handleWorkspaceMouseUp(e) {
        if (this.isSelecting) {
            this.endSelection();
        }
    }

    startSelection(e) {
        this.isSelecting = true;
        this.clearSelection();
        
        const rect = this.workspace.getBoundingClientRect();
        this.selectionStart.x = e.clientX - rect.left;
        this.selectionStart.y = e.clientY - rect.top;
        
        this.selectionBox.style.left = `${this.selectionStart.x}px`;
        this.selectionBox.style.top = `${this.selectionStart.y}px`;
        this.selectionBox.style.width = '0px';
        this.selectionBox.style.height = '0px';
        this.selectionBox.style.display = 'block';
    }

    updateSelection(e) {
        const rect = this.workspace.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        const left = Math.min(this.selectionStart.x, currentX);
        const top = Math.min(this.selectionStart.y, currentY);
        const width = Math.abs(currentX - this.selectionStart.x);
        const height = Math.abs(currentY - this.selectionStart.y);
        
        this.selectionBox.style.left = `${left}px`;
        this.selectionBox.style.top = `${top}px`;
        this.selectionBox.style.width = `${width}px`;
        this.selectionBox.style.height = `${height}px`;
        
        // Update selected notes
        this.updateSelectedNotes(left, top, width, height);
    }

    endSelection() {
        this.isSelecting = false;
        this.selectionBox.style.display = 'none';
    }

    updateSelectedNotes(selectionLeft, selectionTop, selectionWidth, selectionHeight) {
        this.notes.forEach(note => {
            const noteElement = document.getElementById(note.id);
            if (!noteElement) return;
            
            const noteRect = noteElement.getBoundingClientRect();
            const workspaceRect = this.workspace.getBoundingClientRect();
            
            const noteLeft = noteRect.left - workspaceRect.left;
            const noteTop = noteRect.top - workspaceRect.top;
            const noteRight = noteLeft + noteRect.width;
            const noteBottom = noteTop + noteRect.height;
            
            const selectionRight = selectionLeft + selectionWidth;
            const selectionBottom = selectionTop + selectionHeight;
            
            // Check if note intersects with selection
            const intersects = !(noteRight < selectionLeft || 
                               noteLeft > selectionRight || 
                               noteBottom < selectionTop || 
                               noteTop > selectionBottom);
            
            if (intersects) {
                this.selectedNotes.add(note.id);
                noteElement.classList.add('selected');
            } else {
                this.selectedNotes.delete(note.id);
                noteElement.classList.remove('selected');
            }
        });
    }

    clearSelection() {
        this.selectedNotes.clear();
        this.workspace.querySelectorAll('.sticky-note').forEach(note => {
            note.classList.remove('selected');
        });
    }

    deleteSelectedNotes() {
        if (this.selectedNotes.size === 0) return;
        
        // Show confirmation for multiple notes
        if (this.selectedNotes.size > 1) {
            if (!confirm(`Are you sure you want to delete ${this.selectedNotes.size} selected notes?`)) {
                return;
            }
        }
        
        // Save state for undo
        this.saveStateForUndo();
        
        const noteIds = Array.from(this.selectedNotes);
        noteIds.forEach(noteId => {
            const noteElement = document.getElementById(noteId);
            if (noteElement) {
                noteElement.remove();
            }
            this.notes = this.notes.filter(n => n.id !== noteId);
        });
        
        this.selectedNotes.clear();
        this.saveData();
        this.updateBoardCount();
        this.updateUndoButton();
        this.checkDropZoneVisibility();
    }

    // Undo functionality
    saveStateForUndo() {
        const state = {
            notes: JSON.parse(JSON.stringify(this.notes)),
            noteIdCounter: this.noteIdCounter
        };
        
        this.undoStack.push(state);
        
        // Keep stack size manageable
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
    }

    undo() {
        if (this.undoStack.length === 0) return;
        
        const previousState = this.undoStack.pop();
        
        // Clear current notes
        this.workspace.querySelectorAll('.sticky-note').forEach(note => note.remove());
        this.clearSelection();
        
        // Restore previous state
        this.notes = previousState.notes;
        this.noteIdCounter = previousState.noteIdCounter;
        
        // Re-render notes without animation
        this.notes.forEach(note => this.renderNote(note, true));
        
        this.saveData();
        this.updateBoardCount();
        this.updateUndoButton();
        this.checkDropZoneVisibility();
    }

    updateUndoButton() {
        this.undoBtn.disabled = this.undoStack.length === 0;
    }

    // Enhanced color picker functionality
    toggleColorDropdown() {
        this.colorDropdown.classList.toggle('active');
    }

    hideColorDropdown() {
        this.colorDropdown.classList.remove('active');
    }

    setDefaultColor(color) {
        this.defaultColor = color;
        this.colorPreview.style.background = color;
        this.saveData();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StickyNotesApp();
});