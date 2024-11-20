class Modal {
    constructor(id) {
        this.modal = document.getElementById(id);
        this.setupListeners();
    }

    setupListeners() {
        this.modal.querySelector('.close-modal')?.addEventListener('click', () => this.hide());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hide();
        });
    }

    show(data = null) {
        if (data) {
            this.modal.dataset.context = JSON.stringify(data);
        }
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hide() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        delete this.modal.dataset.context;
    }

    getContext() {
        try {
            return JSON.parse(this.modal.dataset.context || '{}');
        } catch {
            return {};
        }
    }
}